from django.contrib import admin
from django.conf import settings
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/", include("portfolio_api.urls")),
]

handler404 = "portfolio_api.views.page_not_found"
handler500 = "portfolio_api.views.server_error"

if (settings.FRONTEND_DIST_DIR / "index.html").is_file():
    frontend_view = TemplateView.as_view(template_name="index.html")
    urlpatterns += [
        path("", frontend_view, name="portfolio-home"),
        re_path(r"^(?!api/|admin/|static/).*$", frontend_view, name="portfolio-spa"),
    ]