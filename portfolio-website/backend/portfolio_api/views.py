from pathlib import Path

from django.conf import settings
from django.db.models import Q
from django.http import FileResponse, Http404
from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import ContactMessage, Project
from .serializers import ContactMessageSerializer, ProjectSerializer


class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class ProfileView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response(
            {
                "name": "Shubhankar Thapliyal",
                "role": "Azure DevOps Engineer | Technical Lead",
                "location": "New Delhi, India",
                "email": "shubhankar.thapliyal@gmail.com",
                "linkedin": "https://www.linkedin.com/in/shubhankarthapliyal",
                "github": "https://github.com/Shubhankart101",
                "summary": (
                    "I build reliable cloud delivery platforms through CI/CD, "
                    "infrastructure as code, and production-focused engineering."
                ),
                "years_experience": 8,
                "deployment_improvement": 35,
                "incident_resolution_improvement": 25,
                "technologies": [
                    "Azure",
                    "AWS",
                    "Django",
                    "Terraform",
                    "Ansible",
                    "Kubernetes",
                ],
            }
        )


class ProjectListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ProjectSerializer

    def get_queryset(self):
        projects = Project.objects.filter(featured=True)
        query = self.request.query_params.get("q", "").strip()
        category = self.request.query_params.get("category", "").strip()

        if query:
            projects = projects.filter(
                Q(title__icontains=query)
                | Q(summary__icontains=query)
                | Q(description__icontains=query)
                | Q(category__icontains=query)
            )
        if category and category.lower() != "all":
            projects = projects.filter(category__iexact=category)
        return projects


class ProjectDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ProjectSerializer
    queryset = Project.objects.filter(featured=True)
    lookup_field = "slug"


class ContactCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AnonRateThrottle]
    serializer_class = ContactMessageSerializer
    queryset = ContactMessage.objects.all()


def resume_download(request):
    resume_path = Path(settings.BASE_DIR).parent.parent / "RESUME.pdf"
    if not resume_path.is_file():
        raise Http404("Resume file not found.")
    return FileResponse(
        resume_path.open("rb"),
        as_attachment=True,
        filename="Shubhankar-Thapliyal-Resume.pdf",
        content_type="application/pdf",
    )


def page_not_found(request, exception):
    return render(request, "errors/404.html", status=404)


def server_error(request):
    return render(request, "errors/500.html", status=500)