from django.contrib import admin
from django.db.models import OuterRef, Subquery

from .models import Message, SenderRole, Thread


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
        last_sender = (
            Message.objects.filter(thread=OuterRef("pk"))
            .order_by("-created_at")
            .values("sender")[:1]
        )
        return queryset.annotate(_last_sender=Subquery(last_sender)).filter(
            _last_sender=SenderRole.USER
        )


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

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user").prefetch_related("messages")

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

    def save_model(self, request, obj, form, change):
        # Same agent stamping when replying from the standalone Message editor.
        if obj.sender == SenderRole.SUPPORT and obj.agent_id is None:
            obj.agent = request.user
        super().save_model(request, obj, form, change)

    @admin.display(description="Body")
    def preview(self, obj):
        return obj.body[:60]
