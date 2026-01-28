"""
Billing & Subscription Service

Manages subscriptions, usage tracking, and plan limits enforcement.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from models.subscription import (
    Organization,
    Subscription,
    PlanLimits,
    UsageRecord,
    Invoice,
    PlanTier,
    SubscriptionStatus,
    BillingInterval,
)
from logging_config import get_logger

logger = get_logger(__name__)


# Default plan configurations
DEFAULT_PLAN_LIMITS = {
    PlanTier.FREE: {
        "max_entities": 100,
        "max_users": 3,
        "max_clusters": 1,
        "retention_days": 7,
        "ai_explanations_daily": 5,
        "drift_types": "structural",
        "graph_export": False,
        "api_access": False,
        "sso_enabled": False,
        "multi_cluster": False,
        "custom_integrations": False,
        "audit_export": False,
        "sla_guarantee": False,
        "dedicated_support": False,
    },
    PlanTier.TEAM: {
        "max_entities": 1000,
        "max_users": 10,
        "max_clusters": 3,
        "retention_days": 30,
        "ai_explanations_daily": 50,
        "drift_types": "all",
        "graph_export": True,
        "api_access": False,
        "sso_enabled": False,
        "multi_cluster": False,
        "custom_integrations": False,
        "audit_export": False,
        "sla_guarantee": False,
        "dedicated_support": False,
    },
    PlanTier.BUSINESS: {
        "max_entities": 10000,
        "max_users": 50,
        "max_clusters": 10,
        "retention_days": 90,
        "ai_explanations_daily": -1,  # unlimited
        "drift_types": "all+custom",
        "graph_export": True,
        "api_access": True,
        "sso_enabled": True,
        "multi_cluster": True,
        "custom_integrations": True,
        "audit_export": True,
        "sla_guarantee": False,
        "dedicated_support": False,
    },
    PlanTier.ENTERPRISE: {
        "max_entities": -1,  # unlimited
        "max_users": -1,  # unlimited
        "max_clusters": -1,  # unlimited
        "retention_days": 2555,  # ~7 years
        "ai_explanations_daily": -1,  # unlimited
        "drift_types": "all+custom+ml",
        "graph_export": True,
        "api_access": True,
        "sso_enabled": True,
        "multi_cluster": True,
        "custom_integrations": True,
        "audit_export": True,
        "sla_guarantee": True,
        "dedicated_support": True,
    },
}

# Pricing in cents (monthly)
PLAN_PRICING = {
    PlanTier.FREE: {"monthly": 0, "annual": 0},
    PlanTier.TEAM: {"monthly": 49900, "annual": 39900},  # $499/mo, $399/mo annual
    PlanTier.BUSINESS: {"monthly": 199900, "annual": 159900},  # $1999/mo, $1599/mo annual
    PlanTier.ENTERPRISE: {"monthly": 500000, "annual": 400000},  # Custom, starting at $5000/mo
}


class BillingService:
    """Service for managing billing and subscriptions."""

    def __init__(self, db: Session):
        self.db = db

    def create_organization(
        self,
        name: str,
        slug: str,
        billing_email: Optional[str] = None
    ) -> Organization:
        """Create a new organization with a free tier subscription."""
        # Check for existing slug
        existing = self.db.query(Organization).filter(
            Organization.slug == slug
        ).first()
        if existing:
            raise ValueError(f"Organization with slug '{slug}' already exists")

        org = Organization(
            name=name,
            slug=slug,
            billing_email=billing_email
        )
        self.db.add(org)
        self.db.flush()

        # Create free subscription
        subscription = Subscription(
            organization_id=org.id,
            plan_tier=PlanTier.FREE,
            status=SubscriptionStatus.ACTIVE,
            billing_interval=BillingInterval.MONTHLY,
            price_cents=0
        )
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(org)

        logger.info(
            "Organization created",
            extra={"org_id": org.id, "slug": slug}
        )

        return org

    def get_organization(self, org_id: int) -> Optional[Organization]:
        """Get organization by ID."""
        return self.db.query(Organization).filter(
            Organization.id == org_id
        ).first()

    def get_organization_by_slug(self, slug: str) -> Optional[Organization]:
        """Get organization by slug."""
        return self.db.query(Organization).filter(
            Organization.slug == slug
        ).first()

    def get_subscription(self, organization_id: int) -> Optional[Subscription]:
        """Get active subscription for an organization."""
        return self.db.query(Subscription).filter(
            Subscription.organization_id == organization_id,
            Subscription.status.in_([
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIALING
            ])
        ).first()

    def get_plan_limits(self, plan_tier: PlanTier) -> Dict[str, Any]:
        """Get limits for a plan tier."""
        # First check database for custom limits
        limits = self.db.query(PlanLimits).filter(
            PlanLimits.plan_tier == plan_tier
        ).first()

        if limits:
            return {
                "max_entities": limits.max_entities,
                "max_users": limits.max_users,
                "max_clusters": limits.max_clusters,
                "retention_days": limits.retention_days,
                "ai_explanations_daily": limits.ai_explanations_daily,
                "drift_types": limits.drift_types,
                "graph_export": limits.graph_export,
                "api_access": limits.api_access,
                "sso_enabled": limits.sso_enabled,
                "multi_cluster": limits.multi_cluster,
                "custom_integrations": limits.custom_integrations,
                "audit_export": limits.audit_export,
                "sla_guarantee": limits.sla_guarantee,
                "dedicated_support": limits.dedicated_support,
            }

        # Fall back to defaults
        return DEFAULT_PLAN_LIMITS.get(plan_tier, DEFAULT_PLAN_LIMITS[PlanTier.FREE])

    def check_limit(
        self,
        organization_id: int,
        limit_name: str,
        current_value: int
    ) -> Dict[str, Any]:
        """
        Check if an organization is within their plan limits.

        Returns:
            dict with 'allowed', 'limit', 'current', and 'message'
        """
        subscription = self.get_subscription(organization_id)
        if not subscription:
            return {
                "allowed": False,
                "limit": 0,
                "current": current_value,
                "message": "No active subscription"
            }

        limits = self.get_plan_limits(subscription.plan_tier)
        limit_value = limits.get(limit_name, 0)

        # -1 means unlimited
        if limit_value == -1:
            return {
                "allowed": True,
                "limit": -1,
                "current": current_value,
                "message": "Unlimited"
            }

        allowed = current_value < limit_value
        return {
            "allowed": allowed,
            "limit": limit_value,
            "current": current_value,
            "message": f"{'Within' if allowed else 'Exceeded'} {limit_name} limit ({current_value}/{limit_value})"
        }

    def check_feature(
        self,
        organization_id: int,
        feature_name: str
    ) -> Dict[str, Any]:
        """
        Check if a feature is available for an organization's plan.

        Returns:
            dict with 'allowed', 'feature', and 'message'
        """
        subscription = self.get_subscription(organization_id)
        if not subscription:
            return {
                "allowed": False,
                "feature": feature_name,
                "message": "No active subscription"
            }

        limits = self.get_plan_limits(subscription.plan_tier)
        allowed = limits.get(feature_name, False)

        return {
            "allowed": allowed,
            "feature": feature_name,
            "plan_tier": subscription.plan_tier.value,
            "message": f"Feature {'available' if allowed else 'not available'} on {subscription.plan_tier.value} plan"
        }

    def upgrade_subscription(
        self,
        organization_id: int,
        new_tier: PlanTier,
        billing_interval: BillingInterval = BillingInterval.MONTHLY
    ) -> Subscription:
        """Upgrade an organization's subscription."""
        subscription = self.get_subscription(organization_id)
        if not subscription:
            raise ValueError("No active subscription found")

        # Get pricing
        interval_key = billing_interval.value
        price_cents = PLAN_PRICING[new_tier][interval_key]

        subscription.plan_tier = new_tier
        subscription.billing_interval = billing_interval
        subscription.price_cents = price_cents
        subscription.updated_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(subscription)

        logger.info(
            "Subscription upgraded",
            extra={
                "org_id": organization_id,
                "new_tier": new_tier.value,
                "billing_interval": billing_interval.value
            }
        )

        return subscription

    def cancel_subscription(
        self,
        organization_id: int,
        immediately: bool = False
    ) -> Subscription:
        """Cancel an organization's subscription."""
        subscription = self.get_subscription(organization_id)
        if not subscription:
            raise ValueError("No active subscription found")

        subscription.canceled_at = datetime.now(timezone.utc)

        if immediately:
            subscription.status = SubscriptionStatus.CANCELED
            subscription.plan_tier = PlanTier.FREE
            subscription.price_cents = 0
        else:
            # Cancel at end of billing period
            pass  # Status remains active until period ends

        self.db.commit()
        self.db.refresh(subscription)

        logger.info(
            "Subscription canceled",
            extra={
                "org_id": organization_id,
                "immediately": immediately
            }
        )

        return subscription

    def record_usage(
        self,
        organization_id: int,
        metrics: Dict[str, int]
    ) -> UsageRecord:
        """Record usage metrics for an organization."""
        now = datetime.now(timezone.utc)
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Find or create usage record for current period
        record = self.db.query(UsageRecord).filter(
            UsageRecord.organization_id == organization_id,
            UsageRecord.period_start == period_start
        ).first()

        if not record:
            # Calculate period end (first of next month)
            if period_start.month == 12:
                period_end = period_start.replace(year=period_start.year + 1, month=1)
            else:
                period_end = period_start.replace(month=period_start.month + 1)

            record = UsageRecord(
                organization_id=organization_id,
                period_start=period_start,
                period_end=period_end
            )
            self.db.add(record)

        # Update metrics
        for metric, value in metrics.items():
            if hasattr(record, f"{metric}_count"):
                current = getattr(record, f"{metric}_count", 0) or 0
                setattr(record, f"{metric}_count", current + value)

        self.db.commit()
        self.db.refresh(record)

        return record

    def get_usage(self, organization_id: int) -> Optional[UsageRecord]:
        """Get current period usage for an organization."""
        now = datetime.now(timezone.utc)
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        return self.db.query(UsageRecord).filter(
            UsageRecord.organization_id == organization_id,
            UsageRecord.period_start == period_start
        ).first()

    def get_invoices(
        self,
        organization_id: int,
        limit: int = 12
    ) -> List[Invoice]:
        """Get recent invoices for an organization."""
        return self.db.query(Invoice).filter(
            Invoice.organization_id == organization_id
        ).order_by(Invoice.created_at.desc()).limit(limit).all()

    def get_pricing_tiers(self) -> List[Dict[str, Any]]:
        """Get all pricing tiers with features for display."""
        return [
            {
                "tier": PlanTier.FREE.value,
                "name": "Starter",
                "description": "For small teams and POCs",
                "price_monthly": 0,
                "price_annual": 0,
                "limits": DEFAULT_PLAN_LIMITS[PlanTier.FREE],
                "features": [
                    "Up to 100 entities",
                    "3 users",
                    "Basic drift detection",
                    "7-day retention",
                    "5 AI explanations/day",
                    "Community support"
                ],
                "cta": "Get Started Free"
            },
            {
                "tier": PlanTier.TEAM.value,
                "name": "Team",
                "description": "For growing DevOps teams",
                "price_monthly": 499,
                "price_annual": 399,
                "limits": DEFAULT_PLAN_LIMITS[PlanTier.TEAM],
                "features": [
                    "Up to 1,000 entities",
                    "10 users",
                    "Full drift detection",
                    "30-day retention",
                    "50 AI explanations/day",
                    "Graph export",
                    "Email support (48h SLA)"
                ],
                "cta": "Start Team Trial",
                "popular": False
            },
            {
                "tier": PlanTier.BUSINESS.value,
                "name": "Business",
                "description": "For platform teams & multi-cluster",
                "price_monthly": 1999,
                "price_annual": 1599,
                "limits": DEFAULT_PLAN_LIMITS[PlanTier.BUSINESS],
                "features": [
                    "Up to 10,000 entities",
                    "50 users",
                    "Full + custom drift rules",
                    "90-day retention",
                    "Unlimited AI explanations",
                    "API access",
                    "SSO (SAML/OIDC)",
                    "Multi-cluster support",
                    "CMDB integrations",
                    "Priority support (24h SLA)"
                ],
                "cta": "Start Business Trial",
                "popular": True
            },
            {
                "tier": PlanTier.ENTERPRISE.value,
                "name": "Enterprise",
                "description": "For large organizations",
                "price_monthly": None,  # Custom pricing
                "price_annual": None,
                "limits": DEFAULT_PLAN_LIMITS[PlanTier.ENTERPRISE],
                "features": [
                    "Unlimited entities",
                    "Unlimited users",
                    "ML-powered anomaly detection",
                    "Custom retention (up to 7 years)",
                    "Unlimited everything",
                    "On-premise option",
                    "Custom integrations",
                    "Compliance reports",
                    "99.9% SLA guarantee",
                    "Dedicated CSM",
                    "24/7 phone + Slack support"
                ],
                "cta": "Contact Sales"
            }
        ]
