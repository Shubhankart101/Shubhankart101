# Shubhankar Thapliyal | Portfolio

A responsive React portfolio backed by a Django REST API. Project content is stored in SQLite and editable through Django admin; contact submissions are validated and saved for follow-up.

The root [GitHub profile README](../README.md) is the interactive static fallback for projects, work history, contact details, and resume links. A separate [GitHub Pages backup](https://shubhankart101.github.io/Shubhankart101/) has searchable projects and collapsible experience. App and server error screens link to both.

## Deploy on Koyeb

The repository-root `Dockerfile` builds the React frontend with `/static/` asset paths and serves the React app, Django API, Swagger UI, and admin from one Gunicorn service. In Koyeb, create a GitHub-backed Web Service for this repository, select the Dockerfile builder with `/Dockerfile`, and choose the `free` instance in Frankfurt or Washington, D.C. Expose port `8000` as HTTP on `/`; set the HTTP health-check path to `/api/health/`.

Set these service environment variables in Koyeb:

- `DJANGO_SECRET_KEY`: a unique secret generated for this deployment
- `DJANGO_DEBUG`: `false`
- `DJANGO_ALLOWED_HOSTS`: `{{ KOYEB_PUBLIC_DOMAIN }}`
- `DJANGO_CSRF_TRUSTED_ORIGINS`: `https://{{ KOYEB_PUBLIC_DOMAIN }}`
- `DATABASE_URL`: optional PostgreSQL URL for contact messages that must persist across instance replacement

Koyeb supplies `PORT` automatically. Its free instance has 512 MB RAM, 0.1 vCPU, and 2 GB SSD and scales to zero after one idle hour, so the first request after sleep may take a few seconds. Without `DATABASE_URL`, the app uses local SQLite; contact messages can be lost when the free instance is replaced. Set `DATABASE_URL` to a persistent PostgreSQL service if submissions must survive instance replacement.

## Requirements

- Python 3.12 or newer
- Node.js 20.19+ or 22.12+

## Run locally

### Django API

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
python manage.py runserver
```

The API is available at `http://127.0.0.1:8000/api/`. Open the [Swagger UI](http://127.0.0.1:8000/api/docs/) to exercise endpoints, use [ReDoc](http://127.0.0.1:8000/api/redoc/) for the reference, or fetch the [OpenAPI schema](http://127.0.0.1:8000/api/schema/). Django admin is at `http://127.0.0.1:8000/admin/`.

## GitHub Pages backup

The static, searchable backup is deployed by `.github/workflows/deploy-portfolio-pages.yml` to `https://shubhankart101.github.io/Shubhankart101/`. Enable it once in the repository's **Settings → Pages → Build and deployment → Source → GitHub Actions**, then rerun the `Deploy static portfolio backup` workflow. The root profile [README](../README.md) remains available even before Pages is enabled.

### React website

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

## Tests

```powershell
cd backend
python manage.py test
python manage.py spectacular --validate
cd ..\frontend
npm test
npm run lint
npm run build
```

## Production notes

Set `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS`, and `DJANGO_CORS_ALLOWED_ORIGINS` for the deployment. The API throttles anonymous contact submissions; configure email delivery and retention before using the contact inbox in production. The resume endpoint reads the repository-level `RESUME.pdf`.