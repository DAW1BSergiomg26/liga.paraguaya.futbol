### Task 8: Frontend — Scaffold Next.js + TypeScript + Tailwind

**Files:**
- Create: `frontend/` (new Next.js project replacing old React app)

- [ ] **Step 1: Remove old frontend and create new Next.js project**

```powershell
# Backup the old frontend vite.config proxy change if needed
Remove-Item -Recurse -Force frontend -ErrorAction SilentlyContinue

npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

When prompted, say "Yes" to all defaults.

- [ ] **Step 2: Install additional dependencies**

```powershell
cd frontend
npm install @tanstack/react-query@5
```

- [ ] **Step 3: Configure Next.js to allow backend API images (if needed later)**

No changes needed for now. Next.js default config is fine.

- [ ] **Step 4: Update `frontend/src/app/layout.tsx`**

Read the generated file first, then replace content:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Liga Paraguaya de Fútbol",
  description: "Clubes, partidos, tabla de posiciones y datos base del fútbol paraguayo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#07111f] text-[#f8fafc] min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Add favicon** — replace `frontend/public/` with a simple SVG shield or keep default

```powershell
# Create a simple SVG favicon
New-Item -ItemType Directory -Path "frontend/public/images" -Force
```

Create `frontend/public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚽</text></svg>
```

- [ ] **Step 6: Verify dev server starts**

```powershell
cd frontend && npm run dev
```

Open `http://localhost:3000` — should see the default Next.js page with "Liga Paraguaya de Fútbol" title.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(frontend): scaffold Next.js project"
```

---


