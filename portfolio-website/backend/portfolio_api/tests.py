from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import ContactMessage, Project


class PortfolioApiTests(APITestCase):
    def test_health_and_profile_endpoints(self):
        health = self.client.get(reverse("health"))
        profile = self.client.get(reverse("profile"))

        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.data["status"], "ok")
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data["name"], "Shubhankar Thapliyal")

    def test_project_list_is_seeded_and_searchable(self):
        response = self.client.get(reverse("project-list"), {"q": "CollabDocs"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["slug"], "CollabDocs")

    def test_project_list_filters_by_category(self):
        response = self.client.get(reverse("project-list"), {"category": "API"})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data)
        self.assertTrue(all(project["category"] == "API" for project in response.data))

    def test_project_detail_returns_not_found_for_unknown_slug(self):
        response = self.client.get(reverse("project-detail", args=["not-a-project"]))

        self.assertEqual(response.status_code, 404)

    def test_project_detail_returns_seeded_project(self):
        response = self.client.get(reverse("project-detail", args=["CollabDocs"]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "CollabDocs")

    def test_contact_submission_is_validated_and_persisted(self):
        response = self.client.post(
            reverse("contact-create"),
            {
                "name": "  Alex Example  ",
                "email": "alex@example.com",
                "subject": "Platform discussion",
                "message": "I would like to discuss a cloud delivery project.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        saved = ContactMessage.objects.get()
        self.assertEqual(saved.name, "Alex Example")
        self.assertEqual(saved.email, "alex@example.com")

    def test_contact_rejects_bad_email_and_short_message(self):
        response = self.client.post(
            reverse("contact-create"),
            {"name": "Alex", "email": "not-an-email", "message": "short"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_resume_download_uses_pdf_response(self):
        response = self.client.get(reverse("resume-download"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("attachment", response["Content-Disposition"])

    def test_admin_can_view_seeded_projects(self):
        admin = get_user_model().objects.create_superuser(
            username="portfolio-admin",
            email="admin@example.com",
            password="test-password-only",
        )
        self.client.force_login(admin)

        response = self.client.get(reverse("admin:portfolio_api_project_changelist"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "CollabDocs")