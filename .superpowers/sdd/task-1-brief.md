# Task 1: Backend Models (MensajeChat + PushSubscription)

## Files to Create
- `backend/app/models/mensaje_chat.py`
- `backend/app/models/push_subscription.py`

## Exact Code

### backend/app/models/mensaje_chat.py
```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.app.core.database import Base


class MensajeChat(Base):
    __tablename__ = "mensajes_chat"

    id = Column(String, primary_key=True)
    partido_id = Column(String, ForeignKey("partidos.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    mensaje = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    partido = relationship("Partido", lazy="selectin")
    user = relationship("User", lazy="selectin")
```

### backend/app/models/push_subscription.py
```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text

from backend.app.core.database import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    endpoint = Column(Text, nullable=False)
    p256dh = Column(String, nullable=False)
    auth = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
```

## Global Constraints
- All new models use `id TEXT PRIMARY KEY` with `f"msg_{uuid.uuid4().hex[:12]}"` pattern (matching existing codebase)
- Backend tests use SQLite in-memory (`sqlite+aiosqlite://`)
- Follow existing model patterns in `backend/app/models/`

## Verification
- `python -m pytest backend/tests/ -v` should still pass (18 existing tests)
- Models should import without errors

## Commit
```bash
git add backend/app/models/mensaje_chat.py backend/app/models/push_subscription.py
git commit -m "feat: add MensajeChat and PushSubscription models"
```

## Report File
`.superpowers/sdd/task-1-report.md` — write status (DONE/DONE_WITH_CONCERNS), commits, test summary, any concerns.
