"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from config import admin_config  # noqa: F401  (applies admin branding + ordering)
from users import staff_auth

urlpatterns = [
    # Passwordless admin sign-in (email OTP / Google) — must come before the
    # admin's own urls since it posts to these from admin/login.html, and
    # these views themselves are pre-login (no admin_view() wrapper).
    path('admin/login/otp/request/', staff_auth.staff_otp_request, name='staff_otp_request'),
    path('admin/login/otp/verify/', staff_auth.staff_otp_verify, name='staff_otp_verify'),
    path('admin/login/google/', staff_auth.staff_google_login, name='staff_google_login'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/inbox/', include('messaging.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('products.urls')),
    path('api/', include('api.urls')),
]

# In local dev (DEBUG, no R2 configured) the dev server serves uploaded files.
# In production uploads live in R2 and are served from its public host, so this
# route isn't used.
if settings.DEBUG and not settings.R2_BUCKET:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
