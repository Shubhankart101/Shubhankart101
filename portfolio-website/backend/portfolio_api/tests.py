from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import RequestFactory, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase
from unittest.mock import patch

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

    def test_project_list_combines_search_and_category_filters(self):
        response = self.client.get(reverse("project-list"), {"q": "collab", "category": "Product"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual({project["slug"] for project in response.data}, {"CollabDocs", "LaunchCrew"})

    def test_openapi_schema_documents_api_paths_and_filters(self):
        response = self.client.get(reverse("schema"))

        self.assertEqual(response.status_code, 200)
        paths = response.data["paths"]
        self.assertIn("/api/health/", paths)
        self.assertIn("/api/profile/", paths)
        self.assertIn("/api/projects/", paths)
        self.assertIn("/api/projects/{slug}/", paths)
        self.assertIn("/api/contact/", paths)
        self.assertIn("/api/resume/", paths)
        parameters = paths["/api/projects/"]["get"]["parameters"]
        self.assertEqual({parameter["name"] for parameter in parameters}, {"q", "category"})
        self.assertIn("application/pdf", paths["/api/resume/"]["get"]["responses"]["200"]["content"])
        self.assertIn("404", paths["/api/projects/{slug}/"]["get"]["responses"])
        self.assertIn("400", paths["/api/contact/"]["post"]["responses"])
        self.assertIn("429", paths["/api/contact/"]["post"]["responses"])

    def test_swagger_and_redoc_pages_render(self):
        swagger = self.client.get(reverse("swagger-ui"))
        redoc = self.client.get(reverse("redoc"))

        self.assertEqual(swagger.status_code, 200)
        self.assertContains(swagger, 'id="swagger-ui"')
        self.assertContains(swagger, "drf_spectacular_sidecar")
        self.assertEqual(redoc.status_code, 200)
        self.assertContains(redoc, "redoc")
        self.assertContains(redoc, "drf_spectacular_sidecar")

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

    def test_contact_rejects_whitespace_only_name_and_message(self):
        base_payload = {
            "name": "Alex Example",
            "email": "alex@example.com",
            "message": "A complete message with enough useful characters.",
        }
        invalid_payloads = [
            {**base_payload, "name": "   "},
            {**base_payload, "message": "                    "},
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                response = self.client.post(reverse("contact-create"), payload, format="json")
                self.assertEqual(response.status_code, 400)

        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_contact_rate_limit_returns_429(self):
        cache.clear()
        payload = {
            "name": "Alex Example",
            "email": "alex@example.com",
            "message": "I would like to discuss a cloud delivery project.",
        }

        with patch("rest_framework.throttling.AnonRateThrottle.THROTTLE_RATES", {"anon": "1/hour"}):
            first = self.client.post(reverse("contact-create"), payload, format="json")
            second = self.client.post(reverse("contact-create"), payload, format="json")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 429)
        cache.clear()

    def test_resume_download_uses_pdf_response(self):
        response = self.client.get(reverse("resume-download"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("attachment", response["Content-Disposition"])

    def test_not_found_page_links_to_the_github_readme(self):
        with self.settings(DEBUG=False):
            response = self.client.get("/missing-portfolio-route/")

        self.assertEqual(response.status_code, 404)
        self.assertContains(response, "Open static GitHub Pages backup", status_code=404)
        self.assertContains(response, "Open profile README", status_code=404)

    def test_server_error_page_links_to_the_github_readme(self):
        from .views import server_error

        response = server_error(RequestFactory().get("/"))

        self.assertEqual(response.status_code, 500)
        self.assertContains(response, "Open static GitHub Pages backup", status_code=500)
        self.assertContains(response, "Open profile README", status_code=500)

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