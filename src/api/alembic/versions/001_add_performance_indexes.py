"""Add performance indexes for frequently queried columns

Revision ID: 001_add_indexes
Revises:
Create Date: 2026-01-16

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '001_add_indexes'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add indexes for performance optimization."""

    # Indexes for normalized_entities table
    op.create_index(
        'ix_normalized_entities_snapshot_id',
        'normalized_entities',
        ['snapshot_id']
    )
    op.create_index(
        'ix_normalized_entities_kind_namespace_name',
        'normalized_entities',
        ['kind', 'namespace', 'name']
    )

    # Indexes for drift_records table
    op.create_index(
        'ix_drift_records_snapshot_id',
        'drift_records',
        ['snapshot_id']
    )
    op.create_index(
        'ix_drift_records_entity_id',
        'drift_records',
        ['entity_id']
    )
    op.create_index(
        'ix_drift_records_status',
        'drift_records',
        ['status']
    )
    op.create_index(
        'ix_drift_records_severity',
        'drift_records',
        ['severity']
    )
    op.create_index(
        'ix_drift_records_drift_type',
        'drift_records',
        ['drift_type']
    )

    # Indexes for actions table
    op.create_index(
        'ix_actions_drift_record_id',
        'actions',
        ['drift_record_id']
    )
    op.create_index(
        'ix_actions_status',
        'actions',
        ['status']
    )

    # Indexes for audit_logs table
    op.create_index(
        'ix_audit_logs_entity_type_entity_id',
        'audit_logs',
        ['entity_type', 'entity_id']
    )
    op.create_index(
        'ix_audit_logs_event_type',
        'audit_logs',
        ['event_type']
    )
    op.create_index(
        'ix_audit_logs_created_at',
        'audit_logs',
        ['created_at']
    )

    # Indexes for cmdb_items table
    op.create_index(
        'ix_cmdb_items_ci_type_namespace_name',
        'cmdb_items',
        ['ci_type', 'namespace', 'name']
    )
    op.create_index(
        'ix_cmdb_items_status',
        'cmdb_items',
        ['status']
    )

    # Indexes for graph_nodes table
    op.create_index(
        'ix_graph_nodes_graph_snapshot_id',
        'graph_nodes',
        ['graph_snapshot_id']
    )
    op.create_index(
        'ix_graph_nodes_node_type',
        'graph_nodes',
        ['node_type']
    )

    # Indexes for graph_edges table
    op.create_index(
        'ix_graph_edges_graph_snapshot_id',
        'graph_edges',
        ['graph_snapshot_id']
    )


def downgrade() -> None:
    """Remove all performance indexes."""

    # Drop graph_edges indexes
    op.drop_index('ix_graph_edges_graph_snapshot_id', 'graph_edges')

    # Drop graph_nodes indexes
    op.drop_index('ix_graph_nodes_node_type', 'graph_nodes')
    op.drop_index('ix_graph_nodes_graph_snapshot_id', 'graph_nodes')

    # Drop cmdb_items indexes
    op.drop_index('ix_cmdb_items_status', 'cmdb_items')
    op.drop_index('ix_cmdb_items_ci_type_namespace_name', 'cmdb_items')

    # Drop audit_logs indexes
    op.drop_index('ix_audit_logs_created_at', 'audit_logs')
    op.drop_index('ix_audit_logs_event_type', 'audit_logs')
    op.drop_index('ix_audit_logs_entity_type_entity_id', 'audit_logs')

    # Drop actions indexes
    op.drop_index('ix_actions_status', 'actions')
    op.drop_index('ix_actions_drift_record_id', 'actions')

    # Drop drift_records indexes
    op.drop_index('ix_drift_records_drift_type', 'drift_records')
    op.drop_index('ix_drift_records_severity', 'drift_records')
    op.drop_index('ix_drift_records_status', 'drift_records')
    op.drop_index('ix_drift_records_entity_id', 'drift_records')
    op.drop_index('ix_drift_records_snapshot_id', 'drift_records')

    # Drop normalized_entities indexes
    op.drop_index('ix_normalized_entities_kind_namespace_name', 'normalized_entities')
    op.drop_index('ix_normalized_entities_snapshot_id', 'normalized_entities')
