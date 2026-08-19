from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import mongo
from app.config.settings import settings
from app.routes import (
    admin,
    attendance,
    auth,
    notifications,
    profile,
    subjects,
    timetable,
)
from app.scheduler.scheduler import (
    start_scheduler,
    stop_scheduler,
)
from app.services.auth_service import AuthService
from app.utils.logger import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle.
    """

    setup_logging()

    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------
    mongo.connect()

    db = mongo.get_db()

    # -----------------------------------------------------
    # DEFAULT ADMIN
    # -----------------------------------------------------
    AuthService(db).ensure_default_admin(
        settings.default_admin_email,
        settings.default_admin_password,
        settings.default_admin_name,
    )

    # -----------------------------------------------------
    # BACKGROUND SCHEDULER
    # -----------------------------------------------------
    try:
        start_scheduler(db)
    except Exception as exc:
        # Scheduler failure must not stop the API server.
        import logging

        logging.getLogger(__name__).exception(
            "Failed to start scheduler: %s",
            exc,
        )

    yield

    # -----------------------------------------------------
    # SHUTDOWN
    # -----------------------------------------------------
    try:
        stop_scheduler()
    except Exception:
        import logging

        logging.getLogger(__name__).exception(
            "Failed to stop scheduler",
        )

    mongo.disconnect()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTES
# =========================================================

API_PREFIX = settings.api_v1_prefix

# Keep all existing application routers.
app.include_router(
    auth.router,
    prefix=API_PREFIX,
)

app.include_router(
    profile.router,
    prefix=API_PREFIX,
)

app.include_router(
    attendance.router,
    prefix=API_PREFIX,
)

app.include_router(
    subjects.router,
    prefix=API_PREFIX,
)

app.include_router(
    timetable.router,
    prefix=API_PREFIX,
)

app.include_router(
    notifications.router,
    prefix=API_PREFIX,
)


# =========================================================
# ADMIN ROUTES
# =========================================================
#
# Register the admin router after all normal application
# routers. The admin router already has its /admin prefix,
# therefore the final URLs become:
#
# /api/v1/admin/...
#
# No admin route logic is changed here.

app.include_router(
    admin.router,
    prefix=API_PREFIX,
)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
    }


@app.get(f"{API_PREFIX}/health")
def api_health():
    return {
        "status": "ok",
    }