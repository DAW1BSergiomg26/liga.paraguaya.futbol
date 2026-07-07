import re
import secrets
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User
from backend.app.schemas.user import UserLogin, UserOut


class UserService:

    @staticmethod
    def _generate_username(email: str) -> str:
        base = email.split("@")[0].lower()
        base = re.sub(r"[^a-z0-9]", "", base)[:20]
        return f"{base}_{secrets.token_hex(3)}"

    @staticmethod
    async def upsert(db: AsyncSession, data: UserLogin) -> UserOut:
        result = await db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()
        if user:
            user.name = data.name
            user.image = data.image
            user.generate_token()
        else:
            user_id = f"{data.provider}_{data.provider_id or data.email.split('@')[0]}"
            user = User(
                id=user_id,
                email=data.email,
                name=data.name,
                image=data.image,
                username=UserService._generate_username(data.email),
                provider=data.provider,
                provider_id=data.provider_id,
            )
            user.generate_token()
            db.add(user)
        await db.flush()
        return UserOut.model_validate(user)

    @staticmethod
    async def get_by_token(db: AsyncSession, token: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.token == token))
        return result.scalar_one_or_none()
