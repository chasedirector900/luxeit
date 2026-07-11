from django.contrib import admin, messages as admin_messages
from django.contrib.auth import get_user_model
from django.db.models import OuterRef, Q, Subquery
from django.shortcuts import redirect, render
from django.urls import path, reverse

from .models import Message, SenderRole, Thread, ThreadKind
from .services import broadcast_promo, post_message, wants_notification


def _awaiting_reply_qs(qs):
    """Support threads whose newest message is from the customer."""
    last_sender = (
        Message.objects.filter(thread=OuterRef("pk")).order_by("-created_at").values("sender")[:1]
    )
    return qs.annotate(_last_sender=Subquery(last_sender)).filter(_last_sender=SenderRole.USER)


class AwaitingReplyFilter(admin.SimpleListFilter):
    """Surface the support queue: conversations whose newest message is from the
    customer, i.e. nobody from Luxeit has answered yet."""

    title = "awaiting reply"
    parameter_name = "awaiting"

    def lookups(self, request, model_admin):
        return [("yes", "Awaiting agent reply")]

    def queryset(self, request, queryset):
        if self.value() != "yes":
            return queryset
        return _awaiting_reply_qs(queryset)


class MessageInline(admin.TabularInline):
    model = Message
    extra = 1
    fields = ("sender", "body", "agent", "read", "created_at")
    readonly_fields = ("created_at",)
    ordering = ("created_at",)

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        # New reply rows default to a human Support agent, so staff can just
        # type and save without re-picking the sender each time.
        formset.form.base_fields["sender"].initial = SenderRole.SUPPORT
        return formset


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = ("customer", "name", "kind", "awaiting_reply", "message_count", "updated_at")
    list_filter = ("kind", AwaitingReplyFilter)
    search_fields = ("name", "user__email", "user__phone")
    inlines = [MessageInline]
    change_list_template = "admin/messaging/thread/change_list.html"

    # Threads are created by the app (or the promotion composer) — not by hand.
    def has_add_permission(self, request):
        return False

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user").prefetch_related("messages")

    # ── Support inbox: the two-way conversations, chat-style ─────────────────
    def get_urls(self):
        v = self.admin_site.admin_view
        custom = [
            path("support-inbox/", v(self.support_inbox_view), name="messaging_thread_support_inbox"),
            path("support-inbox/<int:thread_id>/", v(self.support_chat_view), name="messaging_thread_support_chat"),
        ]
        return custom + super().get_urls()

    def support_inbox_view(self, request):
        current = request.GET.get("filter", "awaiting")
        q = request.GET.get("q", "").strip()
        base = Thread.objects.filter(kind=ThreadKind.SUPPORT).select_related("user").prefetch_related("messages")
        qs = _awaiting_reply_qs(base) if current == "awaiting" else base
        if q:
            qs = qs.filter(Q(user__email__icontains=q) | Q(user__phone__icontains=q) | Q(user__full_name__icontains=q))

        rows = []
        for t in qs.order_by("-updated_at")[:100]:
            msgs = list(t.messages.all())
            last = msgs[-1] if msgs else None
            rows.append({
                "thread": t,
                "customer": t.user.email or t.user.phone or f"user #{t.user_id}",
                "initial": (t.user.full_name or t.user.email or t.user.phone or "?")[:1].upper(),
                "last": last,
                "awaiting": bool(last and last.sender == SenderRole.USER),
                "count": len(msgs),
                "url": reverse("admin:messaging_thread_support_chat", args=[t.pk]),
            })
        context = {
            **self.admin_site.each_context(request),
            "title": "Support inbox",
            "rows": rows, "current": current, "q": q,
            "counts": {
                "awaiting": _awaiting_reply_qs(Thread.objects.filter(kind=ThreadKind.SUPPORT)).count(),
                "all": Thread.objects.filter(kind=ThreadKind.SUPPORT).count(),
            },
        }
        return render(request, "admin/messaging/support_inbox.html", context)

    def support_chat_view(self, request, thread_id):
        thread = (
            Thread.objects.filter(pk=thread_id, kind=ThreadKind.SUPPORT)
            .select_related("user").prefetch_related("messages__agent").first()
        )
        if thread is None:
            admin_messages.error(request, "That conversation no longer exists.")
            return redirect("admin:messaging_thread_support_inbox")

        if request.method == "POST":
            body = request.POST.get("body", "").strip()
            if body:
                Message.objects.create(thread=thread, sender=SenderRole.SUPPORT, agent=request.user, body=body)
                thread.touch()
                admin_messages.success(request, "Reply sent — the customer sees it in their Luxeit inbox.")
            return redirect("admin:messaging_thread_support_chat", thread_id=thread.pk)

        context = {
            **self.admin_site.each_context(request),
            "title": f"Support · {thread.user}",
            "thread": thread,
            "customer": thread.user.email or thread.user.phone or f"user #{thread.user_id}",
            "customer_name": thread.user.full_name or "",
            "initial": (thread.user.full_name or thread.user.email or thread.user.phone or "?")[:1].upper(),
            "chat": thread.messages.all(),
            "back_url": reverse("admin:messaging_thread_support_inbox"),
        }
        return render(request, "admin/messaging/support_chat.html", context)

    @admin.display(description="Customer")
    def customer(self, obj):
        return obj.user.email or obj.user.phone or f"user #{obj.user_id}"

    @admin.display(description="Messages")
    def message_count(self, obj):
        return len(obj.messages.all())  # uses the prefetch cache, no extra query

    @admin.display(boolean=True, description="Awaiting reply")
    def awaiting_reply(self, obj):
        msgs = list(obj.messages.all())  # prefetched, ordered oldest -> newest
        return bool(msgs and msgs[-1].sender == SenderRole.USER)

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for obj in instances:
            # Stamp the logged-in staff member as the agent on new support
            # replies so the customer sees who answered.
            if obj.sender == SenderRole.SUPPORT and obj.agent_id is None:
                obj.agent = request.user
            obj.save()
        formset.save_m2m()
        for obj in formset.deleted_objects:
            obj.delete()

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        form.instance.touch()  # bump ordering when staff add a reply


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("thread", "sender", "agent", "preview", "read", "created_at")
    list_filter = ("sender", "read")
    search_fields = ("body", "thread__name", "thread__user__email")
    change_list_template = "admin/messaging/message/change_list.html"

    # Messages flow through the app, the support inbox and the promotion
    # composer — never typed in raw here.
    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        # Same agent stamping when replying from the standalone Message editor.
        if obj.sender == SenderRole.SUPPORT and obj.agent_id is None:
            obj.agent = request.user
        super().save_model(request, obj, form, change)

    @admin.display(description="Body")
    def preview(self, obj):
        return obj.body[:60]

    # ── Promotion composer ───────────────────────────────────────────────────
    def get_urls(self):
        custom = [
            path(
                "send-promotion/",
                self.admin_site.admin_view(self.send_promotion_view),
                name="messaging_message_send_promotion",
            ),
        ]
        return custom + super().get_urls()

    def send_promotion_view(self, request):
        User = get_user_model()
        error = None

        if request.method == "POST":
            title = request.POST.get("title", "").strip() or "Luxeit Promotions"
            body = request.POST.get("body", "").strip()
            audience = request.POST.get("audience", "all")
            if not body:
                error = "Write the promotion message first."
            elif audience == "specific":
                ids = request.POST.getlist("users")
                targets = list(User.objects.filter(pk__in=ids, is_active=True))
                if not targets:
                    error = "Pick at least one customer."
                else:
                    sent = skipped = 0
                    for user in targets:
                        if wants_notification(user, "promotions"):
                            post_message(user=user, kind=ThreadKind.PROMO, slug="luxeit-promotions", name=title, body=body)
                            sent += 1
                        else:
                            skipped += 1
                    note = f" ({skipped} skipped — opted out of promotions)" if skipped else ""
                    admin_messages.success(request, f"Promotion sent to {sent} customer{'' if sent == 1 else 's'}{note}.")
                    return redirect("admin:messaging_message_send_promotion")
            else:
                reached = broadcast_promo(body, name=title)
                admin_messages.success(request, f"Promotion sent to {reached} customer{'' if reached == 1 else 's'} (opt-outs skipped automatically).")
                return redirect("admin:messaging_message_send_promotion")

        customers = [
            {"id": u.pk, "label": (u.full_name or "").strip() or (u.email or u.phone or f"user #{u.pk}"),
             "contact": u.email or u.phone or ""}
            for u in User.objects.filter(is_active=True, is_staff=False).order_by("full_name", "email")
        ]
        context = {
            **self.admin_site.each_context(request),
            "title": "Send a promotion",
            "customers": customers,
            "customer_count": len(customers),
            "error": error,
            "posted": request.POST if request.method == "POST" else None,
        }
        return render(request, "admin/messaging/send_promotion.html", context)
