# Crowd Conquest: Gate Rush

Runner 2D de guerra antigua donde tu ejército **es** un número.

Este repositorio contiene dos cosas: el juego (en `count-masters/`) y la landing page
que lo presenta (en `index.html`). Todo se publica automáticamente en GitHub Pages.

- **Jugar:** <https://2026b-sof-jueg-gr1.github.io/tipan-jonathan-jueg-gr3/count-masters/>
- **Landing:** <https://2026b-sof-jueg-gr1.github.io/tipan-jonathan-jueg-gr3/>

---

## Estructura

```text
.
├── index.html                  # Landing page (se publica en la raíz del sitio)
├── .github/workflows/deploy.yml# CI/CD: compila, prueba, publica y sube a itch.io
└── count-masters/              # El juego (Phaser 4 + Vite)
    ├── src/
    ├── tests/
    └── dist/                   # Generado por `npm run build` (no se commitea)
```

## Desarrollo local

```bash
cd count-masters
npm install
npm run dev      # http://localhost:5173
npm test         # 59 pruebas
npm run build    # genera dist/
```

## Cómo se publica

Ya no se despliega a mano. Cada `push` a `main` dispara el workflow
`.github/workflows/deploy.yml`, que:

1. instala dependencias,
2. **ejecuta las pruebas** (si una falla, no se publica),
3. compila el juego,
4. ensambla `sitio/` = `index.html` + `count-masters/dist/`,
5. publica esa carpeta en la rama `gh-pages`,
6. sube el mismo build a itch.io con Butler (si está configurado).

> En GitHub: **Settings → Pages → Branch: `gh-pages` / (root)**.

---

## Configurar la publicación en itch.io

### 1. Cuenta y página del juego

1. Crea la cuenta del estudio en <https://itch.io/register>.
2. Ve a **Dashboard → Create new project**.
3. Rellena el proyecto con estos datos:

| Campo | Valor |
| --- | --- |
| Title | `Crowd Conquest: Gate Rush` |
| Project URL | `crowd-conquest-gate-rush` |
| Classification | `Game` |
| Kind of project | `HTML` |
| Pricing | `No payments` |
| Embed | `Click to launch in fullscreen`, 720 × 1280 |

4. En **Genre** elige `Action`; en **Tags** añade: `runner`, `math`, `ancient`,
   `crowd`, `phaser`, `html5`.
5. Guarda con **Save & view page**. La página queda en blanco hasta el primer
   envío: eso lo llena el pipeline.

### 2. API key de Butler

1. Ve a <https://itch.io/user/settings/api-keys>.
2. **Generate new API key** y copia el valor.

### 3. Secretos y variables en GitHub

En **Settings → Secrets and variables → Actions**:

- **Secret** `BUTLER_API_KEY` → la clave que acabas de generar.
- **Variable** `ITCH_USER` → tu usuario de itch.io.
- **Variable** `ITCH_GAME` → el slug del proyecto (`crowd-conquest-gate-rush`).

En cuanto existan, el siguiente push publica también en itch.io. Si el secret no
existe, el pipeline **no falla**: simplemente omite ese paso.

### 4. Subir la primera vez a mano (opcional)

Si prefieres no esperar al pipeline:

```bash
cd count-masters
npm run build
# instala butler desde https://itch.io/docs/butler/installing.html
butler push dist TU_USUARIO/crowd-conquest-gate-rush:html5 --userversion 1.0.0
```

---

## Texto para la ficha de itch.io

> **En un reino donde cada persona es una cifra, un rey que solo sabe restar borra
> a su pueblo para engordar su ejército. Tú no tienes trono ni armas: tienes la
> única operación que él prohibió.**
>
> Crowd Conquest: Gate Rush es un runner de multitudes donde tu ejército es
> literalmente un número. Cada línea de puertas te obliga a elegir entre sumar
> refuerzos o multiplicar tu total, y la decisión se ve al instante: la multitud
> crece o desaparece delante de ti.
>
> - Tres desfiladeros con dificultad propia.
> - Puertas de suma, resta y multiplicación bajo presión.
> - Combate determinista: gana quien tenga más gente.
> - Cada reino que vences aporta su color y su silueta a tu ejército.
> - Arte y sonido 100 % generados por código: cero assets externos.
>
> Hecho con Phaser 4, Vite y JavaScript. Proyecto académico de la Escuela
> Politécnica Nacional.

---

## Créditos y licencias

Todo el arte y el sonido se generan en tiempo de ejecución. No se distribuye
ninguna imagen ni audio de terceros.

- **Phaser 4.2.1** — MIT
- **Vite 8** — MIT
- **Web Audio API** — tonos sintetizados en el navegador
- **Tipografías del sistema** — ninguna fuente se descarga de la red

Proyecto original e independiente. No está afiliado a *Count Masters* ni a sus
autores. La inspiración histórica proviene de fuentes antiguas de dominio
público (Heródoto, Arriano, Plutarco), no de obras audiovisuales contemporáneas.
