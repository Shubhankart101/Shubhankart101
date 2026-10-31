from django.db import migrations, models


PROJECTS = [
    ("AccountCare", "API", "Account-care workflows and service integration.", "An account-care workflow and service integration API.", ["Python", "Django", "REST API"]),
    ("BoundedGraphRunner-TraceExtractor", "Automation", "Bounded graph execution and trace extraction.", "A focused runner for bounded graph workflows with trace inspection.", ["Python", "Graph workflows", "Testing"]),
    ("CollabDocs", "Product", "A collaborative document platform.", "A shared workspace for creating, organizing, and collaborating on documents.", ["Python", "Django", "Collaboration"]),
    ("DevTrack", "DevOps", "Issue tracking with automated delivery and cloud infrastructure.", "A Django issue-tracking API with automated tests, GitHub Actions, and Terraform-managed Azure infrastructure.", ["Python", "Django", "GitHub Actions", "Terraform"]),
    ("EventHub", "Product", "Experiments in event-driven application design.", "A practical repository for exploring event-based application patterns and integrations.", ["Python", "Events", "APIs"]),
    ("FlightPriceMonitorAlertSystem", "Automation", "Flight price monitoring with useful alerts.", "A small automation project for tracking flight prices and surfacing changes.", ["Python", "Automation", "Alerts"]),
    ("India-s-Journey", "Data", "A public-data dashboard about India's progress.", "An independent dashboard with mixed-frequency indicators, official-source links, and automated refresh workflows.", ["Python", "Data visualization", "GitHub Actions"]),
    ("LaunchCrew", "Product", "A launch-focused collaboration workspace.", "A project workspace for coordinating launch activity, team updates, and delivery tasks.", ["Python", "Django", "Product"]),
    ("MeetGuard", "Platform", "Meeting coordination and safeguards.", "A meeting-focused application for organizing sessions and keeping collaboration structured.", ["Python", "Django", "Web application"]),
    ("NovaNotebook", "Product", "A notebook workspace for capturing and organizing ideas.", "A notebook application for keeping structured notes and project context together.", ["Python", "Django", "Product"]),
    ("SafeLocalToolDispatcher", "Automation", "A controlled dispatcher for local tools.", "A local tool execution project focused on predictable routing and safe boundaries.", ["Python", "Tooling", "Automation"]),
    ("SubLedger", "API", "Subscription and billing system.", "A service-oriented billing application with API-first workflows.", ["Python", "FastAPI", "Billing"]),
    ("TeamBoard", "Product", "A B2B knowledge base API platform.", "A team knowledge platform built to organize internal documentation and shared knowledge.", ["Python", "Django", "REST API"]),
    ("WEB_API_L1", "API", "Foundational service and API engineering.", "A starter C# Web API project focused on foundational service design.", ["C#", ".NET", "REST API"]),
    ("WEB_API_L2", "API", "Backend implementation and API engineering.", "A C# Web API project focused on practical backend implementation.", ["C#", ".NET", "REST API"]),
    ("WEB_API_L3", "API", "Advanced service and API design.", "A C# Web API project focused on advanced API patterns and service design.", ["C#", ".NET", "REST API"]),
]


def seed_projects(apps, schema_editor):
    Project = apps.get_model("portfolio_api", "Project")
    for sort_order, (slug, category, summary, description, stack) in enumerate(PROJECTS):
        Project.objects.create(
            title=slug,
            slug=slug,
            summary=summary,
            description=description,
            category=category,
            stack=stack,
            repo_url=f"https://github.com/Shubhankart101/{slug}",
            sort_order=sort_order,
        )


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ContactMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("email", models.EmailField(max_length=254)),
                ("subject", models.CharField(blank=True, max_length=150)),
                ("message", models.TextField(max_length=5000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("is_read", models.BooleanField(default=False)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=120)),
                ("slug", models.SlugField(unique=True)),
                ("summary", models.CharField(max_length=240)),
                ("description", models.TextField()),
                ("category", models.CharField(db_index=True, max_length=60)),
                ("stack", models.JSONField(default=list)),
                ("repo_url", models.URLField()),
                ("demo_url", models.URLField(blank=True)),
                ("featured", models.BooleanField(default=True)),
                ("sort_order", models.PositiveSmallIntegerField(default=0)),
            ],
            options={"ordering": ["sort_order", "title"]},
        ),
        migrations.RunPython(seed_projects, migrations.RunPython.noop),
    ]