import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user import User
from ..core.security import hash_password, verify_password, create_access_token


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, email: str, name: str, password: str) -> dict:
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValueError("El email ya estÃ¡ registrado")

        # Check if this is the first user (becomes admin)
        count_result = await self.db.execute(select(User))
        is_first = len(count_result.scalars().all()) == 0

        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name=name,
            username=email.split("@")[0],
            hashed_password=hash_password(password),
            is_admin=is_first,
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
            raise ValueError("Credenciales invÃ¡lidas")
        if not verify_password(password, user.hashed_password):
            raise ValueError("Credenciales invÃ¡lidas")

        token = create_access_token({"sub": user.id, "email": user.email})
        return {"user": user, "token": token}

    async def get_by_id(self, user_id: str) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_token(self, token: str) -> User | None:
        result = await self.db.execute(select(User).where(User.token == token))
        return result.scalar_one_or_none()
