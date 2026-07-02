from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import async_session


async def get_db() -> AsyncIterator[AsyncSession]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
