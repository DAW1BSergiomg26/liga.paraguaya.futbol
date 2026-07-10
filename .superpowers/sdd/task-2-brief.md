### Task 2: Bugfix — Footer roto

**Files:**
- Modify: `frontend/src/components/layout/Footer.tsx`
- Modify: `frontend/src/app/layout.tsx` (si es necesario)

**Bug:** El footer se ve descuadrado, texto solapado y línea horizontal cortando el contenido.

**Análisis:** El footer usa `borderTop: "2px solid"` + `borderImage` con gradiente. `borderImage` anula el borde normal, causando renderizado inconsistente. Además, la línea de gradiente puede renderizarse mal en algunos browsers porque `borderImage` y `borderTop` juntos son conflictivos.

- [ ] **Step 1: Corregir Footer.tsx**

Reemplazar el `style` inline problemático con un `::after` pseudo-elemento usando Tailwind:

```tsx
export default function Footer() {
  return (
    <footer className="navbar-blur mt-auto">
      <div className="relative max-w-6xl mx-auto px-4 py-6 text-center text-sm text-texto-apagado">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-apf-rojo via-white to-apf-azul" />
        <p>liga.paraguaya.futbol — Proyecto de datos y seguimiento del fútbol paraguayo</p>
        <p className="mt-1">
          <a href="https://github.com/usuario/liga.paraguaya.futbol" className="hover:text-texto-secundario transition" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Build para verificar**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/Footer.tsx
git commit -m "fix: reemplazar borderImage conflictiva por gradiente con pseudo-elemento en footer"
```

---

