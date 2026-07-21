import asyncio
from datetime import datetime
from sqlalchemy.future import select
from app.core.database import AsyncSession, engine
from app.models.user import User
from app.core.security import hash_password
from sqlalchemy.ext.asyncio import AsyncSession as SessionClass

async def seed_admin():
    async with SessionClass(engine) as db:
        email = "menu2informatico@gmail.com"
        
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if user:
            print("El usuario administrador ya existe.")
            return

        admin_user = User(
            id="fbeb2a60-2d6d-4169-adca-b487c87f13c9",
            email=email,
            name="Danny",
            username="menu2informatico",
            hashed_password=hash_password("admin123"),
            is_admin=True,
            puntos=0,
            created_at=datetime.utcnow()
        )
        db.add(admin_user)
        await db.commit()
        print("Administrador creado exitosamente.")

if __name__ == "__main__":
    asyncio.run(seed_admin())