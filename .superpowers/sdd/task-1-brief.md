### Task 1: Bugfix — Texto en espejo en flip cards

**Files:**
- Modify: `frontend/src/app/globals.css:136-180`
- Verify: `frontend/src/components/ui/ClubCard.tsx`

**Bug:** El texto "Datos del club" aparece horizontalmente invertido. Causa: `.carta-club-dorso { transform: rotateY(180deg) }` combinado con `backface-visibility` que no funciona correctamente en WebKit.

**Análisis concreto:** La cara frontal (`.carta-club-cara`) no tiene `transform`. El dorso (`.carta-club-dorso`) tiene `transform: rotateY(180deg)` para compensar el giro del contenedor `.carta-club-inner`. Si `backface-visibility: hidden` falla en algún browser, ambas caras son visibles: la frontal normal + el dorso rotado 180° (texto en espejo). La solución: no depender de `rotateY(180deg)` en el dorso, sino usar una técnica más robusta.

- [ ] **Step 1: Reemplazar la técnica de flip en globals.css**

Cambiar de `rotateY(180deg)` a usar `scaleX(-1)` para el backface y `scaleX(-1)` para compensar, que es más compatible cross-browser:

```css
/* === 3D FLIP CARD — Fichas de clubes === */

.carta-club {
  -webkit-perspective: 1000px;
  perspective: 1000px;
  height: 320px;
  width: 100%;
  max-width: 380px;
  outline: none;
}

.carta-club-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  -webkit-transform-style: preserve-3d;
  transform-style: preserve-3d;
}

.carta-club:hover .carta-club-inner,
.carta-club:focus-visible .carta-club-inner {
  transform: rotateY(180deg);
}

.carta-club-cara {
  position: absolute;
  inset: 0;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 14px;
  background: var(--color-bg-carta);
  border: 1px solid var(--color-borde-sutil);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.carta-club-dorso {
  transform: rotateY(180deg);
  justify-content: flex-start;
  text-align: left;
  overflow-y: auto;
}
```

El `rotateY(180deg)` en el dorso y en el hover del inner es la técnica estándar. Para reforzar, se agrega un wrapper de texto con `-webkit-transform: translateZ(0)` para forzar aceleración GPU:

Agregar después de `.carta-club-dorso { ... }`:

```css
.carta-club-dorso > * {
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}
```

Esto fuerza la composición por GPU en Safari/WebKit, eliminando el mirroring.

- [ ] **Step 2: Verificar ClubCard.tsx**

Confirmar que `ClubCard.tsx` no tiene ningún `style` inline en el dorso que esté aplicando transform incorrecto.

Leer el archivo y asegurarse de que no hay `scaleX` ni `scale(-1,1)` en ningún JSX.

- [ ] **Step 3: Build para verificar**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/globals.css
git commit -m "fix: agregar translateZ(0) en dorso de flip card para evitar texto en espejo en WebKit"
```

---

