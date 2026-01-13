from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import CMDBItem
from fixtures import seed_cmdb_items

router = APIRouter(prefix="/api/v1/cmdb", tags=["cmdb"])


# Pydantic schemas
class CMDBItemCreate(BaseModel):
    ci_type: str
    name: str
    namespace: Optional[str] = None
    environment: str
    owner: str
    status: str = "active"
    description: Optional[str] = None
    extra_data: Optional[dict] = None


class CMDBItemUpdate(BaseModel):
    owner: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    extra_data: Optional[dict] = None


class CMDBItemResponse(BaseModel):
    id: int
    ci_type: str
    name: str
    namespace: Optional[str]
    environment: str
    owner: str
    status: str
    description: Optional[str]
    extra_data: Optional[dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedCMDBItems(BaseModel):
    items: List[CMDBItemResponse]
    total: int
    page: int
    page_size: int


@router.get("/items", response_model=PaginatedCMDBItems)
def list_cmdb_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    ci_type: Optional[str] = None,
    environment: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List CMDB items with optional filtering."""
    query = db.query(CMDBItem)

    if ci_type:
        query = query.filter(CMDBItem.ci_type == ci_type)
    if environment:
        query = query.filter(CMDBItem.environment == environment)
    if status:
        query = query.filter(CMDBItem.status == status)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedCMDBItems(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/items/{item_id}", response_model=CMDBItemResponse)
def get_cmdb_item(item_id: int, db: Session = Depends(get_db)):
    """Get a specific CMDB item."""
    item = db.query(CMDBItem).filter(CMDBItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="CMDB item not found")
    return item


@router.post("/items", response_model=CMDBItemResponse)
def create_cmdb_item(item: CMDBItemCreate, db: Session = Depends(get_db)):
    """Create a new CMDB item."""
    db_item = CMDBItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.patch("/items/{item_id}", response_model=CMDBItemResponse)
def update_cmdb_item(
    item_id: int,
    updates: CMDBItemUpdate,
    db: Session = Depends(get_db)
):
    """Update a CMDB item."""
    item = db.query(CMDBItem).filter(CMDBItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="CMDB item not found")

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.post("/seed")
def seed_cmdb(db: Session = Depends(get_db)):
    """Seed CMDB with test data."""
    count = seed_cmdb_items(db)
    return {"message": f"Seeded {count} CMDB items", "count": count}
