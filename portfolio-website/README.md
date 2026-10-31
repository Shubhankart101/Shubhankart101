# Shubhankar Thapliyal | Portfolio

A responsive React portfolio backed by a Django REST API. Project content is stored in SQLite and editable through Django admin; contact submissions are validated and saved for follow-up.

The root [GitHub profile README](../README.md) is the interactive static fallback for projects, work history, contact details, and resume links. A separate [GitHub Pages backup](https://shubhankart101.github.io/Shubhankart101/) has searchable projects and collapsible experience. App and server error screens link to both.

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

The API is available at `http://127.0.0.1:8000/api/`. Admin is at `http://127.0.0.1:8000/admin/`.

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
cd ..\frontend
npm test
```

## Production notes

Set `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS`, and `DJANGO_CORS_ALLOWED_ORIGINS` for the deployment. The API throttles anonymous contact submissions; configure email delivery and retention before using the contact inbox in production. The resume endpoint reads the repository-level `RESUME.pdf`.