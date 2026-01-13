from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from database import get_db, engine, Base
from routers import discovery_router

app = FastAPI(
    title=settings.app_name,
    description="A platform that discovers runtime infrastructure, detects drift vs CMDB, and syncs changes with governance.",
    version="0.1.0",
)

app.include_router(discovery_router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


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
