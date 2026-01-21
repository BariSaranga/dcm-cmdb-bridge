from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from database import get_db, engine, Base
from logging_config import setup_logging, get_logger
from routers import (
    discovery_router,
    cmdb_router,
    drift_router,
    actions_router,
    audit_router,
    graph_router,
    demo_router,
    ai_router,
    architecture_router,
)

app = FastAPI(
    title=settings.app_name,
    description="A platform that discovers runtime infrastructure, detects drift vs CMDB, and syncs changes with governance.",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(discovery_router)
app.include_router(cmdb_router)
app.include_router(drift_router)
app.include_router(actions_router)
app.include_router(audit_router)
app.include_router(graph_router)
app.include_router(demo_router)
app.include_router(ai_router)
app.include_router(architecture_router)


@app.on_event("startup")
def on_startup():
    # Initialize logging
    setup_logging(level="INFO", json_format=settings.debug is False)
    logger = get_logger(__name__)
    logger.info("Starting DCM-CMDB Bridge API", extra={"app_name": settings.app_name})

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized")


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "app": settings.app_name,
        "database": db_status,
    }
