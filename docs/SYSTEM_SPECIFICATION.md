# אפיון מערכת DCM-CMDB Bridge

## מסמך אפיון מקיף | גרסה 1.0

---

## תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [ארכיטקטורה כללית](#2-ארכיטקטורה-כללית)
3. [מודולים ורכיבים](#3-מודולים-ורכיבים)
4. [מודל הנתונים](#4-מודל-הנתונים)
5. [ממשקי API](#5-ממשקי-api)
6. [ממשק משתמש](#6-ממשק-משתמש)
7. [תהליכים עסקיים](#7-תהליכים-עסקיים)
8. [אבטחה ו-Compliance](#8-אבטחה-ו-compliance)
9. [תשתית וסביבות](#9-תשתית-וסביבות)
10. [בדיקות](#10-בדיקות)
11. [מפת דרכים](#11-מפת-דרכים)

---

## 1. סקירה כללית

### 1.1 מהות המערכת

**DCM-CMDB Bridge** היא פלטפורמה לניהול תשתיות אשר מגלה תשתיות Runtime (מ-Kubernetes ומקורות נוספים), מנרמלת ישויות, מזהה סטיות (Drift) מול רשומות CMDB, ומסנכרנת שינויים עם ממשל, אישורים ומעקב מלא.

### 1.2 החזון - "Infrastructure Lie Detector"

המערכת חושפת את הפער בין **האמת בשטח** (מה שרץ בפועל) לבין **המציאות הארגונית** (CMDB + ביורוקרטיה):

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Runtime       │    │     CMDB        │    │  Bureaucracy    │
│   (האמת)        │ ←→ │   (הרשומות)     │ ←→ │   (הארגון)      │
│                 │    │                 │    │                 │
│ • K8s Clusters  │    │ • CI Records    │    │ • Ownership     │
│ • Deployments   │    │ • Status        │    │ • Approvals     │
│ • Services      │    │ • Metadata      │    │ • Governance    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                     │                      │
         └─────────────────────┼──────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   AI Explainer      │
                    │   הסבר מבוסס עדויות │
                    └─────────────────────┘
```

### 1.3 בעיות שהמערכת פותרת

| בעיה | פתרון |
|------|-------|
| שירותים רצים ללא תיעוד ב-CMDB | זיהוי אוטומטי של `missing_in_cmdb` |
| רשומות CMDB מיושנות | זיהוי `stale_in_cmdb` |
| אי-התאמה בבעלות | זיהוי `ownership_mismatch` |
| שירותים "מתים" שעדיין רצים | זיהוי `lifecycle_conflict` |
| חוסר נראות לסיכוני אבטחה | זיהוי חשיפות ללא TLS |
| Shadow IT | מיפוי מלא של מה שרץ |

### 1.4 סטאק טכנולוגי

#### Backend
| רכיב | טכנולוגיה | גרסה |
|------|-----------|-------|
| שפה | Python | 3.11 |
| Framework | FastAPI | 0.109.2 |
| ORM | SQLAlchemy | 2.0.25 |
| Database | PostgreSQL | 15 |
| Queue | Redis + RQ | 7 |
| K8s Client | kubernetes-python | 29.0.0 |

#### Frontend
| רכיב | טכנולוגיה | גרסה |
|------|-----------|-------|
| Framework | React | 19.2 |
| שפה | TypeScript | 5.9 |
| Build Tool | Vite | 7.2 |
| UI Library | Material-UI (MUI) | 7.3.7 |
| Graph | React Flow | 12.10 |
| Diagrams | Mermaid | 11.12 |
| Data Fetching | TanStack Query | 5.90 |
| Routing | React Router | 7.12 |

---

## 2. ארכיטקטורה כללית

### 2.1 דיאגרמת ארכיטקטורה

```
┌──────────────────────────────────────────────────────────────────────┐
│                              USERS                                    │
│                     (DevOps, Platform Teams, Compliance)              │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Dashboard │ │  Graph   │ │  Drifts  │ │ Actions  │ │  Audit   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│  │ Lie Detector     │ │ AI Assistant     │ │ Architecture     │     │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘     │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │ HTTP/REST
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                             │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                          API Layer                               │ │
│  │  /discovery  /cmdb  /drift  /graph  /actions  /audit  /ai      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                  │                                    │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                       Services Layer                             │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │ │
│  │  │ Drift    │ │ Graph    │ │ Action   │ │ AI       │           │ │
│  │  │ Engine   │ │ Builder  │ │ Service  │ │ Explainer│           │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐            │ │
│  │  │ Audit    │ │ Arch.    │ │ Kubernetes Collector │            │ │
│  │  │ Service  │ │ Service  │ └──────────────────────┘            │ │
│  │  └──────────┘ └──────────┘                                      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
            ┌────────────┐ ┌────────────┐ ┌────────────┐
            │ PostgreSQL │ │   Redis    │ │ Kubernetes │
            │    (DB)    │ │  (Queue)   │ │ (Clusters) │
            └────────────┘ └────────────┘ └────────────┘
```

### 2.2 זרימת נתונים

```
Kubernetes Cluster
        │
        ▼ (Discovery)
┌─────────────────┐
│   Collector     │ ──→ Deployments, Services, StatefulSets,
└─────────────────┘      ConfigMaps, Ingresses, Secrets
        │
        ▼ (Normalization)
┌─────────────────┐
│  Normalizer     │ ──→ NormalizedEntity (unified format)
└─────────────────┘
        │
        ▼ (Snapshot)
┌─────────────────┐
│   Snapshot      │ ──→ Point-in-time capture stored in DB
└─────────────────┘
        │
        ▼ (Drift Detection)
┌─────────────────┐
│  Drift Engine   │ ──→ Compare with CMDB, create DriftRecords
└─────────────────┘
        │
        ▼ (Graph Building)
┌─────────────────┐
│ Graph Builder   │ ──→ GraphSnapshot with nodes & edges
└─────────────────┘
        │
        ▼ (Actions)
┌─────────────────┐
│ Action Workflow │ ──→ Propose → Approve → Apply
└─────────────────┘
        │
        ▼ (Audit)
┌─────────────────┐
│  Audit Service  │ ──→ Complete audit trail
└─────────────────┘
```

---

## 3. מודולים ורכיבים

### 3.1 Discovery Module - מודול גילוי

**מיקום:** `src/api/collectors/kubernetes/`

**מטרה:** גילוי תשתיות מ-Kubernetes clusters

#### רכיבים

| קובץ | תפקיד |
|------|-------|
| `collector.py` | אורקסטרציה של תהליך האיסוף |
| `client.py` | הפשטה של K8s client (real + fixture) |
| `normalizer.py` | המרה לפורמט אחיד |
| `label_inference.py` | הסקת owner/environment מ-labels |
| `fixtures.py` | נתוני בדיקה ללא cluster אמיתי |

#### סוגי משאבים נתמכים

| Resource Type | מה נאסף |
|---------------|---------|
| Deployments | שם, namespace, replicas, labels, annotations |
| Services | שם, type, ports, selectors |
| StatefulSets | שם, replicas, storage |
| ConfigMaps | metadata בלבד (לא תוכן) |
| Ingresses | hosts, paths, TLS config |
| Secrets | metadata בלבד (ללא data רגיש) |

#### הסקת Labels

```python
# Owner inference
owner_labels = ['team', 'owner', 'owner-team']  # case-insensitive

# Environment inference
env_labels = ['env', 'environment', 'app.environment']
```

### 3.2 Drift Engine - מנוע זיהוי סטיות

**מיקום:** `src/api/services/drift_engine.py`

**מטרה:** השוואת Runtime מול CMDB וזיהוי אי-התאמות

#### סוגי Drift

| סוג | תיאור | חומרה |
|-----|-------|--------|
| `structural_missing_in_cmdb` | ישות קיימת ב-Runtime, לא ב-CMDB | High |
| `structural_stale_in_cmdb` | ישות קיימת ב-CMDB, לא ב-Runtime | Medium |
| `ownership` | אי-התאמה בבעלות | Medium |
| `configuration` | אי-התאמה ב-environment/config | Low |
| `lifecycle` | CMDB מסומן decommissioned אבל עדיין רץ | Critical |

#### רמות חומרה

```
Critical  ████████████  → פעולה מיידית נדרשת
High      ████████      → טיפול בהקדם
Medium    █████         → לתכנון
Low       ███           → לידיעה
```

#### Kinds הניתנים למיפוי

- Deployment
- StatefulSet
- Service

### 3.3 Graph Builder - בונה גרפים

**מיקום:** `src/api/services/graph_builder.py`

**מטרה:** בניית גרף תשתיות המשלב Runtime + CMDB + Drift

#### מבנה הגרף

```
GraphSnapshot
    │
    ├── GraphNode[] (nodes)
    │   ├── type: "runtime" | "cmdb"
    │   ├── drift_status: "mapped" | "missing_in_cmdb" | "stale_in_cmdb" | ...
    │   ├── drift_severity: "low" | "medium" | "high" | "critical"
    │   └── position_x, position_y (for React Flow)
    │
    └── GraphEdge[] (edges)
        ├── edge_type: "mapped_to_cmdb" | "missing_in_cmdb" | "stale_in_cmdb"
        ├── source_node_id
        └── target_node_id
```

#### סטטוסי Drift בגרף

| סטטוס | צבע | משמעות |
|-------|-----|--------|
| `mapped` | ירוק | Runtime ו-CMDB מסונכרנים |
| `missing_in_cmdb` | אדום | חסר ב-CMDB |
| `stale_in_cmdb` | צהוב | קיים ב-CMDB, לא רץ |
| `ownership_mismatch` | כתום | אי-התאמה בבעלות |
| `config_mismatch` | כתום | אי-התאמה בקונפיגורציה |
| `lifecycle_conflict` | אדום כהה | קונפליקט lifecycle |

### 3.4 Action Service - שירות פעולות

**מיקום:** `src/api/services/action_service.py`

**מטרה:** ניהול workflow של פעולות תיקון

#### מכונת מצבים

```
                    ┌─────────┐
                    │proposed │
                    └────┬────┘
                         │
            ┌────────────┼────────────┐
            ▼            │            ▼
      ┌──────────┐       │      ┌──────────┐
      │ approved │       │      │ rejected │
      └────┬─────┘       │      └──────────┘
           │             │
           ▼             │
      ┌──────────┐       │
      │ applied  │       │
      └────┬─────┘       │
           │             │
           ▼             │
      ┌──────────┐       │
      │ failed   │←──────┘
      └──────────┘
```

#### סוגי פעולות

| סוג | תיאור | תוצאה |
|-----|-------|-------|
| `create_cmdb` | יצירת רשומת CMDB חדשה | CMDBItem חדש |
| `update_cmdb` | עדכון רשומה קיימת | CMDBItem מעודכן |
| `decommission_cmdb` | סימון כ-decommissioned | שינוי status |
| `acknowledge` | הכרה ב-drift ללא שינוי | סגירת הממצא |

### 3.5 AI Explainer - שירות הסבר AI

**מיקום:** `src/api/services/ai_explainer.py`

**מטרה:** יצירת הסברים מבוססי עדויות על מצב התשתיות

#### מבנה תגובת AI

```typescript
interface AIExplanation {
  summary: string;           // סיכום כללי
  headline: string;          // כותרת משפיעה ל-UI
  evidence: Evidence[];      // עדויות שנאספו
  inference: {
    type: string;            // סוג המסקנה
    confidence: number;      // 0.0-1.0
    description: string;
  };
  risk_level: "critical" | "high" | "medium" | "low";
  why_it_matters: string;    // השפעה עסקית/רגולטורית
  suggested_actions: SuggestedAction[];
  highlighted_node_ids: string[];  // לסימון בגרף
}
```

#### סוגי עדויות

- **Runtime Evidence:** נתונים מ-K8s (uptime, replicas, labels)
- **CMDB Evidence:** נתונים מרשומות CMDB
- **Drift Evidence:** ממצאי סטיות
- **Security Evidence:** חשיפות אבטחה (TLS, public exposure)
- **Audit Evidence:** היסטוריית פעולות

### 3.6 Audit Service - שירות ביקורת

**מיקום:** `src/api/services/audit_service.py`

**מטרה:** רישום מרכזי לכל הפעולות במערכת

#### סוגי אירועים

| קטגוריה | אירועים |
|---------|---------|
| Snapshot | `snapshot_created`, `snapshot_completed`, `snapshot_failed` |
| Drift | `drift_detected`, `drift_resolved`, `drift_acknowledged` |
| Action | `action_proposed`, `action_approved`, `action_rejected`, `action_applied` |
| CMDB | `cmdb_item_created`, `cmdb_item_updated`, `cmdb_item_decommissioned` |

#### מידע נרשם

```python
AuditLog(
    event_type="action_approved",
    entity_type="Action",
    entity_id=123,
    actor="john.doe@company.com",
    details={
        "drift_record_id": 456,
        "action_type": "create_cmdb",
        "review_comment": "Approved for production"
    },
    created_at=datetime.utcnow()
)
```

### 3.7 Architecture Service - שירות ארכיטקטורה

**מיקום:** `src/api/services/architecture_service.py`

**מטרה:** ניהול מודל ארכיטקטורת המערכת

#### מקור נתונים

```yaml
# docs/architecture/system-model.yaml
nodes:
  - id: api
    label: "FastAPI Backend"
    type: container
    technology: Python, FastAPI

edges:
  - from: api
    to: postgres
    label: "SQL"

views:
  - name: "Full System"
    includes: ["api", "ui", "postgres", "redis"]
```

#### פונקציונליות

- טעינת מודל מ-YAML
- יצירת דיאגרמות Mermaid
- ולידציה של שלמות המודל
- פרטי node עם קשרים

---

## 4. מודל הנתונים

### 4.1 דיאגרמת ERD

```
┌─────────────────┐       ┌─────────────────┐
│    Snapshot     │       │    CMDBItem     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ source          │       │ ci_type         │
│ status          │       │ name            │
│ entity_count    │       │ namespace       │
│ started_at      │       │ environment     │
│ completed_at    │       │ owner           │
└────────┬────────┘       │ status          │
         │                │ description     │
         │ 1:N            │ extra_data      │
         ▼                └────────┬────────┘
┌─────────────────┐                │
│NormalizedEntity │                │
├─────────────────┤                │
│ id (PK)         │                │
│ snapshot_id(FK) │                │
│ source_type     │       ┌────────┴────────┐
│ kind            │       │                 │
│ name            │       │     1:N         │
│ namespace       │       ▼                 │
│ uid             │ ┌─────────────────┐     │
│ labels          │ │   DriftRecord   │     │
│ annotations     │ ├─────────────────┤     │
│ owner           │ │ id (PK)         │     │
│ environment     │ │ snapshot_id(FK) │     │
│ raw_data        │ │ entity_id (FK)  │◄────┘
└────────┬────────┘ │ cmdb_item_id(FK)│
         │          │ drift_type      │
         │          │ severity        │
         │          │ status          │
         │          │ description     │
         │          │ details         │
         │          └────────┬────────┘
         │                   │
         │                   │ 1:N
         │                   ▼
         │          ┌─────────────────┐
         │          │     Action      │
         │          ├─────────────────┤
         │          │ id (PK)         │
         │          │drift_record_id  │
         │          │ action_type     │
         │          │ status          │
         │          │ description     │
         │          │ payload         │
         │          │ proposed_by     │
         │          │ reviewed_by     │
         │          │ applied_at      │
         │          └─────────────────┘
         │
         │          ┌─────────────────┐
         │          │   AuditLog      │
         │          ├─────────────────┤
         │          │ id (PK)         │
         │          │ event_type      │
         │          │ entity_type     │
         │          │ entity_id       │
         │          │ actor           │
         │          │ details         │
         │          │ created_at      │
         │          └─────────────────┘
         │
         ▼
┌─────────────────┐
│  GraphSnapshot  │
├─────────────────┤       ┌─────────────────┐
│ id (PK)         │       │   GraphNode     │
│ snapshot_id(FK) │       ├─────────────────┤
│ status          │ 1:N   │ id (PK)         │
│ node_count      │──────►│graph_snapshot_id│
│ edge_count      │       │ node_id         │
│ created_at      │       │ node_type       │
└─────────────────┘       │ entity_id (FK)  │
         │                │ cmdb_item_id(FK)│
         │                │ drift_status    │
         │                │ drift_severity  │
         │                │ position_x/y    │
         │                └─────────────────┘
         │
         │ 1:N    ┌─────────────────┐
         └───────►│   GraphEdge     │
                  ├─────────────────┤
                  │ id (PK)         │
                  │graph_snapshot_id│
                  │ edge_id         │
                  │ edge_type       │
                  │ source_node_id  │
                  │ target_node_id  │
                  │ label           │
                  └─────────────────┘
```

### 4.2 פירוט טבלאות

#### Snapshot - צילום מצב

| שדה | סוג | תיאור |
|-----|-----|-------|
| id | Integer (PK) | מזהה ייחודי |
| source | String | מקור (e.g., "kubernetes:dev-cluster") |
| status | Enum | pending, completed, failed |
| entity_count | Integer | מספר ישויות שנאספו |
| error_message | Text | הודעת שגיאה (אם נכשל) |
| started_at | DateTime | זמן התחלה |
| completed_at | DateTime | זמן סיום |

#### NormalizedEntity - ישות מנורמלת

| שדה | סוג | תיאור |
|-----|-----|-------|
| id | Integer (PK) | מזהה ייחודי |
| snapshot_id | Integer (FK) | קשר ל-Snapshot |
| source_type | String | kubernetes, aws, etc. |
| kind | String | Deployment, Service, etc. |
| name | String | שם הישות |
| namespace | String | namespace ב-K8s |
| uid | String | מזהה ייחודי במקור |
| labels | JSON | labels מ-K8s |
| annotations | JSON | annotations מ-K8s |
| owner | String | בעלים (inferred) |
| environment | String | סביבה (inferred) |
| raw_data | JSON | נתונים גולמיים |

#### CMDBItem - פריט CMDB

| שדה | סוג | תיאור |
|-----|-----|-------|
| id | Integer (PK) | מזהה ייחודי |
| ci_type | String | סוג CI (Deployment, Service) |
| name | String | שם הפריט |
| namespace | String | namespace |
| environment | String | production, staging, dev |
| owner | String | צוות/אדם אחראי |
| status | Enum | active, decommissioned, planned |
| description | Text | תיאור |
| extra_data | JSON | מידע נוסף |
| created_at | DateTime | זמן יצירה |
| updated_at | DateTime | זמן עדכון אחרון |

#### DriftRecord - רשומת סטייה

| שדה | סוג | תיאור |
|-----|-----|-------|
| id | Integer (PK) | מזהה ייחודי |
| snapshot_id | Integer (FK) | קשר ל-Snapshot |
| entity_id | Integer (FK) | קשר ל-NormalizedEntity |
| cmdb_item_id | Integer (FK) | קשר ל-CMDBItem (nullable) |
| drift_type | String | סוג הסטייה |
| severity | Enum | low, medium, high, critical |
| status | Enum | open, acknowledged, resolved |
| description | Text | תיאור הסטייה |
| details | JSON | פרטים נוספים |
| created_at | DateTime | זמן זיהוי |
| resolved_at | DateTime | זמן פתרון |

#### Action - פעולת תיקון

| שדה | סוג | תיאור |
|-----|-----|-------|
| id | Integer (PK) | מזהה ייחודי |
| drift_record_id | Integer (FK) | קשר ל-DriftRecord |
| action_type | Enum | create_cmdb, update_cmdb, decommission_cmdb, acknowledge |
| status | Enum | proposed, approved, rejected, applied, failed |
| description | Text | תיאור הפעולה |
| payload | JSON | נתונים לביצוע |
| proposed_by | String | מי הציע |
| proposed_at | DateTime | מתי הוצע |
| reviewed_by | String | מי אישר/דחה |
| reviewed_at | DateTime | מתי נבדק |
| review_comment | Text | הערת הבודק |
| applied_at | DateTime | מתי בוצע |
| result | JSON | תוצאת הביצוע |

---

## 5. ממשקי API

### 5.1 סקירת Endpoints

**Base URL:** `/api/v1/`

```
┌──────────────────────────────────────────────────────────────┐
│                        API Structure                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  /discovery                                                   │
│    ├── GET  /collectors          רשימת collectors זמינים     │
│    ├── POST /snapshots           הפעלת discovery              │
│    ├── GET  /snapshots/{id}      סטטוס snapshot               │
│    └── GET  /snapshots/{id}/entities  ישויות ב-snapshot      │
│                                                               │
│  /cmdb                                                        │
│    ├── GET    /items             רשימת פריטי CMDB            │
│    ├── GET    /items/{id}        פריט ספציפי                  │
│    ├── POST   /items             יצירת פריט                   │
│    ├── PATCH  /items/{id}        עדכון פריט                   │
│    └── POST   /seed              טעינת נתוני בדיקה            │
│                                                               │
│  /drift                                                       │
│    ├── POST /detect              הפעלת זיהוי drift            │
│    ├── GET  /records             רשימת drifts                 │
│    ├── GET  /records/{id}        drift ספציפי                 │
│    ├── PATCH /records/{id}/status  עדכון סטטוס               │
│    └── GET  /summary             סיכום סטטיסטי                │
│                                                               │
│  /graph                                                       │
│    ├── POST /build               בניית graph snapshot         │
│    ├── GET  /snapshots           רשימת snapshots              │
│    ├── GET  /latest              הגרף האחרון                  │
│    ├── GET  /snapshots/{id}      גרף ספציפי                   │
│    ├── GET  /nodes/{id}          פרטי node                    │
│    └── GET  /summary             סיכום סטטיסטי                │
│                                                               │
│  /actions                                                     │
│    ├── POST /                    הצעת פעולה                   │
│    ├── GET  /                    רשימת פעולות                 │
│    ├── GET  /{id}                פעולה ספציפית                │
│    ├── POST /{id}/approve        אישור                        │
│    ├── POST /{id}/reject         דחייה                        │
│    └── POST /{id}/apply          ביצוע                        │
│                                                               │
│  /audit                                                       │
│    ├── GET /                     רשימת audit logs             │
│    ├── GET /entity/{type}/{id}   היסטוריית ישות              │
│    └── GET /summary              סיכום סטטיסטי                │
│                                                               │
│  /ai                                                          │
│    ├── POST /explain             הסבר AI (body)               │
│    ├── GET  /explain/{type}/{ns}/{name}  הסבר AI (path)      │
│    └── GET  /demo                תרחיש דמו                    │
│                                                               │
│  /architecture                                                │
│    ├── GET /model                מודל ארכיטקטורה              │
│    ├── GET /diagram              דיאגרמת Mermaid              │
│    ├── GET /nodes                רשימת nodes                  │
│    ├── GET /nodes/{id}           פרטי node                    │
│    ├── GET /validate             ולידציה                      │
│    └── GET /views                views זמינים                 │
│                                                               │
│  /demo                                                        │
│    ├── POST /seed                איפוס וטעינת demo            │
│    └── GET  /scenario            מידע על התרחיש              │
│                                                               │
│  /health                         בדיקת תקינות                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 דוגמאות API

#### Discovery - הפעלת סריקה

```http
POST /api/v1/discovery/snapshots
Content-Type: application/json

{
  "source_type": "kubernetes",
  "config": {
    "cluster_name": "production",
    "use_fixture": false
  }
}
```

**Response:**
```json
{
  "id": 1,
  "source": "kubernetes:production",
  "status": "pending",
  "started_at": "2024-01-15T10:30:00Z"
}
```

#### Drift - הפעלת זיהוי

```http
POST /api/v1/drift/detect
Content-Type: application/json

{
  "snapshot_id": 1
}
```

**Response:**
```json
{
  "snapshot_id": 1,
  "drift_count": 5,
  "by_severity": {
    "critical": 1,
    "high": 2,
    "medium": 1,
    "low": 1
  }
}
```

#### Actions - אישור פעולה

```http
POST /api/v1/actions/123/approve
Content-Type: application/json

{
  "reviewer": "admin@company.com",
  "comment": "Approved - verified with team lead"
}
```

#### AI - בקשת הסבר

```http
GET /api/v1/ai/explain/Deployment/production/payment-service
```

**Response:**
```json
{
  "summary": "payment-service is running in production but has no CMDB record",
  "headline": "Shadow IT: Critical service running without governance",
  "evidence": [
    {
      "source": "runtime",
      "fact": "Running for 242 days",
      "confidence": 1.0
    },
    {
      "source": "cmdb",
      "fact": "No matching CMDB item found",
      "confidence": 1.0
    }
  ],
  "inference": {
    "type": "shadow_it",
    "confidence": 0.95,
    "description": "Service deployed outside normal governance"
  },
  "risk_level": "high",
  "why_it_matters": "Untracked services pose compliance and security risks",
  "suggested_actions": [
    {
      "action": "create_cmdb",
      "priority": "high",
      "rationale": "Register service in CMDB for governance"
    }
  ],
  "highlighted_node_ids": ["runtime-payment-service-production"]
}
```

---

## 6. ממשק משתמש

### 6.1 מבנה האפליקציה

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Top Navigation                        │   │
│  │  [Logo]     Dashboard | Graph | Drifts | Actions | ...   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────┐  ┌───────────────────────────────────────────────┐   │
│  │      │  │                                               │   │
│  │  S   │  │              Main Content Area                │   │
│  │  i   │  │                                               │   │
│  │  d   │  │   [Dashboard / Graph / Drifts / etc.]         │   │
│  │  e   │  │                                               │   │
│  │  b   │  │                                               │   │
│  │  a   │  │                                               │   │
│  │  r   │  │                                               │   │
│  │      │  │                                               │   │
│  └──────┘  └───────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 מסכים ראשיים

#### Dashboard - לוח בקרה

```
┌─────────────────────────────────────────────────────────────┐
│                       Dashboard                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Open     │  │ Critical │  │ Resolved │  │ Pending  │    │
│  │ Drifts   │  │ Issues   │  │ Today    │  │ Actions  │    │
│  │    12    │  │     3    │  │     5    │  │     4    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Recent Drifts                                         │   │
│  │ ┌────────────────────────────────────────────────┐   │   │
│  │ │ payment-service  │ missing_in_cmdb │ HIGH │ ⚡ │   │   │
│  │ │ legacy-billing   │ stale_in_cmdb   │ MED  │ ⚡ │   │   │
│  │ │ auth-service     │ ownership       │ MED  │ ⚡ │   │   │
│  │ └────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pending Actions                                       │   │
│  │ ┌────────────────────────────────────────────────┐   │   │
│  │ │ Create CMDB for payment-service │ [Approve] [X]│   │   │
│  │ │ Update owner for auth-service   │ [Approve] [X]│   │   │
│  │ └────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Graph - ויזואליזציית גרף

```
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure Graph                    [Search] [Filter▾] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐ ┌────────────────────┐ │
│  │                                 │ │ Node Details       │ │
│  │      ┌───────┐                  │ │                    │ │
│  │      │ K8s   │                  │ │ payment-service    │ │
│  │      │Cluster│                  │ │ ─────────────────  │ │
│  │      └───┬───┘                  │ │ Type: Deployment   │ │
│  │          │                      │ │ Namespace: prod    │ │
│  │    ┌─────┼─────┐                │ │ Owner: unknown     │ │
│  │    │     │     │                │ │                    │ │
│  │  ┌─┴─┐ ┌─┴─┐ ┌─┴─┐              │ │ CMDB Status:       │ │
│  │  │🔴│ │🟢│ │🟢│              │ │ ⚠️ Missing         │ │
│  │  │pay│ │auth│ │api│              │ │                    │ │
│  │  └───┘ └───┘ └───┘              │ │ Drifts:            │ │
│  │    │     │     │                │ │ • missing_in_cmdb  │ │
│  │    └─────┼─────┘                │ │ • no_owner         │ │
│  │          │                      │ │                    │ │
│  │      ┌───┴───┐                  │ │ [Propose Action]   │ │
│  │      │ CMDB  │                  │ │                    │ │
│  │      └───────┘                  │ └────────────────────┘ │
│  └─────────────────────────────────┘                        │
│                                                              │
│  Legend: 🟢 Mapped  🟡 Stale  🔴 Missing  🟠 Mismatch       │
└─────────────────────────────────────────────────────────────┘
```

#### Lie Detector - גלאי השקרים

```
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Lie Detector                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   RUNTIME   │  │    CMDB     │  │    BUREAUCRACY      │  │
│  │   (Truth)   │  │  (Records)  │  │   (Organization)    │  │
│  │             │  │             │  │                     │  │
│  │ payment-svc │  │             │  │ Owner: ???          │  │
│  │ ├─ running  │  │  (empty)    │  │ Approved: No        │  │
│  │ ├─ 8 months │  │             │  │ Budget: Unknown     │  │
│  │ └─ prod ns  │  │             │  │                     │  │
│  │             │  │             │  │                     │  │
│  │ auth-svc    │  │ auth-svc    │  │ Owner: platform     │  │
│  │ ├─ running  │  │ ├─ active   │  │ Approved: Yes       │  │
│  │ └─ mapped ✓ │  │ └─ platform │  │ Budget: IT-2024     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ AI Explanation                                         │  │
│  │ ───────────────                                        │  │
│  │ ⚠️ SHADOW IT DETECTED                                  │  │
│  │                                                        │  │
│  │ payment-service has been running for 8 months in       │  │
│  │ production without any CMDB record or assigned owner.  │  │
│  │                                                        │  │
│  │ Evidence:                                              │  │
│  │ • Runtime: Deployment active since May 2024            │  │
│  │ • CMDB: No matching configuration item found           │  │
│  │ • Security: Publicly exposed at payments.example.com   │  │
│  │                                                        │  │
│  │ Risk: HIGH - Compliance violation, security exposure   │  │
│  │                                                        │  │
│  │ Suggested Actions:                                     │  │
│  │ [Create CMDB Record] [Assign Owner] [Review Security]  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### AI Assistant - עוזר AI

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Assistant                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │  User: What services are running without CMDB?        │  │
│  │                                                       │  │
│  │  ─────────────────────────────────────────────────    │  │
│  │                                                       │  │
│  │  AI: I found 3 services running without CMDB records: │  │
│  │                                                       │  │
│  │  1. payment-service (production) - HIGH RISK          │  │
│  │     Running 242 days, handles financial transactions  │  │
│  │                                                       │  │
│  │  2. metrics-collector (monitoring) - MEDIUM RISK      │  │
│  │     Running 45 days, internal only                    │  │
│  │                                                       │  │
│  │  3. temp-migration-job (staging) - LOW RISK           │  │
│  │     Running 3 days, temporary workload                │  │
│  │                                                       │  │
│  │  [View in Graph] [Create CMDB Records]                │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Ask a question...                              [Send] │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Suggestions:                                                │
│  [Who owns payment-service?] [Show security risks]          │
│  [What changed this week?]   [Compliance status]            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 עקרונות עיצוב

#### תמה כהה (Dark Theme)

| אלמנט | צבע |
|-------|-----|
| רקע ראשי | `#121212` |
| רקע משני | `#1e1e1e` |
| טקסט ראשי | `#ffffff` |
| טקסט משני | `#b3b3b3` |
| Primary (אינדיגו) | `#5c6bc0` |
| Success (ירוק) | `#4caf50` |
| Warning (כתום) | `#ff9800` |
| Error (אדום) | `#f44336` |

#### קומפוננטות משותפות

- **SummaryCard** - כרטיס סטטיסטיקה עם אייקון וטרנד
- **SeverityChip** - תג חומרה צבעוני
- **StatusChip** - תג סטטוס
- **ConfirmDialog** - דיאלוג אישור פעולה
- **EmptyState** - מצב רשימה ריקה

---

## 7. תהליכים עסקיים

### 7.1 תהליך Discovery מלא

```
┌──────────────┐
│    START     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ User triggers discovery via API/UI   │
│ POST /api/v1/discovery/snapshots     │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Create Snapshot record (pending)     │
│ Log audit: snapshot_created          │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ KubernetesCollector connects to      │
│ cluster (kubeconfig/in-cluster)      │
└──────────────────┬───────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   Success    │        │   Failure    │
└──────┬───────┘        └──────┬───────┘
       │                       │
       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ Fetch resources: │    │ Update Snapshot: │
│ - Deployments    │    │ status = failed  │
│ - Services       │    │ error_message    │
│ - StatefulSets   │    │ Log audit:       │
│ - ConfigMaps     │    │ snapshot_failed  │
│ - Ingresses      │    └────────┬─────────┘
│ - Secrets        │             │
└────────┬─────────┘             │
         │                       │
         ▼                       │
┌──────────────────┐             │
│ Normalize each   │             │
│ resource:        │             │
│ - Extract labels │             │
│ - Infer owner    │             │
│ - Infer env      │             │
│ - Store raw data │             │
└────────┬─────────┘             │
         │                       │
         ▼                       │
┌──────────────────┐             │
│ Save Normalized  │             │
│ Entities to DB   │             │
└────────┬─────────┘             │
         │                       │
         ▼                       │
┌──────────────────┐             │
│ Update Snapshot: │             │
│ status=completed │             │
│ entity_count     │             │
│ completed_at     │             │
│ Log: completed   │             │
└────────┬─────────┘             │
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
              ┌──────────────┐
              │     END      │
              └──────────────┘
```

### 7.2 תהליך Drift Detection

```
┌──────────────┐
│    START     │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Load Snapshot entities          │
│ Load all CMDB items             │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│ Build lookup maps:              │
│ - entities by (kind,ns,name)    │
│ - cmdb items by (type,ns,name)  │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│ For each Runtime Entity:        │
└──────────────────┬──────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
┌──────────────┐        ┌──────────────┐
│ CMDB exists? │        │ No CMDB item │
│     YES      │        │              │
└──────┬───────┘        └──────┬───────┘
       │                       │
       ▼                       ▼
┌──────────────┐        ┌──────────────────┐
│Check matches:│        │Create DriftRecord│
│- Owner       │        │missing_in_cmdb   │
│- Environment │        │severity: HIGH    │
│- Lifecycle   │        └──────────────────┘
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Create DriftRecords for any    │
│ mismatches found               │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│ Check for stale CMDB items     │
│ (exist in CMDB, not in Runtime)│
│ Create stale_in_cmdb drifts    │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│ Log audit: drift_detected       │
│ Return drift summary           │
└──────────────────┬──────────────┘
                   │
                   ▼
              ┌──────────────┐
              │     END      │
              └──────────────┘
```

### 7.3 תהליך Action Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│   │ PROPOSE │───►│ REVIEW  │───►│ APPROVE │───►│  APPLY  │     │
│   └─────────┘    └────┬────┘    └─────────┘    └─────────┘     │
│                       │                                         │
│                       │         ┌─────────┐                     │
│                       └────────►│ REJECT  │                     │
│                                 └─────────┘                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

PROPOSE:
  - User selects drift record
  - Chooses action type (create/update/decommission/acknowledge)
  - Provides description and payload
  - System validates no pending action exists
  - Creates Action with status=proposed
  - Logs: action_proposed

REVIEW:
  - Reviewer sees pending actions
  - Reviews drift details and proposed action
  - Can approve or reject with comment

APPROVE:
  - Reviewer approves action
  - System updates status=approved
  - Logs: action_approved

REJECT:
  - Reviewer rejects action
  - System updates status=rejected
  - Logs: action_rejected

APPLY:
  - User (or system) applies approved action
  - Executes action (create/update/decommission CMDB)
  - Updates DriftRecord status=resolved
  - Marks Action status=applied
  - Logs: action_applied, cmdb_item_created/updated
```

### 7.4 תהליך AI Explanation

```
┌──────────────┐
│    START     │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Receive query:                  │
│ - Entity type                   │
│ - Namespace                     │
│ - Name                          │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│ GATHER EVIDENCE                 │
├─────────────────────────────────┤
│ 1. Find NormalizedEntity        │
│ 2. Find CMDBItem (if exists)    │
│ 3. Load DriftRecords            │
│ 4. Check Ingress/Security       │
│ 5. Load recent Audit logs       │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│ BUILD EVIDENCE ARRAY            │
│ For each source:                │
│ - fact: what was found          │
│ - source: where from            │
│ - confidence: 0.0-1.0           │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│ GENERATE INFERENCE              │
│ Based on evidence patterns:     │
│ - shadow_it (no CMDB, no owner) │
│ - config_drift (mismatches)     │
│ - lifecycle_conflict            │
│ - security_exposure             │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│ CALCULATE RISK                  │
│ critical > high > medium > low  │
│ Based on:                       │
│ - Drift severity                │
│ - Security exposure             │
│ - Missing governance            │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│ SUGGEST ACTIONS                 │
│ Prioritized list based on risk  │
│ Each with rationale             │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│ RETURN AIExplanation            │
│ - summary                       │
│ - headline                      │
│ - evidence[]                    │
│ - inference                     │
│ - risk_level                    │
│ - why_it_matters                │
│ - suggested_actions[]           │
│ - highlighted_node_ids[]        │
└──────────────────┬──────────────┘
                   │
                   ▼
              ┌──────────────┐
              │     END      │
              └──────────────┘
```

---

## 8. אבטחה ו-Compliance

### 8.1 עקרונות אבטחה

#### Data Protection

| נושא | מימוש |
|------|-------|
| Secrets מ-K8s | נשמרים metadata בלבד, לא data |
| Credentials | דרך environment variables בלבד |
| Database | Connection string לא ב-code |
| Sensitive fields | לא נחשפים ב-API responses |

#### Access Control

```
┌────────────────────────────────────────────────────────┐
│                  Role-Based Access                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Viewer:                                               │
│  - Read snapshots, drifts, audit logs                  │
│  - View graph and explanations                         │
│                                                        │
│  Operator:                                             │
│  - All Viewer permissions                              │
│  - Trigger discovery                                   │
│  - Propose actions                                     │
│                                                        │
│  Approver:                                             │
│  - All Operator permissions                            │
│  - Approve/reject actions                              │
│                                                        │
│  Admin:                                                │
│  - All permissions                                     │
│  - Apply actions                                       │
│  - Manage CMDB directly                                │
│  - Seed/reset demo data                                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 8.2 Audit Trail

כל פעולה במערכת נרשמת ב-AuditLog:

```
Event Types:
├── snapshot_created
├── snapshot_completed
├── snapshot_failed
├── drift_detected
├── drift_resolved
├── drift_acknowledged
├── action_proposed
├── action_approved
├── action_rejected
├── action_applied
├── action_failed
├── cmdb_item_created
├── cmdb_item_updated
└── cmdb_item_decommissioned
```

### 8.3 Compliance Reporting

המערכת תומכת ב:

- **היסטוריית שינויים** - מי עשה מה ומתי
- **Chain of custody** - מעקב אחר כל פעולה
- **Evidence collection** - איסוף עדויות לכל החלטה
- **Retention** - שמירת snapshots לתקופה מוגדרת
- **Export** - יצוא נתונים לביקורת חיצונית

---

## 9. תשתית וסביבות

### 9.1 Docker Compose Stack

```yaml
# infra/docker-compose.yml

services:
  postgres:
    image: postgres:15-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dcmcmdb
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  api:
    build: ../src/api
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/dcmcmdb
      DEBUG: "false"
    depends_on:
      - postgres
      - redis

  ui:
    build: ../src/ui
    ports: ["3000:3000"]
    depends_on:
      - api

volumes:
  postgres_data:
```

### 9.2 ארכיטקטורת Deployment

```
┌──────────────────────────────────────────────────────────────┐
│                     Production Environment                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌───────────────────────────────────────────────────────┐  │
│   │                    Load Balancer                       │  │
│   │                  (nginx/Ingress)                       │  │
│   └───────────────────────────┬───────────────────────────┘  │
│                               │                               │
│           ┌───────────────────┼───────────────────┐          │
│           │                   │                   │          │
│           ▼                   ▼                   ▼          │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐  │
│   │   UI (React)  │   │   API (Fast)  │   │   API (Fast)  │  │
│   │   nginx:3000  │   │   uvicorn     │   │   uvicorn     │  │
│   └───────────────┘   │   :8000       │   │   :8000       │  │
│                       └───────┬───────┘   └───────┬───────┘  │
│                               │                   │          │
│                               └─────────┬─────────┘          │
│                                         │                    │
│                         ┌───────────────┼───────────────┐    │
│                         ▼               ▼               │    │
│                 ┌───────────────┐ ┌───────────────┐     │    │
│                 │  PostgreSQL   │ │    Redis      │     │    │
│                 │   (Primary)   │ │   (Queue)     │     │    │
│                 └───────────────┘ └───────────────┘     │    │
│                                                         │    │
│   ┌────────────────────────────────────────────────────┘    │
│   │                                                          │
│   ▼                                                          │
│   ┌───────────────────────────────────────────────────────┐  │
│   │                  Kubernetes Clusters                   │  │
│   │                (Discovery Targets)                     │  │
│   │   ┌─────────┐  ┌─────────┐  ┌─────────┐              │  │
│   │   │  Dev    │  │ Staging │  │  Prod   │              │  │
│   │   │ Cluster │  │ Cluster │  │ Cluster │              │  │
│   │   └─────────┘  └─────────┘  └─────────┘              │  │
│   └───────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 9.3 Environment Variables

| משתנה | תיאור | ברירת מחדל |
|-------|-------|------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/dcmcmdb` |
| `DEBUG` | Enable debug mode | `false` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000,http://localhost:5173` |
| `LOG_LEVEL` | Logging level | `INFO` |

---

## 10. בדיקות

### 10.1 אסטרטגיית בדיקות

```
┌─────────────────────────────────────────────────────────────┐
│                     Testing Pyramid                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                          ▲                                   │
│                         /│\                                  │
│                        / │ \        E2E Tests               │
│                       /  │  \       (Playwright)             │
│                      /   │   \      - Smoke tests            │
│                     /    │    \     - Critical flows         │
│                    ───────────────                           │
│                   /       │       \                          │
│                  /        │        \  Integration Tests      │
│                 /         │         \ (pytest + DB)          │
│                /          │          \- API endpoints        │
│               /           │           \- Service layer       │
│              ─────────────────────────────                   │
│             /             │             \                    │
│            /              │              \  Unit Tests       │
│           /               │               \ (pytest/vitest)  │
│          /                │                \- Collectors     │
│         /                 │                 \- Normalizers   │
│        /                  │                  \- Drift engine │
│       ──────────────────────────────────────────             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Backend Testing

**מיקום:** `tests/`

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src/api --cov-report=html

# Run specific module
pytest tests/unit/test_drift_engine.py -v
```

#### סוגי בדיקות

| סוג | מה נבדק | כלים |
|-----|---------|------|
| Unit | Collector, Normalizer, Drift Engine logic | pytest, mocks |
| Integration | API + Database | pytest, test DB |
| Contract | API schema validation | pytest |

#### Fixtures

- **K8s Fixtures** - נתוני K8s דטרמיניסטיים ללא cluster אמיתי
- **CMDB Fixtures** - נתוני CMDB לבדיקות
- **Demo Scenario** - תרחיש מלא עם drifts מוגדרים

### 10.3 Frontend Testing

**מיקום:** `src/ui/src/`

```bash
# Run tests
npm run test --prefix src/ui

# Run with coverage
npm run test:coverage --prefix src/ui

# Run in watch mode
npm run test:watch --prefix src/ui
```

#### סוגי בדיקות

| סוג | מה נבדק | כלים |
|-----|---------|------|
| Component | UI components rendering | vitest, React Testing Library |
| Hook | API hooks and state | vitest |
| E2E | Full user flows | Playwright |

### 10.4 CI Pipeline

```yaml
# .github/workflows/ci.yml

jobs:
  backend-lint-test:
    - Lint: pylint, black, isort
    - Unit tests: pytest

  backend-integration:
    - Start PostgreSQL service
    - Run integration tests

  ui-lint-test:
    - Lint: eslint
    - Unit tests: vitest

  security:
    - Dependency scanning
    - SAST (non-blocking)

  docker-build:
    - Build API image
    - Build UI image
```

---

## 11. מפת דרכים

### 11.1 שלבי פיתוח

```
┌─────────────────────────────────────────────────────────────────┐
│                      Development Phases                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: Scaffolding                               ✅ COMPLETE  │
│  ├── Project structure                                          │
│  ├── Docker compose                                             │
│  └── Basic FastAPI setup                                        │
│                                                                  │
│  Phase 2: Backend Core                              ✅ COMPLETE  │
│  ├── Database models                                            │
│  ├── Basic CRUD operations                                      │
│  └── Health endpoints                                           │
│                                                                  │
│  Phase 3: Discovery + Normalization                 ✅ COMPLETE  │
│  ├── Kubernetes collector                                       │
│  ├── Entity normalization                                       │
│  └── Snapshot management                                        │
│                                                                  │
│  Phase 4: Drift + Actions                           ✅ COMPLETE  │
│  ├── Drift detection engine                                     │
│  ├── Action workflow                                            │
│  └── Audit logging                                              │
│                                                                  │
│  Phase 5: UI MVP                                    ✅ COMPLETE  │
│  ├── React setup with Vite                                      │
│  ├── Dashboard                                                  │
│  ├── Drifts and Actions pages                                   │
│  └── Audit page                                                 │
│                                                                  │
│  Phase 5.5: Graph Visualization                     ✅ COMPLETE  │
│  ├── React Flow integration                                     │
│  ├── Graph builder service                                      │
│  └── Interactive graph UI                                       │
│                                                                  │
│  Phase 6: Tests                                     ✅ COMPLETE  │
│  ├── Unit tests (backend)                                       │
│  ├── Component tests (frontend)                                 │
│  └── Integration tests                                          │
│                                                                  │
│  Phase 6.5: Infrastructure Lie Detector             ✅ COMPLETE  │
│  ├── Three-column view                                          │
│  ├── AI Explainer service                                       │
│  └── Demo scenario                                              │
│                                                                  │
│  Phase 7: CI/CD                                     ✅ COMPLETE  │
│  ├── GitHub Actions                                             │
│  ├── Lint, test, build jobs                                     │
│  └── Docker builds                                              │
│                                                                  │
│  Phase 7.5: Architecture Visualizer                 ✅ COMPLETE  │
│  ├── System model YAML                                          │
│  ├── Mermaid diagrams                                           │
│  └── Architecture UI page                                       │
│                                                                  │
│  Phase 8: Enhancements                              🔄 PLANNED   │
│  ├── Claude API integration for AI                              │
│  ├── Background worker (RQ)                                     │
│  ├── Thermals module                                            │
│  └── ServiceNow integration                                     │
│                                                                  │
│  Phase 9: Production Readiness                      📋 BACKLOG   │
│  ├── Full E2E test suite                                        │
│  ├── Performance optimization                                   │
│  ├── Monitoring and alerting                                    │
│  └── Documentation completion                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 תכונות מתוכננות

| תכונה | תיאור | עדיפות |
|-------|-------|--------|
| Claude API Integration | הסברי AI מתקדמים עם Claude | גבוהה |
| Background Worker | עיבוד אסינכרוני עם RQ | גבוהה |
| Thermals Module | ניטור טמפרטורות data center | בינונית |
| ServiceNow Sync | סנכרון דו-כיווני עם CMDB אמיתי | בינונית |
| Multi-cluster Support | תמיכה במספר clusters במקביל | בינונית |
| Scheduled Discovery | סריקות מתוזמנות | בינונית |
| Slack/Teams Alerts | התראות למערכות הודעות | נמוכה |
| Custom Collectors | תמיכה ב-AWS, Azure, GCP | נמוכה |

### 11.3 ADRs קיימים

| ADR | נושא | סטטוס |
|-----|------|-------|
| ADR-0002 | Infrastructure Graph Visualization | Proposed |
| ADR-0003 | Infrastructure Truth vs Org Reality | Accepted |
| ADR-0005 | System Architecture Visualizer Module | Proposed |
| ADR-0006 | Data Center Thermal Telemetry Module | Proposed |

---

## נספחים

### נספח א': מילון מונחים

| מונח | הגדרה |
|------|-------|
| **CMDB** | Configuration Management Database - בסיס נתונים לניהול תצורה |
| **CI** | Configuration Item - פריט תצורה ב-CMDB |
| **Drift** | סטייה בין מצב בפועל למצב מתועד |
| **Snapshot** | צילום מצב של תשתיות בנקודת זמן |
| **Runtime** | מה שרץ בפועל בתשתיות |
| **Normalized Entity** | ייצוג אחיד של משאב מכל מקור |
| **Shadow IT** | תשתיות שרצות ללא אישור/תיעוד |
| **Graph Snapshot** | גרף תשתיות בנקודת זמן |

### נספח ב': קבצים חשובים

| קובץ | תפקיד |
|------|-------|
| `src/api/main.py` | נקודת כניסה ל-FastAPI |
| `src/api/config.py` | הגדרות תצורה |
| `src/api/database.py` | SQLAlchemy setup |
| `src/api/models/__init__.py` | כל המודלים |
| `src/api/services/drift_engine.py` | לוגיקת Drift |
| `src/api/services/graph_builder.py` | בניית גרפים |
| `src/api/services/ai_explainer.py` | הסברי AI |
| `src/ui/src/App.tsx` | React app ראשי |
| `docs/architecture/system-model.yaml` | מודל ארכיטקטורה |
| `ARCHITECTURE.md` | סקירת ארכיטקטורה |
| `PHASES.md` | שלבי פיתוח |

### נספח ג': פקודות נפוצות

```bash
# Backend
cd src/api
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd src/ui
npm install
npm run dev

# Docker
docker-compose -f infra/docker-compose.yml up

# Tests
pytest tests/ -v
npm run test --prefix src/ui

# Demo seeding
curl -X POST http://localhost:8000/api/v1/demo/seed
```

---

## היסטוריית גרסאות

| גרסה | תאריך | שינויים |
|------|-------|---------|
| 1.0 | 2026-01-28 | גרסה ראשונית |

---

*מסמך זה נוצר על בסיס ניתוח מקיף של קוד המקור והדוקומנטציה של פרויקט DCM-CMDB Bridge.*
