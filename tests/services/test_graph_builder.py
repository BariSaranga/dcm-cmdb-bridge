import pytest
from services import GraphBuilder


class TestGraphBuilder:
    def test_build_graph_creates_snapshot(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test that build_graph creates a graph snapshot."""
        builder = GraphBuilder(db_session)
        graph = builder.build_graph(sample_snapshot.id)

        assert graph is not None
        assert graph.status == "completed"
        assert graph.snapshot_id == sample_snapshot.id

    def test_build_graph_creates_runtime_nodes(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test that runtime entities become nodes."""
        builder = GraphBuilder(db_session)
        graph = builder.build_graph(sample_snapshot.id)

        from models import GraphNode
        runtime_nodes = db_session.query(GraphNode).filter(
            GraphNode.graph_snapshot_id == graph.id,
            GraphNode.node_type == "runtime"
        ).all()

        # 3 entities: 2 Deployments + 1 Service from sample_entities
        assert len(runtime_nodes) == 3

    def test_build_graph_creates_cmdb_nodes(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test that CMDB items become nodes."""
        builder = GraphBuilder(db_session)
        graph = builder.build_graph(sample_snapshot.id)

        from models import GraphNode
        cmdb_nodes = db_session.query(GraphNode).filter(
            GraphNode.graph_snapshot_id == graph.id,
            GraphNode.node_type == "cmdb"
        ).all()

        # 3 CMDB items, all Deployments
        assert len(cmdb_nodes) == 3

    def test_build_graph_creates_edges(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test that mapping relationships become edges."""
        builder = GraphBuilder(db_session)
        graph = builder.build_graph(sample_snapshot.id)

        from models import GraphEdge
        edges = db_session.query(GraphEdge).filter(
            GraphEdge.graph_snapshot_id == graph.id
        ).all()

        # Should have edges for mapped items and stale indicator
        assert len(edges) > 0

    def test_build_graph_sets_drift_status(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test that nodes have correct drift status."""
        # First detect drift
        from services import DriftEngine
        engine = DriftEngine(db_session)
        engine.detect_drift(sample_snapshot.id)

        builder = GraphBuilder(db_session)
        graph = builder.build_graph(sample_snapshot.id)

        from models import GraphNode
        nodes = db_session.query(GraphNode).filter(
            GraphNode.graph_snapshot_id == graph.id
        ).all()

        # Check for various drift statuses
        drift_statuses = [n.drift_status for n in nodes if n.drift_status]
        assert len(drift_statuses) > 0

    def test_build_graph_invalid_snapshot(self, db_session):
        """Test that invalid snapshot raises error."""
        builder = GraphBuilder(db_session)

        with pytest.raises(ValueError, match="not found"):
            builder.build_graph(99999)

    def test_get_latest_graph(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test get_latest_graph returns most recent completed graph."""
        builder = GraphBuilder(db_session)

        # Build first graph
        graph1 = builder.build_graph(sample_snapshot.id)

        # Get latest
        latest = builder.get_latest_graph()
        assert latest is not None
        assert latest.id == graph1.id

    def test_get_latest_graph_none_exists(self, db_session):
        """Test get_latest_graph returns None when no graphs exist."""
        builder = GraphBuilder(db_session)
        latest = builder.get_latest_graph()
        assert latest is None

    def test_node_count_and_edge_count(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test that node and edge counts are accurate."""
        builder = GraphBuilder(db_session)
        graph = builder.build_graph(sample_snapshot.id)

        from models import GraphNode, GraphEdge
        actual_nodes = db_session.query(GraphNode).filter(
            GraphNode.graph_snapshot_id == graph.id
        ).count()
        actual_edges = db_session.query(GraphEdge).filter(
            GraphEdge.graph_snapshot_id == graph.id
        ).count()

        assert graph.node_count == actual_nodes
        assert graph.edge_count == actual_edges
