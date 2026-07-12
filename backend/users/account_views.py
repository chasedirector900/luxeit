"""Account-owned resources: the address book and saved payment methods.

These live server-side per account — NEVER in device storage — so switching
accounts on a shared phone can't leak one person's details to the next.
Responses are camelCase to match the frontend types.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Address, PaymentMethod


# ── Address book ─────────────────────────────────────────────────────────────

def _address_dict(a: Address) -> dict:
    return {"id": str(a.pk), "line1": a.line1, "city": a.city, "area": a.area, "isDefault": a.is_default}


def _sync_primary_address(user) -> None:
    """Mirror the default address onto the user's primary fields (used by the
    account page and as the checkout fallback)."""
    default = user.addresses.filter(is_default=True).first() or user.addresses.first()
    user.address_line1 = default.line1 if default else ""
    user.address_city = default.city if default else ""
    user.address_area = default.area if default else ""
    user.save(update_fields=["address_line1", "address_city", "address_area"])


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def addresses(request):
    """GET: the user's address book. POST: add an address (de-duped)."""
    if request.method == "GET":
        # First use: seed the book from the primary address saved on the account.
        if not request.user.addresses.exists() and (request.user.address_line1 or request.user.address_city):
            Address.objects.create(
                user=request.user,
                line1=request.user.address_line1,
                city=request.user.address_city,
                area=request.user.address_area,
                is_default=True,
            )
        return Response([_address_dict(a) for a in request.user.addresses.all()])

    line1 = str(request.data.get("line1") or "").strip()[:200]
    city = str(request.data.get("city") or "").strip()[:120]
    area = str(request.data.get("area") or "").strip()[:120]
    if not line1 or not city:
        return Response({"detail": "Street address and city are required."}, status=status.HTTP_400_BAD_REQUEST)

    existing = request.user.addresses.filter(line1__iexact=line1, city__iexact=city, area__iexact=area).first()
    if existing:
        return Response(_address_dict(existing), status=status.HTTP_200_OK)

    address = Address.objects.create(
        user=request.user, line1=line1, city=city, area=area,
        is_default=not request.user.addresses.exists(),
    )
    if address.is_default:
        _sync_primary_address(request.user)
    return Response(_address_dict(address), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def address_default(request, address_id):
    """Make one address the default (and mirror it to the account profile)."""
    if not request.user.addresses.filter(pk=address_id).exists():
        return Response({"detail": "That address no longer exists."}, status=status.HTTP_404_NOT_FOUND)
    request.user.addresses.update(is_default=False)
    request.user.addresses.filter(pk=address_id).update(is_default=True)
    _sync_primary_address(request.user)
    return Response([_address_dict(a) for a in request.user.addresses.all()])


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def address_delete(request, address_id):
    deleted, _ = request.user.addresses.filter(pk=address_id).delete()
    if not deleted:
        return Response({"detail": "That address no longer exists."}, status=status.HTTP_404_NOT_FOUND)
    # Keep exactly one default when any remain.
    if request.user.addresses.exists() and not request.user.addresses.filter(is_default=True).exists():
        first = request.user.addresses.first()
        first.is_default = True
        first.save(update_fields=["is_default"])
    _sync_primary_address(request.user)
    return Response([_address_dict(a) for a in request.user.addresses.all()])


# ── Payment methods (masked display data + gateway token only) ──────────────

def _method_dict(m: PaymentMethod) -> dict:
    data = {"id": str(m.pk), "brand": m.brand, "detail": m.detail, "isDefault": m.is_default}
    if m.exp_month:
        data["expMonth"] = m.exp_month
    if m.exp_year:
        data["expYear"] = m.exp_year
    return data


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def payment_methods(request):
    """GET: saved methods. POST: save a method (masked detail + token only)."""
    if request.method == "GET":
        return Response([_method_dict(m) for m in request.user.payment_methods.all()])

    brand = str(request.data.get("brand") or "").strip()
    detail = str(request.data.get("detail") or "").strip()[:40]
    if brand not in dict(PaymentMethod.BRAND_CHOICES):
        return Response({"detail": "Pick a valid payment type."}, status=status.HTTP_400_BAD_REQUEST)
    if not detail:
        return Response({"detail": "The masked account detail is required."}, status=status.HTTP_400_BAD_REQUEST)

    def _int_or_none(value):
        try:
            return int(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    method = PaymentMethod.objects.create(
        user=request.user,
        brand=brand,
        detail=detail,
        token=str(request.data.get("token") or "")[:128],
        exp_month=_int_or_none(request.data.get("expMonth")),
        exp_year=_int_or_none(request.data.get("expYear")),
        is_default=not request.user.payment_methods.exists() or bool(request.data.get("makeDefault")),
    )
    if method.is_default:
        request.user.payment_methods.exclude(pk=method.pk).update(is_default=False)
    return Response(_method_dict(method), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def payment_method_default(request, method_id):
    if not request.user.payment_methods.filter(pk=method_id).exists():
        return Response({"detail": "That payment method no longer exists."}, status=status.HTTP_404_NOT_FOUND)
    request.user.payment_methods.update(is_default=False)
    request.user.payment_methods.filter(pk=method_id).update(is_default=True)
    return Response([_method_dict(m) for m in request.user.payment_methods.all()])


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def payment_method_delete(request, method_id):
    deleted, _ = request.user.payment_methods.filter(pk=method_id).delete()
    if not deleted:
        return Response({"detail": "That payment method no longer exists."}, status=status.HTTP_404_NOT_FOUND)
    if request.user.payment_methods.exists() and not request.user.payment_methods.filter(is_default=True).exists():
        first = request.user.payment_methods.first()
        first.is_default = True
        first.save(update_fields=["is_default"])
    return Response([_method_dict(m) for m in request.user.payment_methods.all()])
