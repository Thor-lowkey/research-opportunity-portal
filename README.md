# Research Opportunity Portal

A web-based application for managing university research opportunities. Faculty research positions can be created, viewed, updated, and deleted through a Flask REST API and a MariaDB database.

## Features

- Create research opportunities.
- View all opportunities and individual opportunity details.
- Update opportunity information.
- Change opportunity status between Open and Closed.
- Delete opportunities.
- Validate incoming API requests.
- Store opportunity data in MariaDB.

## Technology Stack

- **Backend:** Python, Flask
- **Database:** MariaDB
- **Database connector:** MySQL Connector/Python
- **Frontend:** HTML, CSS, JavaScript
- **API testing:** Postman

## Project Structure

```text
Assignment/
├── app.py
├── schema.sql
├── requirements.txt
├── README.md
├── .gitignore
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

## Setup

### 1. Install prerequisites

Install Python 3, MariaDB, and Git.

### 2. Create the database

Run the schema file:

```bash
mariadb -u root -p < schema.sql
```

Use the appropriate MariaDB administrator account for your system.

### 3. Create a Python virtual environment

```bash
python -m venv .venv
source .venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure database credentials

Set the database password as an environment variable in the same terminal used to start Flask:

```bash
export DB_PASSWORD='your_database_password'
```

The application expects a MariaDB user named `portal_app` with privileges on the `research_portal` database. Configure that user and its password in MariaDB before running the application.

### 6. Start the application

```bash
python app.py
```

Open [http://127.0.0.1:5000/](http://127.0.0.1:5000/) in your browser.

## REST API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/opportunities` | List all opportunities |
| GET | `/api/opportunities/:id` | Retrieve one opportunity |
| POST | `/api/opportunities` | Create an opportunity |
| PUT | `/api/opportunities/:id` | Update an opportunity |
| DELETE | `/api/opportunities/:id` | Delete an opportunity |

## HTTP Status Codes

- `200 OK` — Request completed successfully.
- `201 Created` — Opportunity created successfully.
- `400 Bad Request` — Invalid request data.
- `404 Not Found` — Opportunity does not exist.
- `500 Internal Server Error` — Unexpected server-side error.

## Database

The `opportunities` table stores the title, description, research area, faculty member, department, required skills, available positions, application deadline, and status.

The status can be `Open` or `Closed`.

## Security Notes

- Keep database passwords and other secrets out of source control.
- Do not commit the `.venv` directory or local environment files.
- Use environment variables for database credentials.

## License

This project was developed for an academic assignment.
