# Task 9: Integrate Chat + Push into Partido Page

## Files to Modify
- `frontend/src/lib/api.ts` — add `getChatHistory` function and `MensajeChat` interface
- `frontend/src/app/partidos/[id]/page.tsx` — add ChatWidget below the prediction section

## Exact Changes

### frontend/src/lib/api.ts
Add at the end of the file:
```typescript
export async function getChatHistory(partidoId: string, limit = 50, offset = 0): Promise<MensajeChat[]> {
  const res = await fetch(
    `${API_URL}/api/v1/partidos/${partidoId}/chat?limit=${limit}&offset=${offset}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
}

export interface MensajeChat {
  id: string;
  partido_id: string;
  user_id: string;
  username: string;
  nombre: string;
  imagen: string;
  mensaje: string;
  created_at: string;
}
```

### frontend/src/app/partidos/[id]/page.tsx
Read the existing file first. Then:
1. Add import at top:
```tsx
import ChatWidget from "@/components/ChatWidget";
```
2. Inside the return, after the prediction section (after the prediction-related JSX), add:
```tsx
{partido && <ChatWidget partidoId={partido.id} />}
```

## Global Constraints
- Follow existing patterns in both files
- `ChatWidget` already exists from Task 7
- TypeScript must compile after changes

## Commit
```bash
git add frontend/src/lib/api.ts frontend/src/app/partidos/[id]/page.tsx
git commit -m "feat: integrate chat widget into partido detail page"
```

## Report File
`.superpowers/sdd/task-9-report.md`
