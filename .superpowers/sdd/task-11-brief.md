### Task 11: Frontend — UI Components + Query Provider

**Files:**
- Create: `frontend/src/components/ui/LoadingSpinner.tsx`
- Create: `frontend/src/components/ui/ErrorMessage.tsx`
- Create: `frontend/src/app/providers.tsx`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/LoadingSpinner.tsx`**

```tsx
export default function LoadingSpinner({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#76e4f7] border-t-transparent" />
      <span className="ml-3 text-gray-400">{text}</span>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/ui/ErrorMessage.tsx`**

```tsx
export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-red-400 text-lg">{message}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/app/providers.tsx`**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Update `frontend/src/app/layout.tsx` to wrap with Providers**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "./providers";

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
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Create loading, error, and not-found pages**

`frontend/src/app/loading.tsx`:
```tsx
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return <LoadingSpinner />;
}
```

`frontend/src/app/error.tsx`:
```tsx
"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-24">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Algo salió mal</h2>
      <p className="text-gray-400 mb-6">{error.message}</p>
      <button onClick={reset} className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
        Intentar de nuevo
      </button>
    </div>
  );
}
```

`frontend/src/app/not-found.tsx`:
```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <h2 className="text-6xl font-bold text-gray-600 mb-4">404</h2>
      <p className="text-xl text-gray-400 mb-6">Página no encontrada</p>
      <Link href="/" className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition inline-block">
        Volver al inicio
      </Link>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(frontend): UI components and query provider"
```

---


