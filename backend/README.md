# Flight Discovery Backend

## Setup

1.  Create a virtual environment:

    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

2.  Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3.  Configure environment variables:
    *   Create a `.env` file based on `.env.example`.
    *   Set `SKYSCANNER_API_KEY`, `DATABASE_URL`, and `REDIS_URL`.

4.  Run the application:

    ```bash
    uvicorn main:app --reload
    ```

## API Endpoints

*   `/api/search?origin=YUL&month=2026-03`

## Database Migrations

*   To be implemented using Alembic.
