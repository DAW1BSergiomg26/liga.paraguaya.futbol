"""
Seed script: crear o promover usuario administrador.

Uso:
    python -m backend.app.scripts.seed_admin

Idempotente: si el usuario ya existe, actualiza is_admin y hashed_password.
"""
import asyncio
import uuid

from sqlalchemy import select

from backend.app.core.database import async_session, init_db
from backend.app.core.security import hash_password, verify_password
from backend.app.models.user import User

ADMIN_EMAIL = "menu2informatico@gmail.com"
ADMIN_NAME = "Danny"
ADMIN_PASSWORD = "Rufi14"


async def seed_admin():
    await init_db()

    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.email == ADMIN_EMAIL)
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.is_admin = True
            existing.hashed_password = hash_password(ADMIN_PASSWORD)
            existing.name = ADMIN_NAME
            await db.commit()
            print(f"  Usuario existente actualizado: {ADMIN_EMAIL} (is_admin=True)")
            user = existing
        else:
            user = User(
                id=str(uuid.uuid4()),
                email=ADMIN_EMAIL,
                name=ADMIN_NAME,
                username=ADMIN_EMAIL.split("@")[0],
                hashed_password=hash_password(ADMIN_PASSWORD),
                is_admin=True,
                provider="local",
                provider_id="",
                puntos=0,
            )
            db.add(user)
            await db.commit()
            print(f"  Usuario admin creado: {ADMIN_EMAIL} (id={user.id})")

        # Verificar login
        assert verify_password(ADMIN_PASSWORD, user.hashed_password), \
            "Error: la verificación de password falló después de hashear"
        print(f"  Verificación de password: OK")
        print(f"  is_admin: {user.is_admin}")
        print(f"  username: {user.username}")
        print()
        print("  Credenciales de login:")
        print(f"    Email:    {ADMIN_EMAIL}")
        print(f"    Password: {ADMIN_PASSWORD}")
        print()
        print("  Endpoint de login: POST /api/v1/auth/login")


if __name__ == "__main__":
    asyncio.run(seed_admin())
