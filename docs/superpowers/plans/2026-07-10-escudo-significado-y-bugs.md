# Significado del Escudo + Fix de Bugs Visuales — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar sección "Significado del Escudo" en cada página de detalle de club + corregir 3 bugs visuales en ClubCard y Footer.

**Architecture:** Feature consiste en (a) archivo de datos `src/data/escudos.ts` con texto e imagen por club, (b) copia de PNGs a `public/img/`, (c) nueva sección dentro del detalle del club. Bugs se corrigen en CSS y JSX de componentes existentes.

**Tech Stack:** Next.js 16, Tailwind CSS, TypeScript, React Query

## Global Constraints

- No modificar lógica de backend ni API calls
- Código en inglés, comentarios y commits en español
- PNGs locales se copian a `public/img/` para servir estáticos
- Diseño oscuro consistente con design system actual (paleta APF)

---

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

### Task 4: Copiar PNGs de footylogos a public/img/

**Files:**
- Create: `frontend/public/img/` (carpeta)
- Copy: `C:\Users\astur\Desktop\liga.paraguaya.futbol\img\*.png` → `frontend/public/img/`

- [ ] **Step 1: Copiar imágenes**

```bash
Copy-Item "C:\Users\astur\Desktop\liga.paraguaya.futbol\img\*.png" -Destination "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend\public\img\"
```

- [ ] **Step 2: Verificar**

```bash
Get-ChildItem "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend\public\img\"
```

- [ ] **Step 3: Commit**

```bash
git add frontend/public/img/
git commit -m "feat: agregar PNGs de escudos footylogos para sección Significado del Escudo"
```

---

### Task 5: Crear archivo de datos de escudos

**Files:**
- Create: `frontend/src/data/escudos.ts`

- [ ] **Step 1: Crear el archivo con el mapping completo**

```typescript
interface EscudoInfo {
  imagen: string;
  texto: string;
  detalles?: string[];
}

export const ESCUDOS_DATA: Record<string, EscudoInfo> = {
  "Cerro Porteño": {
    imagen: "/img/cerro-porteno-logo-footylogos.png",
    texto: "La insignia de Cerro Porteño es un escudo rojo y azul construido alrededor de franjas verticales y un monograma circular blanco central con las iniciales «CCP». El rojo y el azul simbolizan la unidad entre los paraguayos en una época de división política entre las facciones coloradas y liberales. El nombre Cerro Porteño se refiere al Cerro Mbaé, relacionado con una batalla de 1811 entre fuerzas paraguayas y tropas de Buenos Aires.",
    detalles: ["Apodos: El Ciclón, El Azulgrana, El Club del Pueblo", "Fundado: 1 de octubre de 1912", "Colores: rojo y azul"],
  },
  "Libertad": {
    imagen: "/img/club-libertad-logo-footylogos.png",
    texto: "La insignia del Club Libertad es un emblema blanco y negro con un sello circular central y alas horizontales. El nombre fue elegido en el ambiente político y social del Paraguay posterior a la revolución de 1904, cuando las ideas de «libertad», «democracia» e «igualdad» estaban ampliamente presentes. Su rivalidad con Olimpia se conoce como el «Clásico Blanco y Negro».",
    detalles: ["Apodo: El Gumarelo", "Fundado: 30 de julio de 1905", "Colores: blanco y negro"],
  },
  "Olimpia": {
    imagen: "/img/olimpia-logo-footylogos.png",
    texto: "La insignia del Club Olimpia es un emblema en blanco y negro con una forma exterior festoneada y una «O» central. Fundado el 25 de julio de 1902 por un grupo liderado por William Paats, educador holandés vinculado al desarrollo temprano del fútbol en Paraguay. El nombre «Olimpia» fue inspirado en la antigua tradición deportiva de los Juegos Olímpicos. Es el club de fútbol más antiguo de Paraguay, conocido como El Decano.",
    detalles: ["Apodo: El Decano, El Rey de Copas", "Fundado: 25 de julio de 1902", "Colores: blanco y negro"],
  },
  "Guaraní": {
    imagen: "/img/guarani-paraguay-logo-footylogos.png",
    texto: "La insignia del Club Guaraní es un escudo negro y amarillo con franjas verticales anchas y un perfil indígena dentro de un medallón circular. El nombre proviene del pueblo guaraní, parte esencial de la cultura e historia paraguayas, lo que explica sus apodos «El Aborigen» y «El Legendario». Es uno de los clubes fundadores de la liga paraguaya.",
    detalles: ["Apodos: El Aborigen, El Legendario", "Fundado: 12 de octubre de 1903", "Colores: negro y amarillo"],
  },
  "Nacional": {
    imagen: "/img/nacional-paraguay-logo-footylogos.png",
    texto: "La insignia del Club Nacional es un escudo con bordes negros dividido por una banda diagonal blanca, con rojo arriba y azul abajo. Las iniciales «CN» cruzan la banda blanca. Fundado por estudiantes del Colegio Nacional de la Capital, sus colores rojo, blanco y azul representan los colores nacionales de Paraguay, de ahí el apodo «El Tricolor». También es conocido como «La Academia».",
    detalles: ["Apodos: El Tricolor, La Academia", "Fundado: 5 de junio de 1904", "Colores: rojo, blanco y azul"],
  },
  "Sportivo Luqueño": {
    imagen: "/img/sportivo-luqueno-logo-footylogos.png",
    texto: "El escudo del Sportivo Luqueño es azul y amarillo con tres estrellas sobre el escudo y un monograma circular. El club se fundó en 1921 en Luque mediante la fusión de tres equipos locales: Marte Atlético, General Aquino y Vencedor. Las tres estrellas representan a esos tres clubes fundadores. Es conocido como «El Kure Luque» y «Auriazul».",
    detalles: ["Apodos: El Kure Luque, Auriazul", "Fundado: 1921", "Colores: azul y amarillo"],
  },
  "Sportivo Trinidense": {
    imagen: "/img/sportivo-trinidense-logo-footylogos.png",
    texto: "El emblema del Sportivo Trinidense es un diseño circular en azul y amarillo con un monograma entrelazado blanco y estrellas doradas. Fundado el 11 de agosto de 1935 en el barrio Santísima Trinidad de Asunción. El nombre «Trinidense» hace referencia directa a ese distrito local, vinculando la identidad del club con sus raíces vecinales.",
    detalles: ["Fundado: 11 de agosto de 1935", "Colores: azul y amarillo"],
  },
  "General Caballero JLM": {
    imagen: "/img/general-caballero-jlm-logo-footylogos.png",
    texto: "La insignia del General Caballero JLM es un escudo rojo con franjas verticales blancas y una placa central con el nombre. Fundado el 21 de junio de 1962 en Juan León Mallorquín, Alto Paraná. Honra a Bernardino Caballero, figura militar y expresidente paraguayo. La etiqueta «JLM» se usa para distinguirlo de otros clubes paraguayos llamados General Caballero.",
    detalles: ["Fundado: 21 de junio de 1962", "Ubicación: Juan León Mallorquín, Alto Paraná", "Colores: rojo y blanco"],
  },
  "Club Sportivo 2 de Mayo": {
    imagen: "/img/club-sportivo-2-de-mayo-logo-footylogos.png",
    texto: "La insignia del Club Sportivo 2 de Mayo es azul y blanca con franjas verticales y un «2» blanco estilizado. El nombre proviene del Regimiento de Infantería 2 de Mayo. Fundado el 6 de diciembre de 1935 por veteranos que regresaban de la Guerra del Chaco, como homenaje al regimiento en el que sirvieron. Tiene sede en Pedro Juan Caballero y es apodado «El Gallo Norteño».",
    detalles: ["Apodo: El Gallo Norteño", "Fundado: 6 de diciembre de 1935", "Ubicación: Pedro Juan Caballero, Amambay"],
  },
  "Club Atlético Tembetary": {
    imagen: "/img/club-atletico-tembetary-logo-footylogos.png",
    texto: "La insignia del Club Atlético Tembetary es un escudo con franjas verticales rojas y verdes y un monograma circular blanco. Fundado el 3 de agosto de 1912 en Asunción como Bermejo Football Club, adoptó su nombre actual en 1920, tomado de la zona de Tembetary de la capital paraguaya.",
    detalles: ["Fundado: 3 de agosto de 1912 (como Bermejo FC)", "Ubicación: Barrio Tembetary, Asunción", "Colores: rojo y verde"],
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/data/escudos.ts
git commit -m "feat: crear archivo de datos de escudos con significado e imágenes"
```

---

### Task 6: Agregar sección "Significado del Escudo" en club detail page

**Files:**
- Modify: `frontend/src/app/clubes/[id]/page.tsx`

- [ ] **Step 1: Agregar import del data file**

Agregar después de los imports existentes:

```typescript
import { ESCUDOS_DATA } from "@/data/escudos";
```

- [ ] **Step 2: Agregar la sección en el JSX**

Antes del bloque de títulos internacionales (antes de `{club.titulos_internacionales?.length > 0`), insertar:

```tsx
{ESCUDOS_DATA[club.nombre] && (
  <div className="mt-6 p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60 relative overflow-hidden">
    <div
      className="absolute inset-0 opacity-[0.07] bg-contain bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${ESCUDOS_DATA[club.nombre].imagen})` }}
    />
    <div className="relative z-10">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-apf-rojo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Significado del Escudo
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed">
        {ESCUDOS_DATA[club.nombre].texto}
      </p>
      {ESCUDOS_DATA[club.nombre].detalles && (
        <div className="flex flex-wrap gap-2 mt-4">
          {ESCUDOS_DATA[club.nombre].detalles!.map((d, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs border border-borde-sutil text-texto-secundario bg-bg-terciario/50">
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Build para verificar**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/clubes/[id]/page.tsx
git commit -m "feat: agregar sección Significado del Escudo en detalle de cada club"
```

---

### Task 7: Self-review y verificación final

- [ ] **Step 1: Build completo**

```bash
cd frontend && npm run build
```

- [ ] **Step 2: Verificar en servidor de desarrollo**

```bash
cd frontend && npm run dev
```

Verificar navegando a `/clubes/[id]` para clubes con y sin entrada en ESCUDOS_DATA.

- [ ] **Step 3: Push final**

```bash
git add -A && git status
```
