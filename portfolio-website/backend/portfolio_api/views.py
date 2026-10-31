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
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, OpenApiTypes, extend_schema

from .models import ContactMessage, Project
from .serializers import (
    ContactMessageSerializer,
    HealthSerializer,
    ProfileSerializer,
    ProjectSerializer,
)


@extend_schema(tags=["System"], summary="Check API health", responses=HealthSerializer)
class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok"})


@extend_schema(tags=["Profile"], summary="Read portfolio profile", responses=ProfileSerializer)
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


@extend_schema(
    tags=["Projects"],
    summary="List and filter featured projects",
    parameters=[
        OpenApiParameter(
            name="q",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Search project titles, summaries, descriptions, and categories.",
        ),
        OpenApiParameter(
            name="category",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by project category; use All or omit to include every category.",
        ),
    ],
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


@extend_schema(
    tags=["Projects"],
    summary="Read a featured project by slug",
    responses={
        200: ProjectSerializer,
        404: OpenApiResponse(description="No featured project exists with this slug."),
    },
)
class ProjectDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ProjectSerializer
    queryset = Project.objects.filter(featured=True)
    lookup_field = "slug"


@extend_schema(
    tags=["Contact"],
    summary="Send a portfolio contact message",
    request=ContactMessageSerializer,
    responses={
        201: ContactMessageSerializer,
        400: OpenApiResponse(description="The contact fields did not pass validation."),
        429: OpenApiResponse(description="The anonymous contact rate limit was exceeded."),
    },
)
class ContactCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AnonRateThrottle]
    serializer_class = ContactMessageSerializer
    queryset = ContactMessage.objects.all()


@extend_schema(
    tags=["Documents"],
    summary="Download the PDF resume",
    responses={
        (200, "application/pdf"): OpenApiTypes.BINARY,
        404: OpenApiResponse(description="The resume PDF is not present on the server."),
    },
)
class ResumeDownloadView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
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