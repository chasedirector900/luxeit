"""One gate every API error passes through.

Guarantees two things:
1. Nothing technical ever reaches a customer — no stack traces, no database
   errors, no framework wording. Unexpected failures are logged in full for us
   and replaced with a plain-language message for them.
2. No silent errors — every failure produces a JSON body with a human "what
   happened + what to do" detail the frontend can show as-is.
"""
import logging

from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)

FRIENDLY_500 = (
    "Something went wrong on our side — your request didn't go through. "
    "Please try again in a moment; if it keeps happening, reach us via "
    "Account > Help & support."
)


def api_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is None:
        # Unexpected server/database error: full traceback to the logs (for
        # us), plain language to the customer (for them). Never the reverse.
        request = context.get("request")
        logger.exception(
            "Unhandled API error on %s %s",
            getattr(request, "method", "?"),
            getattr(request, "path", "?"),
            exc_info=exc,
        )
        return Response({"detail": FRIENDLY_500}, status=500)

    # DRF's throttle message ("Request was throttled. Expected available in
    # 58 seconds.") reads like a machine. Say it like a person. Views that
    # return their own 429 message (e.g. the OTP circuit breaker) are
    # untouched — this only rewrites the raised Throttled exception.
    if isinstance(exc, Throttled):
        wait = getattr(exc, "wait", None)
        if wait:
            detail = (
                f"You're doing that a little too fast. Please wait about "
                f"{int(wait)} seconds and try again."
            )
        else:
            detail = "You're doing that a little too fast. Please wait a moment and try again."
        response.data = {"detail": detail}

    return response
