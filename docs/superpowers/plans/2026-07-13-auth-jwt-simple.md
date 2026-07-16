# Autenticación JWT Simple — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current opaque token auth with JWT-based authentication: register with password, login, logout, and profile page.

**Architecture:** Backend adds `python-jose` for JWT signing/verification and `passlib[bcrypt]` for password hashing. The existing `users` table gains a `hashed_password` column. Frontend stores JWT in localStorage, sends `Authorization: Bearer <jwt>`, and auto-refreshes on expiry. A new `/perfil` page shows user info.

**Tech Stack:** FastAPI, SQLAlchemy async, python-jose (JWT), passlib[bcrypt] (hashing), React, Next.js, @tanstack/react-query

## Global Constraints

- Python 3.11+, Next.js 16.2.10, React 19.2.4
- Backend runs on port 8000, frontend on port 3000
- Database: SQLite async (aiosqlite) for dev
- All comments in Spanish, code in English (existing convention)
- No new frontend libraries — use existing fetch + localStorage patterns
- JWT expiry: 7 days (simple, not overengineered)
- Secret key stored in `.env` as `JWT_SECRET`

---

### Task 1: Add dependencies + JWT secret config

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/app/core/config.py`

- [ ] **Step 1: Add dependencies to requirements.txt**

Add after the existing dependencies:
```
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
```

- [ ] **Step 2: Add JWT_SECRET to config.py**

In `backend/app/core/config.py`, add to the `Settings` class:
```python
jwt_secret: str = "change-me-in-production-2026"
jwt_algorithm: str = "HS256"
jwt_expire_days: int = 7
```

- [ ] **Step 3: Install dependencies**

Run: `cd backend && pip install -r requirements.txt`

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt backend/app/core/config.py
git commit -m "feat(auth): add JWT and bcrypt dependencies"
```

---

### Task 2: Add hashed_password column to users table

**Files:**
- Create: `backend/alembic/versions/005_add_user_password.py`
- Modify: `backend/app/models/user.py`

- [ ] **Step 1: Create Alembic migration**

Create `backend/alembic/versions/005_add_user_password.py`:

```python
"""add hashed_password to users

Revision ID: 005
Revises: 004
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("users", sa.Column("hashed_password", sa.String(256), nullable=True))

def downgrade() -> None:
    op.drop_column("users", "hashed_password")
```

- [ ] **Step 2: Add column to User model**

In `backend/app/models/user.py`, add after the `token` column:
```python
hashed_password = Column(String(256), nullable=True)
```

- [ ] **Step 3: Run migration**

Run: `cd backend && alembic upgrade head`

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/005_add_user_password.py backend/app/models/user.py
git commit -m "feat(auth): add hashed_password column to users"
```

---

### Task 3: Create JWT utility + password hashing helpers

**Files:**
- Create: `backend/app/core/security.py`

- [ ] **Step 1: Create security.py with JWT and password helpers**

```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from backend.app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=settings.jwt_expire_days))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None
```

- [ ] **Step 2: Verify import works**

Run: `cd backend && python -c "from app.core.security import hash_password, verify_password, create_access_token, decode_access_token; print('OK')"`

- [ ] **Step 3: Commit**

```bash
git add backend/app/core/security.py
git commit -m "feat(auth): add JWT and password hashing utilities"
```

---

### Task 4: Create auth schemas (register + login + token response)

**Files:**
- Modify: `backend/app/schemas/user.py`

- [ ] **Step 1: Add new schemas**

Append to `backend/app/schemas/user.py`:

```python
class UserRegister(BaseModel):
    email: str
    name: str
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"
```

- [ ] **Step 2: Verify schemas parse correctly**

Run: `cd backend && python -c "from app.schemas.user import UserRegister, UserLogin, TokenResponse; print('OK')"`

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/user.py
git commit -m "feat(auth): add register/login/token schemas"
```

---

### Task 5: Update UserService with password support + JWT logic

**Files:**
- Modify: `backend/app/services/user_service.py`

- [ ] **Step 1: Rewrite UserService**

Replace `backend/app/services/user_service.py` entirely:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.user import User
from backend.app.core.security import hash_password, verify_password, create_access_token


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, email: str, name: str, password: str) -> dict:
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValueError("El email ya está registrado")

        user = User(
            email=email,
            name=name,
            username=email.split("@")[0],
            hashed_password=hash_password(password),
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        token = create_access_token({"sub": user.id, "email": user.email})
        return {"user": user, "token": token}

    async def login(self, email: str, password: str) -> dict:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not user.hashed_password:
            raise ValueError("Credenciales inválidas")
        if not verify_password(password, user.hashed_password):
            raise ValueError("Credenciales inválidas")

        token = create_access_token({"sub": user.id, "email": user.email})
        return {"user": user, "token": token}

    async def get_by_id(self, user_id: str) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    # Legacy: keep for backward compatibility with existing opaque token
    async def get_by_token(self, token: str) -> User | None:
        result = await self.db.execute(select(User).where(User.token == token))
        return result.scalar_one_or_none()
```

- [ ] **Step 2: Verify import works**

Run: `cd backend && python -c "from app.services.user_service import UserService; print('OK')"`

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/user_service.py
git commit -m "feat(auth): update UserService with register/login and JWT"
```

---

### Task 6: Create new auth endpoints (register + login + me)

**Files:**
- Modify: `backend/app/api/auth.py`

- [ ] **Step 1: Rewrite auth.py with new endpoints**

Replace `backend/app/api/auth.py` entirely:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user
from backend.app.schemas.user import UserRegister, UserLogin, TokenResponse, UserOut
from backend.app.services.user_service import UserService
from backend.app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    svc = UserService(db)
    try:
        result = await svc.register(body.email, body.name, body.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    user: User = result["user"]
    return TokenResponse(
        access_token=result["token"],
        user=UserOut(
            id=user.id, email=user.email, name=user.name, image=user.image,
            username=user.username, puntos=user.puntos,
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    svc = UserService(db)
    try:
        result = await svc.login(body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    user: User = result["user"]
    return TokenResponse(
        access_token=result["token"],
        user=UserOut(
            id=user.id, email=user.email, name=user.name, image=user.image,
            username=user.username, puntos=user.puntos,
        ),
    )


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id, email=current_user.email, name=current_user.name,
        image=current_user.image, username=current_user.username, puntos=current_user.puntos,
    )
```

- [ ] **Step 2: Verify import works**

Run: `cd backend && python -c "from app.api.auth import router; print('OK')"`

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/auth.py
git commit -m "feat(auth): add register/login/me endpoints with JWT"
```

---

### Task 7: Update get_current_user dependency to support JWT

**Files:**
- Modify: `backend/app/core/dependencies.py`

- [ ] **Step 1: Update get_current_user to decode JWT**

Replace the `get_current_user` function in `backend/app/core/dependencies.py`:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.services.user_service import UserService

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        # Fallback: try legacy opaque token
        svc = UserService(db)
        user = await svc.get_by_token(token)
        if user:
            return user
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    svc = UserService(db)
    user = await svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    return user
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `cd backend && python -m pytest tests/ -v --tb=short 2>&1 | head -40`

- [ ] **Step 3: Commit**

```bash
git add backend/app/core/dependencies.py
git commit -m "feat(auth): update get_current_user to support JWT + legacy fallback"
```

---

### Task 8: Backend tests for auth

**Files:**
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Write auth tests**

```python
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "testauth@example.com",
        "name": "Test Auth",
        "password": "secret123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testauth@example.com"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "name": "Dup",
        "password": "secret123",
    })
    resp = await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "name": "Dup2",
        "password": "secret456",
    })
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "login@example.com",
        "name": "Login",
        "password": "secret123",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "wrong@example.com",
        "name": "Wrong",
        "password": "secret123",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "me@example.com",
        "name": "Me",
        "password": "secret123",
    })
    token = reg.json()["access_token"]
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code in (401, 403)
```

- [ ] **Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_auth.py -v`
Expected: All 6 tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_auth.py
git commit -m "test(auth): add register/login/me endpoint tests"
```

---

### Task 9: Frontend — Update API client for JWT auth

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add auth types to types/index.ts**

Append to `frontend/src/types/index.ts`:

```typescript
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  username: string;
  puntos: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}
```

- [ ] **Step 2: Update api.ts with new auth functions**

In `frontend/src/lib/api.ts`, add after the existing `loginWithProvider` function:

```typescript
export async function registerUser(email: string, name: string, password: string): Promise<TokenResponse> {
  const data = await fetchJSON<TokenResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name, password }),
  });
  setAuthToken(data.access_token);
  return data;
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  const data = await fetchJSON<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.access_token);
  return data;
}

export async function getMe(): Promise<AuthUser> {
  return fetchJSON<AuthUser>("/api/v1/auth/me");
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/types/index.ts
git commit -m "feat(auth): add JWT auth functions to API client"
```

---

### Task 10: Frontend — New login/register page

**Files:**
- Modify: `frontend/src/app/login/page.tsx`

- [ ] **Step 1: Rewrite login page with tabs for register/login**

Replace `frontend/src/app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser, registerUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await registerUser(email, name, password);
      } else {
        await loginUser(email, password);
      }
      window.dispatchEvent(new CustomEvent("auth-changed"));
      router.push("/predicciones");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al autenticar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-bg-secundario/80 border border-borde-sutil rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-texto-principal text-center mb-6 titulo-modulo">
          {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
        </h1>

        {/* Toggle */}
        <div className="flex mb-6 bg-bg-terciario rounded-lg p-1">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "login" ? "bg-apf-rojo text-white" : "text-texto-secundario hover:text-white"}`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "register" ? "bg-apf-rojo text-white" : "text-texto-secundario hover:text-white"}`}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-texto-secundario text-sm mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-principal focus:outline-none focus:border-apf-rojo transition"
              />
            </div>
          )}
          <div>
            <label className="block text-texto-secundario text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-principal focus:outline-none focus:border-apf-rojo transition"
            />
          </div>
          <div>
            <label className="block text-texto-secundario text-sm mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-principal focus:outline-none focus:border-apf-rojo transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-apf-rojo text-white font-bold hover:bg-apf-rojo-oscuro transition disabled:opacity-50"
          >
            {loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear Cuenta"}
          </button>
        </form>

        <p className="text-texto-apagado text-xs text-center mt-6">
          <Link href="/" className="text-apf-rojo hover:underline">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `cd frontend && npx next build 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/login/page.tsx
git commit -m "feat(auth): new login/register page with JWT"
```

---

### Task 11: Frontend — Profile page

**Files:**
- Create: `frontend/src/app/perfil/page.tsx`
- Modify: `frontend/src/components/layout/Navbar.tsx`

- [ ] **Step 1: Create profile page**

Create `frontend/src/app/perfil/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, setAuthToken } from "@/lib/api";
import type { AuthUser } from "@/types";
import PageHeader from "@/components/ui/PageHeader";

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    setAuthToken(null);
    window.dispatchEvent(new CustomEvent("auth-changed"));
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-texto-secundario">Cargando...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <PageHeader titulo="Mi Perfil" subtitulo="Información de tu cuenta" />
      <div className="max-w-xl mx-auto px-4 pb-12">
        <div className="bg-bg-secundario/80 border border-borde-sutil rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-bg-terciario border border-borde-marca flex items-center justify-center text-2xl font-bold text-apf-rojo">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-texto-principal">{user.name}</h2>
              <p className="text-texto-secundario text-sm">@{user.username}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-borde-sutil">
              <span className="text-texto-secundario">Email</span>
              <span className="text-texto-principal">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-borde-sutil">
              <span className="text-texto-secundario">Puntos</span>
              <span className="text-dorado-medalla font-bold">{user.puntos}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-lg border border-derrota/40 text-derrota hover:bg-derrota/10 transition text-sm font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add "Perfil" link to Navbar when logged in**

In `frontend/src/components/layout/Navbar.tsx`, add a Profile link in the `links` array or in the `navLinks` section. Find the section with the logout button and add before it:

```tsx
{token && (
  <NavLink href="/perfil" active={isActive("/perfil")} onClick={closeMenu}>
    Perfil
  </NavLink>
)}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npx next build 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/perfil/page.tsx frontend/src/components/layout/Navbar.tsx
git commit -m "feat(auth): add profile page and nav link"
```

---

### Task 12: End-to-end verification

- [ ] **Step 1: Start backend and verify endpoints**

Run: `cd backend && python -m uvicorn app.main:app --port 8000`

Test manually:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register -H "Content-Type: application/json" -d '{"email":"test@test.com","name":"Test","password":"secret123"}'
curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"secret123"}'
curl http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer <token>"
```

- [ ] **Step 2: Start frontend and test login/register flow**

Run: `cd frontend && npm run dev`

Test: Open http://localhost:3000/login → Register → Login → Check navbar shows "Perfil" → Click profile → Logout

- [ ] **Step 3: Run all backend tests**

Run: `cd backend && python -m pytest tests/ -v --tb=short`
Expected: All tests PASS

- [ ] **Step 4: Run frontend build**

Run: `cd frontend && npx next build`
Expected: Clean build, no errors

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(auth): end-to-end fixes after verification"
```
