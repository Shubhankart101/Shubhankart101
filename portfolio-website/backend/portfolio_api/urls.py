from django.urls import path

from .views import (
    ContactCreateView,
    HealthCheckView,
    ProfileView,
    ProjectDetailView,
    ProjectListView,
    resume_download,
)


urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("projects/", ProjectListView.as_view(), name="project-list"),
    path("projects/<slug:slug>/", ProjectDetailView.as_view(), name="project-detail"),
    path("contact/", ContactCreateView.as_view(), name="contact-create"),
    path("resume/", resume_download, name="resume-download"),
]