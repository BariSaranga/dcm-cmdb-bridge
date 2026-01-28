from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.subscription import (
    PlanTier,
    SubscriptionStatus,
    BillingInterval,
)
from services.billing_service import BillingService

router = APIRouter(prefix="/api/v1/billing", tags=["billing"])


# Pydantic schemas
class OrganizationCreate(BaseModel):
    name: str
    slug: str
    billing_email: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    billing_email: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionResponse(BaseModel):
    id: int
    organization_id: int
    plan_tier: str
    status: str
    billing_interval: str
    price_cents: int
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    trial_end: Optional[datetime]
    canceled_at: Optional[datetime]

    class Config:
        from_attributes = True


class UpgradeRequest(BaseModel):
    plan_tier: str
    billing_interval: str = "monthly"


class LimitCheckResponse(BaseModel):
    allowed: bool
    limit: int
    current: int
    message: str


class FeatureCheckResponse(BaseModel):
    allowed: bool
    feature: str
    plan_tier: Optional[str] = None
    message: str


class UsageResponse(BaseModel):
    organization_id: int
    period_start: datetime
    period_end: datetime
    entities_count: int
    users_count: int
    clusters_count: int
    ai_explanations_count: int
    drift_records_count: int
    actions_count: int
    api_calls_count: int

    class Config:
        from_attributes = True


class PricingTierResponse(BaseModel):
    tier: str
    name: str
    description: str
    price_monthly: Optional[int]
    price_annual: Optional[int]
    limits: dict
    features: List[str]
    cta: str
    popular: Optional[bool] = False


# Endpoints

@router.get("/pricing", response_model=List[PricingTierResponse])
def get_pricing_tiers(db: Session = Depends(get_db)):
    """
    Get all pricing tiers with features for display.

    This endpoint is public and used to display pricing on the website.
    """
    service = BillingService(db)
    return service.get_pricing_tiers()


@router.post("/organizations", response_model=OrganizationResponse)
def create_organization(
    request: OrganizationCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new organization with a free tier subscription.
    """
    service = BillingService(db)
    try:
        org = service.create_organization(
            name=request.name,
            slug=request.slug,
            billing_email=request.billing_email
        )
        return org
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
def get_organization(org_id: int, db: Session = Depends(get_db)):
    """Get organization details."""
    service = BillingService(db)
    org = service.get_organization(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("/organizations/{org_id}/subscription", response_model=SubscriptionResponse)
def get_subscription(org_id: int, db: Session = Depends(get_db)):
    """Get the active subscription for an organization."""
    service = BillingService(db)
    subscription = service.get_subscription(org_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    return subscription


@router.post("/organizations/{org_id}/subscription/upgrade", response_model=SubscriptionResponse)
def upgrade_subscription(
    org_id: int,
    request: UpgradeRequest,
    db: Session = Depends(get_db)
):
    """
    Upgrade an organization's subscription to a new tier.

    Note: In production, this would integrate with Stripe for payment processing.
    """
    service = BillingService(db)

    try:
        plan_tier = PlanTier(request.plan_tier)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid plan tier: {request.plan_tier}")

    try:
        billing_interval = BillingInterval(request.billing_interval)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid billing interval: {request.billing_interval}")

    try:
        subscription = service.upgrade_subscription(
            organization_id=org_id,
            new_tier=plan_tier,
            billing_interval=billing_interval
        )
        return subscription
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/organizations/{org_id}/subscription/cancel", response_model=SubscriptionResponse)
def cancel_subscription(
    org_id: int,
    immediately: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Cancel an organization's subscription.

    By default, the subscription remains active until the end of the billing period.
    Set immediately=true to cancel immediately and downgrade to free tier.
    """
    service = BillingService(db)
    try:
        subscription = service.cancel_subscription(
            organization_id=org_id,
            immediately=immediately
        )
        return subscription
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/organizations/{org_id}/limits/{limit_name}", response_model=LimitCheckResponse)
def check_limit(
    org_id: int,
    limit_name: str,
    current_value: int = Query(..., description="Current value to check against limit"),
    db: Session = Depends(get_db)
):
    """
    Check if an organization is within their plan limits.

    Limit names: max_entities, max_users, max_clusters, ai_explanations_daily
    """
    service = BillingService(db)
    result = service.check_limit(
        organization_id=org_id,
        limit_name=limit_name,
        current_value=current_value
    )
    return result


@router.get("/organizations/{org_id}/features/{feature_name}", response_model=FeatureCheckResponse)
def check_feature(
    org_id: int,
    feature_name: str,
    db: Session = Depends(get_db)
):
    """
    Check if a feature is available for an organization's plan.

    Feature names: graph_export, api_access, sso_enabled, multi_cluster,
                   custom_integrations, audit_export, sla_guarantee, dedicated_support
    """
    service = BillingService(db)
    result = service.check_feature(
        organization_id=org_id,
        feature_name=feature_name
    )
    return result


@router.get("/organizations/{org_id}/usage", response_model=UsageResponse)
def get_usage(org_id: int, db: Session = Depends(get_db)):
    """Get current period usage for an organization."""
    service = BillingService(db)
    usage = service.get_usage(org_id)
    if not usage:
        raise HTTPException(status_code=404, detail="No usage data found for current period")
    return usage


@router.get("/plans/{plan_tier}/limits")
def get_plan_limits(plan_tier: str, db: Session = Depends(get_db)):
    """Get the limits for a specific plan tier."""
    try:
        tier = PlanTier(plan_tier)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid plan tier: {plan_tier}")

    service = BillingService(db)
    return service.get_plan_limits(tier)
