"""Per-endpoint rate limits for abuse-prone writes.

The global anon/user ceilings live in settings (DEFAULT_THROTTLE_CLASSES);
these scoped classes add tighter limits on expensive or spammable actions.
They only count unsafe methods, so reads on the same endpoint stay free.
Rates are configured in REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"].
"""
from rest_framework.throttling import UserRateThrottle

SAFE_METHODS = ("GET", "HEAD", "OPTIONS")


class WriteOnlyUserRateThrottle(UserRateThrottle):
    def allow_request(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return super().allow_request(request, view)


class OrderCreateThrottle(WriteOnlyUserRateThrottle):
    """Nobody legitimately places 30+ orders in an hour."""
    scope = "orders_create"


class ReviewThrottle(WriteOnlyUserRateThrottle):
    """Review spam guard — posting/updating reviews."""
    scope = "reviews"


class SupportMessageThrottle(WriteOnlyUserRateThrottle):
    """Support chat flood guard."""
    scope = "support_send"
