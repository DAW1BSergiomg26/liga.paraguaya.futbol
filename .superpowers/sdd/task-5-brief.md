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

