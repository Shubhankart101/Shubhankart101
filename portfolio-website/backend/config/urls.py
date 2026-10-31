from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("portfolio_api.urls")),
]

handler404 = "portfolio_api.views.page_not_found"
handler500 = "portfolio_api.views.server_error"