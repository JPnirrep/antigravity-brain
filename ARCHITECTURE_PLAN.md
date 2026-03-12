# 🏗️ ARCHITECTURE PLAN - Anti-Gravity Brain v2

## Vision Globale

```
┌─────────────────────────────────────────────────────────┐
│                  TON PC LOCAL                            │
├─────────────────┬───────────────────────┬────────────────┤
│  Workspace      │                       │  Outils/       │
│  • Research     │   CHAT INTERFACE      │  Agents/       │
│  • Dev          │   (Discussion actif)  │  Memory/       │
│  • Commercial   │                       │  Logs          │
│  • Visual       │                       │                │
│  • Global NB    │                       │                │
└─────────────────┴───────────────────────┴────────────────┘
                            ↕
                      [VPS OVH Cloud]
        (Anti-Gravity Brain + LLM Orchestration)
                            ↕
        ┌──────────────────────────────────────┐
        │  Firestore + PostgreSQL              │
        │  • Agents (Persistent)               │
        │  • Memory P1/P2/P3                   │
        │  • Knowledge Base (Briques)          │
        │  • Session History                   │
        └──────────────────────────────────────┘
```

## Couche 1 : Interface Unifiée (Locale)

### Frontend Web (React/Vue.js)
- **Responsive design** : Desktop + Mobile
- **WebSocket** pour sync real-time
- **Accès** depuis n'importe quel PC/Laptop
- **Mode PWA** : Installable comme app

### Structure UI
```
┌──────────────────────────────────────────────────────────┐
│ [Logo] Antigravity Brain                      [Settings] │
├────────────────┬──────────────────────────┬──────────────┤
│ Workspaces     │  CHAT PANEL              │ Tools Panel  │
│ ☑ Research     │                          │ • Agents     │
│ ☑ Development  │  User: Message           │ • Memory     │
│ ☑ Commercial   │                          │ • Vector DB  │
│ ☑ Visual       │  Assistant: Response     │ • Logs       │
│ ☐ New WS       │                          │ • Export     │
│                │                          │              │
│ Global NB      │  [Input box]             │              │
│ • Search       │  [Send]                  │              │
│ • Browse       │                          │              │
└────────────────┴──────────────────────────┴──────────────┘
```

## Couche 2 : Workspaces Évoluées

### Structure Workspace
```typescript
class Workspace {
    id: string;  // "research-2026-03"
    name: string;
    description: string;
    
    // Configuration
    agents: Agent[];  // Agents assignés
    memory: ContextMemory;  // P1/P2/P3 isolée
    tools: Tool[];  // Web search, scraping, etc.
    notes: Brick[];  // Pépites extraites
    settings: object;  // Config workspace
    
    // Timestamps
    createdAt: timestamp;
    updatedAt: timestamp;
    lastActive: timestamp;
    
    // Methods
    async activateAgent(agentId: string): Promise<void>;
    async addNote(brick: Brick): Promise<void>;
    async summarize(): Promise<object>;
    async export(format: 'md'|'pdf'|'json'): Promise<string>;
}
```

### Types de Workspaces
| Workspace | Agents | Outils | Mémoire Focus |
|-----------|--------|--------|--------------|
| **Research** | Researcher, Analyst | Web Search, Tavily | P2: Insights, Sources |
| **Development** | Coder, Debugger | Code Executor, Git | P2: Solutions, Patterns |
| **Commercial** | Content, Sales | Content Gen, Drafts | P2: Strategies, Plans |
| **Visual** | Designer, Creator | Image Gen, Export | P2: Concepts, Assets |
| **Global** | Orchestrator | All | P3: Knowledge Base |

## Couche 3 : Orchestration Intelligente (VPS)

### Backend Stack
```
FastAPI/Node.js (API Gateway)
    ↓
┌─────────────────────────────────────┐
│ WorkspaceOrchestrator               │
│ ├─ Workspace Router                 │
│ ├─ Agent Manager                    │
│ ├─ Memory Synthesizer               │
│ └─ LLM Router                       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Service Layer                       │
│ ├─ UnifiedLLMRouter                 │
│ ├─ MemoryService (P1/P2/P3)        │
│ ├─ IntentService                    │
│ ├─ VectorService                    │
│ └─ AudioService                     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ External APIs                       │
│ ├─ Gemini Pro                       │
│ ├─ OpenRouter                       │
│ ├─ Mercury2 / Inception             │
│ ├─ Tavily Search                    │
│ └─ OpenRouter Embeddings            │
└─────────────────────────────────────┘
```

### Flux de Traitement
```
User Input (Workspace: Research)
    ↓
IntentService → "research_query"
    ↓
WorkspaceOrchestrator.routeToAgent()
    ├─ Load Workspace context
    ├─ Load Memory P1/P2/P3
    ├─ Select Agent (Researcher)
    └─ Build system prompt
    ↓
UnifiedLLMRouter.selectProvider()
    ├─ Check budget
    ├─ Evaluate query complexity
    └─ Select: OpenRouter (Haiku) or Gemini
    ↓
LLM Call (streaming)
    ↓
Response Processing
    ├─ Extract insights
    ├─ Save to P1 (current history)
    ├─ Update context P2 if needed
    └─ Vector indexing for P3
    ↓
Real-time Stream to Frontend (WebSocket)
```

## Couche 4 : Synchronisation Intelligente

### Local ↔ Cloud Sync
```python
class SyncManager:
    
    # 1. Local Database (SQLite)
    local_db = SQLite("antigravity_local.db")
    
    # 2. Vector Cache (Faiss)
    vector_cache = FaissIndex("embeddings/")
    
    # 3. Bi-directional sync
    async def syncWithCloud(self):
        # Get changes depuis local
        local_delta = local_db.getChanges()
        
        # Get changes depuis cloud
        cloud_delta = firestore.getChanges()
        
        # Merge avec conflict resolution
        merged = mergeDelta(local_delta, cloud_delta)
        
        # Push vers VPS (compressé)
        await vps.update(merged)
        
        # Pull de VPS
        updates = await vps.getUpdates()
        local_db.applyUpdates(updates)
    
    # 4. Delta-based (frugal)
    async def pushDeltas():
        # Seulement les changements, pas la data entière
        deltas = local_db.getDeltasSince(lastSync)
        await vps.applyDeltas(deltas)
```

### Stratégie de Sync
- **Fréquence** : Auto à chaque interaction + manuel sur demande
- **Compression** : Delta-based (seulement les changements)
- **Offline** : Mode dégradé avec cache local
- **Conflict Resolution** : Timestamp-based (le plus récent gagne)

## Couche 5 : Stockage & Base de Données

### Infrastructure VPS
```
PostgreSQL
├─ Workspaces (metadata)
├─ Messages (P1)
├─ Index JSON (P2)
├─ Agents Registry
└─ Sync History

Firestore
├─ Bricks (P3 - Vectorized)
├─ User Settings
├─ Global Knowledge Base
└─ Real-time listeners

Vector DB (Qdrant ou Pinecone)
├─ Embeddings (Faiss local backup)
├─ Semantic search index
└─ RAG retrieval

Local (SQLite + Faiss)
├─ Cache complet
├─ Vector cache
└─ Offline mode
```

### Schema Workspace (PostgreSQL)
```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    user_id UUID,
    
    -- Configuration
    agents JSONB,  -- Array of agent IDs
    tools JSONB,   -- Enabled tools
    settings JSONB,
    
    -- Timestamps
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_active TIMESTAMP,
    
    -- Stats
    message_count INT,
    agent_count INT,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE workspace_memory (
    id UUID PRIMARY KEY,
    workspace_id UUID,
    
    p1_history JSONB,  -- Recent messages
    p2_index JSONB,    -- Compressed summary
    p3_brick_ids JSONB,  -- Vector IDs
    
    updated_at TIMESTAMP,
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);
```

## 🔒 Sécurité & Frugalité

### Sécurité
- ✅ Workspaces isolés (une baseline de mémoire par workspace)
- ✅ Auth JWT entre PC et VPS (HTTPS/TLS)
- ✅ Rate limiting sur appels LLM
- ✅ Pas de données sensibles en local cache (chiffré si sensible)
- ✅ Audit trail de toutes les actions

### Frugalité
- ✅ Cache local → Zéro latence pour queries similaires
- ✅ Delta sync → Réduction 80% du traffic
- ✅ Smart provider selection → Coût minimisé
- ✅ P1/P2/P3 compression → Tokens économisés
- ✅ Embedding vectoriel réutilisé → Pas de re-computation

## 🎯 Prochaines Étapes

1. **Setup Infrastructure** : Docker + DB sur OVH
2. **Backend API** : FastAPI avec WorkspaceOrchestrator
3. **Frontend Web** : React interface with WebSocket
4. **Integration** : Connect UnifiedLLMRouter + Agents
5. **Testing** : E2E testing workspace → LLM
6. **Launch** : Progressive rollout
