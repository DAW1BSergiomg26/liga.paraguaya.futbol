# Títulos Internacionales — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `titulos_internacionales` field to store and display Copa Libertadores, Copa Sudamericana, and Recopa titles per club.

**Architecture:** New JSON column on Club model + schema, populated in seed data, rendered in a distinct section on the club detail page. No Alembic migration needed — additive column via `_ensure_columns_exist()`.

**Tech Stack:** FastAPI/SQLAlchemy (backend), Next.js/TanStack Query (frontend)

## Global Constraints

- New field `titulos_internacionales` must be `JSON NOT NULL DEFAULT '[]'`
- Same structure as `titulos_info`: `Array<{torneo: string, cantidad: number}>`
- Optional on all layers — clubs without international titles omit the field or get `[]`
- No Alembic migration — column added via `_ensure_columns_exist()` in `database.py`

---

### Task 1: Backend — Model + Schema + DB Init

**Files:**
- Modify: `backend/app/models/club.py:24`
- Modify: `backend/app/schemas/club.py:17`
- Modify: `backend/app/core/database.py:97`

**Interfaces:**
- Consumes: existing `Club` model, `ClubOut`/`ClubDetailOut` schemas
- Produces: `Club.titulos_internacionales: Mapped[list]`, `ClubOut.titulos_internacionales: list`

- [ ] **Step 1: Add column to model**

`backend/app/models/club.py` — add after line 24:
```python
    titulos_internacionales: Mapped[list] = mapped_column(JSON, default=list)
```

- [ ] **Step 2: Add to schema**

`backend/app/schemas/club.py` — add to `ClubOut`:
```python
    titulos_internacionales: list = []
```

- [ ] **Step 3: Add to DB init**

`backend/app/core/database.py` — add to `club_columns` list:
```python
        ("titulos_internacionales", "JSON NOT NULL DEFAULT '[]'"),
```

---

### Task 2: Seed Data — JSON + Seed Script

**Files:**
- Modify: `data/clubes_paraguay.json` (Olimpia entry only)
- Modify: `backend/app/scripts/seed.py:34,57`

**Interfaces:**
- Consumes: `Club.titulos_internacionales` from Task 1
- Produces: populated `titulos_internacionales` for Olimpia

- [ ] **Step 1: Add data to Olimpia in JSON**

`data/clubes_paraguay.json` — add after Olimpia's `titulos_info`:
```json
    "titulos_internacionales": [
      { "torneo": "Copa Libertadores", "cantidad": 3 },
      { "torneo": "Supercopa Sudamericana", "cantidad": 1 },
      { "torneo": "Recopa Sudamericana", "cantidad": 1 },
      { "torneo": "Copa Intercontinental", "cantidad": 1 },
      { "torneo": "Copa Interamericana", "cantidad": 2 }
    ]
```

- [ ] **Step 2: Update seed.py — field list (line 34)**

Add `"titulos_internacionales"` to the update field list:
```python
            for field in ("sitio_web", "descripcion", "titulos_liga", "titulos_info", "titulos_internacionales"):
```

- [ ] **Step 3: Update seed.py — create (line 57)**

Add to `Club(...)` constructor:
```python
            titulos_internacionales=item.get("titulos_internacionales", []),
```

---

### Task 3: Frontend — Types

**Files:**
- Modify: `frontend/src/types/index.ts:14`

**Interfaces:**
- Consumes: none
- Produces: `Club.titulos_internacionales` type

- [ ] **Step 1: Add to Club interface**

`frontend/src/types/index.ts` — add after `titulos_info`:
```typescript
  titulos_internacionales: { torneo: string; cantidad: number }[];
```

---

### Task 4: Frontend — Detail Page

**Files:**
- Modify: `frontend/src/app/clubes/[id]/page.tsx`

**Interfaces:**
- Consumes: `Club.titulos_internacionales` from Task 3

- [ ] **Step 1: Render international titles section**

Before the `Próximos Partidos` section (after the closing `</div>` of the info grid), add:
```tsx
        {club.titulos_internacionales?.length > 0 && (
          <div className="mt-6 p-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
            <h3 className="text-lg font-bold text-yellow-300 mb-3">Títulos Internacionales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {club.titulos_internacionales.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-yellow-400 text-lg">🏆</span>
                  <div>
                    <p className="text-white font-medium">{t.torneo}</p>
                    <p className="text-yellow-300 text-2xl font-bold">{t.cantidad}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
```

---

### Task 5: Verify + Commit

**Files:** all modified files from Tasks 1-4

- [ ] **Step 1: Run backend tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: 64 tests passing (no behavior changed)

- [ ] **Step 2: Build frontend**

Run: `cd frontend && npx next build`
Expected: build succeeds, no type errors

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/club.py backend/app/schemas/club.py backend/app/core/database.py data/clubes_paraguay.json backend/app/scripts/seed.py frontend/src/types/index.ts frontend/src/app/clubes/[id]/page.tsx docs/superpowers/specs/2026-07-08-titulos-internacionales-design.md docs/superpowers/plans/2026-07-08-titulos-internacionales.md
git commit -m "feat: add titulos_internacionales field with Olimpia data"
```
