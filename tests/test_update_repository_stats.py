import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.update_repository_stats import (
    END_MARKER,
    START_MARKER,
    fetch_repositories,
    normalize_repository,
    render_readme_section,
    replace_marked_section,
    summarize_repositories,
)


class RepositoryStatsTests(unittest.TestCase):
    def setUp(self):
        self.repositories = [
            {
                "name": "CloudKit",
                "url": "https://github.com/Shubhankart101/CloudKit",
                "description": "Cloud platform tooling",
                "language": "Python",
                "stars": 5,
                "forks": 2,
                "watchers": 7,
                "openIssues": 1,
                "updatedAt": "2026-10-10T12:00:00Z",
                "isFork": False,
                "isArchived": False,
            },
            {
                "name": "PipelineLab",
                "url": "https://github.com/Shubhankart101/PipelineLab",
                "description": "Build pipeline examples",
                "language": "Python",
                "stars": 3,
                "forks": 1,
                "watchers": 4,
                "openIssues": 2,
                "updatedAt": "2026-10-12T12:00:00Z",
                "isFork": True,
                "isArchived": False,
            },
            {
                "name": "SiteNotes",
                "url": "https://github.com/Shubhankart101/SiteNotes",
                "description": "Static documentation",
                "language": "Other",
                "stars": 2,
                "forks": 0,
                "watchers": 2,
                "openIssues": 0,
                "updatedAt": "invalid-date",
                "isFork": False,
                "isArchived": True,
            },
        ]

    def test_normalize_repository_handles_missing_stats_and_language(self):
        normalized = normalize_repository({
            "name": "NoLanguage",
            "html_url": "https://github.com/Shubhankart101/NoLanguage",
        })

        self.assertEqual(normalized["language"], "Other")
        self.assertEqual(normalized["description"], "No repository description provided.")
        self.assertEqual(normalized["stars"], 0)
        self.assertFalse(normalized["isFork"])

    def test_summary_adds_total_metrics_and_language_groups(self):
        summary = summarize_repositories(self.repositories)

        self.assertEqual(summary["repositories"], 3)
        self.assertEqual(summary["stars"], 10)
        self.assertEqual(summary["forks"], 3)
        self.assertEqual(summary["watchers"], 13)
        self.assertEqual(summary["openIssues"], 3)
        self.assertEqual(summary["sourceRepositories"], 2)
        self.assertEqual(summary["forkRepositories"], 1)
        self.assertEqual(summary["archivedRepositories"], 1)
        self.assertEqual(summary["languages"]["Python"]["repositories"], 2)
        self.assertEqual(summary["languages"]["Other"]["stars"], 2)

    def test_readme_renderer_includes_grouped_and_per_repository_stats(self):
        rendered = render_readme_section(self.repositories)

        self.assertTrue(rendered.startswith("<details>"))
        self.assertTrue(rendered.endswith("</details>"))
        self.assertIn("### Grouped by primary language", rendered)
        self.assertIn("### Every public repository", rendered)
        self.assertIn("[CloudKit](https://github.com/Shubhankart101/CloudKit)", rendered)
        self.assertIn("| Other | 1 | 2 | 0 | 2 |", rendered)
        self.assertIn("| [SiteNotes](https://github.com/Shubhankart101/SiteNotes) | Other | 2 | 0 | 2 | 0 | Unknown | Archived |", rendered)

    def test_replace_marked_section_preserves_surrounding_readme(self):
        source = f"Before\n{START_MARKER}\nold\n{END_MARKER}\nAfter"

        updated = replace_marked_section(source, "generated")

        self.assertIn("Before", updated)
        self.assertIn("generated", updated)
        self.assertIn("After", updated)
        self.assertNotIn("old", updated)

    def test_replace_marked_section_rejects_missing_or_duplicate_markers(self):
        with self.assertRaises(ValueError):
            replace_marked_section("no markers", "generated")
        with self.assertRaises(ValueError):
            replace_marked_section(f"{START_MARKER}{END_MARKER}{START_MARKER}{END_MARKER}", "generated")

    def test_fetch_repositories_follows_all_api_pages(self):
        first_page = [
            {
                "name": f"Repo{number:03}",
                "html_url": f"https://github.com/Shubhankart101/Repo{number:03}",
                "language": "Python",
                "stargazers_count": 1,
            }
            for number in range(100)
        ]
        second_page = [{
            "name": "LastRepo",
            "html_url": "https://github.com/Shubhankart101/LastRepo",
            "language": None,
        }]
        response_pages = [
            io.BytesIO(json.dumps(first_page).encode("utf-8")),
            io.BytesIO(json.dumps(second_page).encode("utf-8")),
        ]
        with patch("urllib.request.urlopen", side_effect=response_pages) as open_url:
            repositories = fetch_repositories("test-token")

        self.assertEqual(len(repositories), 101)
        self.assertEqual(repositories[-1]["name"], "Repo099")
        self.assertEqual(repositories[0]["language"], "Other")
        self.assertEqual(open_url.call_count, 2)
        self.assertIn("page=2", open_url.call_args_list[1].args[0].full_url)
        self.assertEqual(open_url.call_args_list[0].args[0].get_header("Authorization"), "Bearer test-token")


if __name__ == "__main__":
    unittest.main()
