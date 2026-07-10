### Task 3: Bugfix — Tarjetas de clubes desalineadas

**Files:**
- Modify: `frontend/src/app/clubes/page.tsx`
- Verify: `frontend/src/app/globals.css`

**Bug:** La información dentro de cada tarjeta (nombre, apodo, colores, ciudad) no está centrada ni alineada consistentemente entre tarjetas.

**Análisis:** El grid en `page.tsx` usa `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`. Las tarjetas tienen `height: 320px` fijo pero pueden tener contenido de distinto tamaño. Además, ya se mejoró el layout con `justify-items-center` y `w-full` + `max-width: 380px` en tarea previa.

- [ ] **Step 1: Verificar estado actual de clubes/page.tsx**

Leer el archivo y confirmar que tiene `justify-items-center` y que cada `ClubCard` recibe el width completo de la celda del grid.

- [ ] **Step 2: Verificar layout de la página de listado**

Asegurarse de que la página tiene estructura:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 justify-items-center">
  {filtrados.map((club) => (
    <ClubCard key={club.id} club={club} />
  ))}
</div>
```

- [ ] **Step 3: Build para verificar**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/clubes/page.tsx frontend/src/app/globals.css
git commit -m "fix: centrar grid de tarjetas de clubes con justify-items-center"
```

---

