# Sales Performance Portal - Backend Documentation

## 1. Overview

This document provides a complete technical overview of the backend for the BSNL Sales Performance Portal. The backend is a robust FastAPI application designed to manage campaigns, teams, targets, and activities, and to calculate performance-based leaderboards according to specific business rules.

**Technology Stack:**
- **Framework:** FastAPI
- **Database ORM:** SQLAlchemy 2.0
- **Data Validation:** Pydantic
- **Authentication:** JWT (JSON Web Tokens) with Passlib for password hashing
- **Development Database:** SQLite

---

## 2. Project Structure

The backend is organized into modules with a clear separation of concerns.

```
backend/
├── main.py             # FastAPI app entry point, middleware, and router inclusion.
├── database.py         # SQLAlchemy engine, session management, and get_db dependency.
├── schemas.py          # Pydantic models for API data validation and serialization.
├── auth.py             # JWT creation, password hashing, and user authentication logic.
├── utils.py            # Core business logic for complex calculations (e.g., scoring).
├── seed_db.py          # Script to populate the database with initial test data.
│
├── models/             # Directory for SQLAlchemy ORM models (database table definitions).
│   ├── __init__.py
│   ├── user.py
│   ├── campaign.py
│   ├── team.py
│   ├── employee.py
│   ├── activity.py
│   └── target.py
│
├── routes/             # Directory for FastAPI routers (API endpoints).
│   ├── __init__.py
│   ├── auth_routes.py
│   ├── team_routes.py
│   ├── target_routes.py
│   ├── activity_routes.py
│   └── leaderboard_routes.py
│
├── requirements.txt    # Python package dependencies.
└── sales_portal.db     # SQLite database file (generated on run).
```

---

## 3. Setup and Installation

Follow these steps to set up and run the backend locally.

**Prerequisites:**
- Python 3.10+

**Steps:**

1.  **Clone the repository** and navigate to the project root (`sales_performance_portal/`).

2.  **Create and activate a virtual environment:**
    ```bash
    # Create the virtual environment
    python -m venv .venv

    # Activate it (Linux/macOS)
    source .venv/bin/activate

    # Activate it (Windows)
    .\.venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r backend/requirements.txt
    ```

4.  **Seed the database with test data:** This script creates a fresh database with pre-configured users, teams, and campaign data, which is essential for testing.
    ```bash
    python -m backend.seed_db
    ```
    This creates two users:
    - **Admin:** `username`: `admin`, `password`: `admin123`
    - **Employee:** `username`: `arun`, `password`: `password123`

5.  **Run the application:**
    ```bash
    uvicorn backend.main:app --reload
    ```
    The server will be running at `http://127.0.0.1:8000`.

6.  **Access the API Documentation:** Open your browser and navigate to `http://127.0.0.1:8000/docs` to view the interactive Swagger UI.

---

## 4. Database (`models/`)

The database schema is defined using SQLAlchemy's ORM. Each file in the `models/` directory corresponds to a table in the database. The relationships are designed to ensure data integrity. For a detailed schema diagram, refer to the model definitions.

---

## 5. Authentication (`auth.py`)

Authentication is handled using JWT.

-   **Flow:** A user sends their `username` and `password` to the `/api/auth/token` endpoint. If valid, the server returns a short-lived JWT Bearer Token. This token must be included in the `Authorization` header for all subsequent requests to protected endpoints.
-   **User Roles:**
    -   `employee`: Can submit activities and view data relevant to them (leaderboards, team targets).
    -   `admin`: Can perform administrative tasks like creating teams and setting targets. This role is intended for BA Heads.

---

## 6. Business Logic (`utils.py`)

This module contains the core business logic, separating it from the API routes.

-   **`calculate_leaderboard_scores(db, campaign_id)`:** This is the main function for generating the leaderboard. It implements the specific rules from the "Freedom Fiesta" campaign:
    -   **Proportional Scoring:** Calculates scores based on the percentage of target achieved for activities like MNP and FTTH.
    -   **Eligibility Rules:** Enforces conditions, such as the rule that a team is only eligible for SIM Sale points if they achieve at least 40% of their target.
    -   **Lead Conversion Bonus:** Awards bonus points for meeting lead conversion goals (e.g., 10% of house visits converted to FTTH connections).
    -   **Simple Scoring:** For activities without targets (like House Visits), it awards a fixed number of points per activity.

---

## 7. API Endpoints (`routes/`)

The API is divided into logical sections using FastAPI's `APIRouter`.

### 7.1. Authentication (`/api/auth`)

-   **`POST /token`**
    -   **Description:** Logs a user in.
    -   **Auth:** None.
    -   **Request Body:** `x-www-form-urlencoded` with `username` and `password`.
    -   **Response:** JWT access token.

### 7.2. Team Management (`/api/teams`)

-   **`POST /`**
    -   **Description:** Creates a new team.
    -   **Auth:** `admin` role required.
    -   **Request Body:** `schemas.TeamCreate`.
    -   **Response:** The newly created team object.

-   **`GET /by_ba/{ba_id}`**
    -   **Description:** Gets a list of all teams within a Business Area.
    -   **Auth:** Any authenticated user.
    -   **Response:** A list of team objects.

-   **`POST /{team_id}/employees/{employee_id}`**
    -   **Description:** Assigns an existing employee to a team.
    -   **Auth:** `admin` role required.
    -   **Response:** The updated team object with the new employee.

### 7.3. Target Management (`/api/targets`)

-   **`POST /team`**
    -   **Description:** Sets a performance target for a specific team.
    -   **Auth:** `admin` role required.
    -   **Request Body:** `schemas.TeamTargetCreate`.
    -   **Response:** The newly created target object.

-   **`GET /team/{team_id}`**
    -   **Description:** Gets all targets set for a specific team.
    -   **Auth:** Any authenticated user.
    -   **Response:** A list of target objects.

### 7.4. Activity Logging (`/api/activities`)

-   **`POST /`**
    -   **Description:** Submits a new performance activity for the logged-in user.
    -   **Auth:** `employee` role required.
    -   **Request Body:** `schemas.ActivityCreate`. Includes `activity_type_id`, customer details, and optional lat/long.
    -   **Logic:** Rejects duplicate submissions within a 5-minute window.
    -   **Response:** The newly created activity object.

### 7.5. Leaderboard (`/api/leaderboard`)

-   **`GET /{campaign_id}`**
    -   **Description:** Fetches the ranked leaderboard, calculated using the complex business logic in `utils.py`.
    -   **Auth:** Any authenticated user.
    -   **Response:** A list of ranked `LeaderboardEntry` objects, including employee name, team name, and final calculated score.
