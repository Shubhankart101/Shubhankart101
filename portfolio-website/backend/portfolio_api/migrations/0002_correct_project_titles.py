from django.db import migrations


PROJECT_SUMMARIES = {
    "AccountCare": "Account-care workflows and service integration.",
    "BoundedGraphRunner-TraceExtractor": "Bounded graph execution and trace extraction.",
    "CollabDocs": "A collaborative document platform.",
    "DevTrack": "Issue tracking with automated delivery and cloud infrastructure.",
    "EventHub": "Experiments in event-driven application design.",
    "FlightPriceMonitorAlertSystem": "Flight price monitoring with useful alerts.",
    "India-s-Journey": "A public-data dashboard about India's progress.",
    "LaunchCrew": "A launch-focused collaboration workspace.",
    "MeetGuard": "Meeting coordination and safeguards.",
    "NovaNotebook": "A notebook workspace for capturing and organizing ideas.",
    "SafeLocalToolDispatcher": "A controlled dispatcher for local tools.",
    "SubLedger": "Subscription and billing system.",
    "TeamBoard": "A B2B knowledge base API platform.",
    "WEB_API_L1": "Foundational service and API engineering.",
    "WEB_API_L2": "Backend implementation and API engineering.",
    "WEB_API_L3": "Advanced service and API design.",
}


def correct_project_content(apps, schema_editor):
    Project = apps.get_model("portfolio_api", "Project")
    for slug, summary in PROJECT_SUMMARIES.items():
        Project.objects.filter(slug=slug).update(title=slug, summary=summary)


class Migration(migrations.Migration):
    dependencies = [("portfolio_api", "0001_initial")]

    operations = [migrations.RunPython(correct_project_content, migrations.RunPython.noop)]
