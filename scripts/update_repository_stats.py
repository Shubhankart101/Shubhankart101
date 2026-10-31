"""Refresh GitHub repository statistics in the profile README and static backup."""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
README_PATH = ROOT / "README.md"
STATIC_JSON_PATH = ROOT / "portfolio-website" / "frontend" / "public" / "repos.json"
USERNAME = "Shubhankart101"
START_MARKER = "<!-- GITHUB_REPO_STATS_START -->"
END_MARKER = "<!-- GITHUB_REPO_STATS_END -->"
API_URL = f"https://api.github.com/users/{USERNAME}/repos"
PER_PAGE = 100


def normalize_repository(repository):
    return {
        "name": repository["name"],
        "url": repository["html_url"],
        "description": repository.get("description") or "No repository description provided.",
        "language": repository.get("language") or "Other",
        "stars": int(repository.get("stargazers_count") or 0),
        "forks": int(repository.get("forks_count") or 0),
        "watchers": int(repository.get("watchers_count") or 0),
        "openIssues": int(repository.get("open_issues_count") or 0),
        "updatedAt": repository.get("updated_at") or "",
        "isFork": bool(repository.get("fork")),
        "isArchived": bool(repository.get("archived")),
    }


def fetch_repositories(token=None):
    repositories = []
    page = 1
    while True:
        query = urllib.parse.urlencode({"per_page": PER_PAGE, "page": page, "sort": "full_name"})
        headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "Shubhankart101-portfolio-stats",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        request = urllib.request.Request(f"{API_URL}?{query}", headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            try:
                detail = json.loads(body).get("message", body)
            except json.JSONDecodeError:
                detail = body
            raise RuntimeError(f"GitHub API request failed ({error.code}): {detail}") from error
        except urllib.error.URLError as error:
            raise RuntimeError(f"Could not reach the GitHub API: {error.reason}") from error

        if not isinstance(payload, list):
            raise RuntimeError("GitHub API returned an unexpected repository payload.")
        repositories.extend(normalize_repository(repository) for repository in payload)
        if len(payload) < PER_PAGE:
            return sorted(repositories, key=lambda repository: repository["name"].casefold())
        page += 1


def summarize_repositories(repositories):
    groups = defaultdict(lambda: {"repositories": 0, "stars": 0, "forks": 0, "watchers": 0})
    for repository in repositories:
        language = repository.get("language") or "Other"
        group = groups[language]
        group["repositories"] += 1
        group["stars"] += repository["stars"]
        group["forks"] += repository["forks"]
        group["watchers"] += repository["watchers"]

    return {
        "repositories": len(repositories),
        "stars": sum(repository["stars"] for repository in repositories),
        "forks": sum(repository["forks"] for repository in repositories),
        "watchers": sum(repository["watchers"] for repository in repositories),
        "openIssues": sum(repository["openIssues"] for repository in repositories),
        "sourceRepositories": sum(not repository["isFork"] for repository in repositories),
        "forkRepositories": sum(repository["isFork"] for repository in repositories),
        "archivedRepositories": sum(repository["isArchived"] for repository in repositories),
        "languages": groups,
    }


def markdown_cell(value):
    return str(value).replace("|", "\\|").replace("\r", " ").replace("\n", " ")


def display_date(value):
    if not value:
        return "Unknown"
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return "Unknown"


def render_readme_section(repositories):
    summary = summarize_repositories(repositories)
    lines = [
        "<details>",
        f"<summary><strong>{summary['repositories']} public repositories · {summary['stars']} stars · {summary['forks']} forks</strong></summary>",
        "",
        f"**{summary['sourceRepositories']} original · {summary['forkRepositories']} forks · {summary['watchers']} watchers · {summary['openIssues']} open issues**",
        "",
        "### Grouped by primary language",
        "",
        "| Language | Repositories | Stars | Forks | Watchers |",
        "|:--|--:|--:|--:|--:|",
    ]
    language_rows = sorted(summary["languages"].items(), key=lambda item: (-item[1]["repositories"], item[0].casefold()))
    for language, metrics in language_rows:
        lines.append(
            f"| {markdown_cell(language)} | {metrics['repositories']} | {metrics['stars']} | {metrics['forks']} | {metrics['watchers']} |"
        )

    lines.extend([
        "",
        "### Every public repository",
        "",
        "| Repository | Primary language | Stars | Forks | Watchers | Open issues | Updated | Type |",
        "|:--|:--|--:|--:|--:|--:|:--|:--|",
    ])
    for repository in sorted(repositories, key=lambda item: item["name"].casefold()):
        repo_name = markdown_cell(repository["name"])
        repo_url = repository["url"]
        repo_type = "Fork" if repository["isFork"] else "Archived" if repository["isArchived"] else "Source"
        lines.append(
            f"| [{repo_name}]({repo_url}) | {markdown_cell(repository['language'])} | {repository['stars']} | {repository['forks']} | {repository['watchers']} | {repository['openIssues']} | {display_date(repository['updatedAt'])} | {repo_type} |"
        )
    lines.extend([
        "",
        "<sub>Generated from GitHub's public API. Grouped by each repository's primary language.</sub>",
        "",
        "</details>",
    ])
    return "\n".join(lines)


def replace_marked_section(readme, generated_section):
    if readme.count(START_MARKER) != 1 or readme.count(END_MARKER) != 1:
        raise ValueError("README must contain exactly one repository stats marker pair.")
    start = readme.index(START_MARKER) + len(START_MARKER)
    end = readme.index(END_MARKER)
    if start >= end:
        raise ValueError("Repository stats markers are in the wrong order.")
    return readme[:start] + "\n" + generated_section + "\n" + readme[end:]


def write_if_changed(path, content):
    previous = path.read_text(encoding="utf-8") if path.exists() else None
    if previous != content:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return True
    return False


def main():
    repositories = fetch_repositories(os.getenv("GITHUB_TOKEN"))
    readme = README_PATH.read_text(encoding="utf-8")
    updated_readme = replace_marked_section(readme, render_readme_section(repositories))
    json_snapshot = json.dumps(repositories, indent=2, ensure_ascii=False) + "\n"
    readme_changed = write_if_changed(README_PATH, updated_readme)
    snapshot_changed = write_if_changed(STATIC_JSON_PATH, json_snapshot)
    print(f"Fetched {len(repositories)} public repositories.")
    print(f"README updated: {readme_changed}; static snapshot updated: {snapshot_changed}.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, ValueError) as error:
        print(f"Repository stats update failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
