from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, Integer, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from database import Base


class PlanTier(str, enum.Enum):
    FREE = "free"
    TEAM = "team"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    TRIALING = "trialing"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    PAUSED = "paused"


class BillingInterval(str, enum.Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"


class Organization(Base):
    """Represents a customer organization/tenant."""
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)

    # Billing info
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    billing_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Settings
    settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Organization {self.slug}>"


class Subscription(Base):
    """Tracks the subscription status for each organization."""
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(Integer, index=True)

    # Plan details
    plan_tier: Mapped[PlanTier] = mapped_column(SQLEnum(PlanTier), default=PlanTier.FREE)
    status: Mapped[SubscriptionStatus] = mapped_column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    billing_interval: Mapped[BillingInterval] = mapped_column(SQLEnum(BillingInterval), default=BillingInterval.MONTHLY)

    # Stripe integration
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stripe_price_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Billing cycle
    current_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    trial_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Pricing (in cents)
    price_cents: Mapped[int] = mapped_column(Integer, default=0)

    # Metadata
    canceled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Subscription org={self.organization_id} tier={self.plan_tier.value}>"


class PlanLimits(Base):
    """Defines the limits for each pricing tier."""
    __tablename__ = "plan_limits"

    id: Mapped[int] = mapped_column(primary_key=True)
    plan_tier: Mapped[PlanTier] = mapped_column(SQLEnum(PlanTier), unique=True)

    # Entity limits
    max_entities: Mapped[int] = mapped_column(Integer, default=100)
    max_users: Mapped[int] = mapped_column(Integer, default=3)
    max_clusters: Mapped[int] = mapped_column(Integer, default=1)

    # Feature limits
    retention_days: Mapped[int] = mapped_column(Integer, default=7)
    ai_explanations_daily: Mapped[int] = mapped_column(Integer, default=5)

    # Feature flags
    drift_types: Mapped[str] = mapped_column(String(100), default="structural")  # structural, all, all+custom, all+custom+ml
    graph_export: Mapped[bool] = mapped_column(Boolean, default=False)
    api_access: Mapped[bool] = mapped_column(Boolean, default=False)
    sso_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    multi_cluster: Mapped[bool] = mapped_column(Boolean, default=False)
    custom_integrations: Mapped[bool] = mapped_column(Boolean, default=False)
    audit_export: Mapped[bool] = mapped_column(Boolean, default=False)
    sla_guarantee: Mapped[bool] = mapped_column(Boolean, default=False)
    dedicated_support: Mapped[bool] = mapped_column(Boolean, default=False)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<PlanLimits tier={self.plan_tier.value}>"


class UsageRecord(Base):
    """Tracks usage metrics for billing and limits enforcement."""
    __tablename__ = "usage_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(Integer, index=True)

    # Usage period
    period_start: Mapped[datetime] = mapped_column(DateTime)
    period_end: Mapped[datetime] = mapped_column(DateTime)

    # Usage metrics
    entities_count: Mapped[int] = mapped_column(Integer, default=0)
    users_count: Mapped[int] = mapped_column(Integer, default=0)
    clusters_count: Mapped[int] = mapped_column(Integer, default=0)
    ai_explanations_count: Mapped[int] = mapped_column(Integer, default=0)
    drift_records_count: Mapped[int] = mapped_column(Integer, default=0)
    actions_count: Mapped[int] = mapped_column(Integer, default=0)

    # API usage
    api_calls_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<UsageRecord org={self.organization_id} period={self.period_start}>"


class Invoice(Base):
    """Stores invoice records for billing history."""
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(Integer, index=True)

    # Stripe integration
    stripe_invoice_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Invoice details
    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    status: Mapped[str] = mapped_column(String(50))  # draft, open, paid, void, uncollectible

    # Period
    period_start: Mapped[datetime] = mapped_column(DateTime)
    period_end: Mapped[datetime] = mapped_column(DateTime)

    # Line items
    line_items: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # URLs
    invoice_pdf_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    hosted_invoice_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Invoice org={self.organization_id} amount={self.amount_cents}>"
