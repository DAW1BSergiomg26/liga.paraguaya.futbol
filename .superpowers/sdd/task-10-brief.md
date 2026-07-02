### Task 10: Frontend — Layout Components (Navbar + Footer)

**Files:**
- Create: `frontend/src/components/layout/Navbar.tsx`
- Create: `frontend/src/components/layout/Footer.tsx`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Create `frontend/src/components/layout/Navbar.tsx`**

```tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          ⚽ Liga PY
        </Link>
        <div className="flex gap-6 text-sm font-medium text-gray-300">
          <Link href="/clubes" className="hover:text-white transition">Clubes</Link>
          <Link href="/partidos" className="hover:text-white transition">Partidos</Link>
          <Link href="/tabla" className="hover:text-white transition">Tabla</Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/layout/Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a1628]/60 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
        <p>liga.paraguaya.futbol — Proyecto de datos y seguimiento del fútbol paraguayo</p>
        <p className="mt-1">
          <a href="https://github.com/usuario/liga.paraguaya.futbol" className="hover:text-gray-300 transition" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update `frontend/src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
      <body className={`${inter.className} bg-[#07111f] text-[#f8fafc] min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Update `frontend/src/app/globals.css` — replace with clean styles**

```css
@import "tailwindcss";

body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(frontend): layout components (Navbar, Footer)"
```

---


