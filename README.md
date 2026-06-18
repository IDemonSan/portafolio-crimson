# 🎨 Portafolio Crimson & Ember

**Una plantilla de portafolio profesional para desarrolladores.**  
Tema oscuro/claro con paleta rojo carmesí + ámbar. CMS basado en JSON con panel admin y auto-commit a GitHub.

Construido con **Next.js 16**, **Tailwind CSS v4** y **Framer Motion**.

---

## ✨ Características

| Característica | Descripción |
|---|---|
| 🌙☀️ **Tema oscuro/claro** | Paleta única "Crimson & Ember" — sin azul genérico |
| 📝 **CMS basado en JSON** | Edita `src/data/*.json` y los cambios se reflejan al hacer deploy |
| 🛠️ **Panel Admin** | `/admin` — formularios para gestionar todo el contenido |
| 🔄 **Auto-commit a GitHub** | Los cambios en admin se suben automáticamente al repo (vía OAuth o token) |
| 🌐 **i18n** | Español e Inglés integrados con toggle en el header |
| 📱 **Responsive** | Diseño adaptativo con menú mobile |
| ⚡ **Animaciones** | Transiciones suaves con Framer Motion |
| 🖼️ **Iconos inline SVG** | Sin dependencias pesadas — SVGs optimizados a mano |

---

## 🚀 Cómo usar esta plantilla (para tu portafolio)

### 1. Fork o clona el repositorio

```bash
# Opción A: Clonar directamente
git clone https://github.com/tu-usuario/portafolio-crimson.git
cd portafolio-crimson

# Opción B: Usar como template (click en "Use this template" en GitHub)
```

### 2. Instala dependencias

```bash
npm install
```

### 3. Configura variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` y cambia al menos:
```
ADMIN_SECRET=una-contraseña-segura-aleatoria
```

### 4. Inicia el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 5. Personaliza el contenido

Edita los archivos en `src/data/`:
- `profile.json` — Tu información personal
- `projects.json` — Tus proyectos
- `experience.json` — Tu experiencia laboral
- `tech-stack.json` — Tu stack tecnológico

O usa el panel admin en [http://localhost:3000/admin](http://localhost:3000/admin).

### 6. Despliega en producción

La forma más sencilla es **Vercel** (plataforma de los creadores de Next.js):

```bash
# 1. Sube tu repositorio a GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main

# 2. Ve a vercel.com e importa el repositorio
# 3. Configura las variables de entorno en Vercel (ver sección abajo)
# 4. ¡Deploy automático en cada push a main! 🚀
```

**Variables de entorno requeridas en Vercel:**

| Variable | ¿Obligatoria? | ¿Para qué? |
|---|---|---|
| `ADMIN_SECRET` | ✅ **Siempre** | Contraseña del panel `/admin` — sin esto no puedes ni iniciar sesión |
| `GITHUB_CLIENT_ID` | ⚠️ Con OAuth | Client ID de tu GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | ⚠️ Con OAuth | Client Secret de tu GitHub OAuth App |
| `GITHUB_TOKEN` | ⚠️ Con PAT | Personal Access Token clásico con scope `repo` |
| `GITHUB_OWNER` | ✅ **Con auto-commit** | Tu usuario de GitHub (ej: `IDemonSan`) |
| `GITHUB_REPO` | ✅ **Con auto-commit** | Nombre del repositorio (ej: `mi-portafolio`) |
| `GITHUB_BRANCH` | ⚠️ Recomendada | Rama del repo (default: `main`). **Si tu repo usa `master`, debes configurarlo** |

> **Resumen:** Para que el auto-commit funcione, necesitas SIEMPRE `GITHUB_OWNER` y `GITHUB_REPO`. Luego escoges: OAuth (`GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET`) o PAT (`GITHUB_TOKEN`). `GITHUB_BRANCH` es necesaria si tu rama no se llama `main`.

---

## 🔐 Seguridad: Cómo funciona el Panel Admin

### Autenticación

El panel admin está protegido por una **contraseña maestra** (`ADMIN_SECRET`).  
No hay registro de usuarios, base de datos ni sesiones persistentes — es intencionalmente simple:

1. Ingresas la contraseña en `/admin/login`
2. Se envía como `Bearer Token` en el header `Authorization`
3. El backend verifica contra `ADMIN_SECRET`
4. Si es correcto, se guarda en `sessionStorage` del navegador (se borra al cerrar la pestaña)

> ⚠️ **No uses una contraseña débil ni compartida.** Genera una contraseña larga con un gestor de contraseñas.

### Escritura de datos

- **En desarrollo (localhost):** Los archivos JSON se escriben directamente en `src/data/`
- **En producción (Vercel):** Los archivos no se pueden escribir en el filesystem (es read-only)

#### ¿Cómo funciona en producción entonces?

Hay dos mecanismos:

---

## 🔄 Auto-commit a GitHub (producción)

Cuando guardas cambios desde el admin en producción, el backend intenta hacer commit y push automáticos al repositorio de GitHub usando **la API de GitHub**.

### Opción 1: OAuth de GitHub + env vars (recomendada)

Usa el botón **"Conectar GitHub"** en el panel admin para autenticarte con tu cuenta.  
El token se almacena en una cookie httpOnly y funciona por 7 días.

**Variables necesarias (las 4):**

| Variable | Valor ejemplo |
|---|---|
| `GITHUB_CLIENT_ID` | `Iv1.xxxxxxxxxxxx` (de tu OAuth App) |
| `GITHUB_CLIENT_SECRET` | `xxxxxxxxxxxxxxxx` (de tu OAuth App) |
| `GITHUB_OWNER` | `IDemonSan` (tu usuario de GitHub) |
| `GITHUB_REPO` | `mi-portafolio` (nombre del repo) |
| `GITHUB_BRANCH` | `master` (solo si tu rama no es `main`) |

**Para crear la OAuth App:**

1. [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) → **New OAuth App**
2. **Homepage URL:** `https://tu-dominio.com`
3. **Authorization callback URL:** `https://tu-dominio.com/api/admin/github/callback`
4. Copia el **Client ID** y genera un **Client Secret**

Luego en el admin:
1. Haz clic en **"Conectar GitHub"** → autoriza la app
2. Verás tu nombre de usuario en el header ✅
3. ¡Listo! Al guardar, el commit se hace automáticamente

> ⚠️ **IMPORTANTE:** `GITHUB_OWNER` y `GITHUB_REPO` son **obligatorios** incluso con OAuth.  
> El OAuth solo provee el token de escritura, pero el backend necesita saber en qué repo escribir.

#### ¿Qué permisos tiene el token OAuth?

El scope solicitado es `repo`, que permite:
- ✅ Leer y escribir contenido de repositorios públicos y privados
- ✅ Crear commits y actualizar archivos
- ❌ No tiene acceso a settings del repo, usuarios, ni otros recursos de GitHub

---

### Opción 2: Personal Access Token (sin OAuth)

Si prefieres no usar el flujo OAuth, crea un **Personal Access Token clásico** con scope `repo`.

**Variables necesarias (las 4):**

| Variable | Valor ejemplo |
|---|---|
| `GITHUB_TOKEN` | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_OWNER` | `IDemonSan` |
| `GITHUB_REPO` | `mi-portafolio` |
| `GITHUB_BRANCH` | `master` (solo si tu rama no es `main`) |

**Para crear el token:**

1. [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. **Generate new token (classic)** → scope `repo` → **Generate**
3. Copia el token (empieza con `ghp_`)

Con estas 4 variables configuradas, el admin hará commits automáticos sin necesidad de conectar OAuth desde el navegador.

> ⚠️ A diferencia de OAuth, este token **no expira** (a menos que le pongas expiry). Si se filtra, alguien podría escribir en tu repo.  
> Se recomienda solo para entornos controlados o como plan de respaldo.

---

### Opción 3: Solo OAuth (sin GITHUB_OWNER/GITHUB_REPO en env vars)

No necesitas `GITHUB_OWNER` ni `GITHUB_REPO` como variables de entorno si los configuras **desde el panel admin**:

1. Conecta GitHub vía OAuth (necesitas `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET`)
2. Haz clic en el **engranaje ⚙️** junto a tu nombre de usuario
3. Completa: **Owner**, **Repositorio** y **Rama** (`master`, `main`, etc.)
4. Guarda configuración

**Ventaja:** No necesitas tocar las variables de entorno para el repo.  
**Desventaja:** La configuración se guarda en `sessionStorage` del navegador (se pierde al cerrar la pestaña).  
**Recomendación:** Siempre es mejor tener `GITHUB_OWNER` y `GITHUB_REPO` como env vars en Vercel.

---

### ¿Qué pasa si no configuro GitHub?

Sin OAuth, sin token y sin repo configurado, el panel admin en producción **descargará el archivo JSON modificado** para que puedas hacer commit manualmente. El portafolio sigue funcionando perfectamente — solo pierdes la comodidad del auto-commit.

En desarrollo local, siempre escribe directo al filesystem sin necesidad de GitHub.

### Diagrama del flujo OAuth

```
Usuario                    Frontend (/admin)          Backend (Next.js)            GitHub
   │                            │                          │                        │
   │  Click "Conectar GitHub"   │                          │                        │
   │ ─────────────────────────> │                          │                        │
   │                            │  GET /api/admin/github/connect                    │
   │                            │ ──────────────────────> │                        │
   │                            │                          │ ─── Redirect con ────> │
   │                            │                          │ state + client_id      │
   │  ┌─── Autoriza app ────────┼──────────────────────────┼────────────────────────>│
   │  │                         │                          │                        │
   │  │<────── Callback con code + state ──────────────────│<────────────────────────│
   │  │                         │                          │                        │
   │  │                         │                          │ POST /login/oauth/     │
   │  │                         │                          │ access_token ─────────> │
   │  │                         │                          │<── access_token ─────── │
   │  │                         │                          │                        │
   │  │                         │                          │ Almacena token en       │
   │  │                         │                          │ cookie httpOnly (7d)    │
   │  │                         │<── redirect /admin ──────│                        │
   │  │<──────────────────────── │   ?github=connected     │                        │
   │                            │                          │                        │
   │  Guarda cambios            │                          │                        │
   │ ─────────────────────────> │                          │                        │
   │                            │  POST /api/admin/save    │                        │
   │                            │  + cookie (httpOnly)     │                        │
   │                            │ ──────────────────────> │                        │
   │                            │                          │ PUT /repos/.../contents │
   │                            │                          │ ──────────────────────> │
   │                            │                          │<── 201 Created ────────│
   │                            │<── success ─────────────│                        │
   │<───────────────────────── │                          │                        │
```

---

## 📁 Estructura del proyecto

```
portafolio-crimson/
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← Layout raíz con metadata y tema
│   │   ├── page.tsx            ← Página principal
│   │   ├── globals.css         ← Sistema de diseño Crimson & Ember
│   │   ├── admin/
│   │   │   ├── page.tsx        ← Dashboard admin (4 editores)
│   │   │   └── login/page.tsx  ← Login del admin
│   │   └── api/admin/
│   │       ├── data/route.ts   ← GET: leer datos JSON
│   │       ├── save/route.ts   ← POST: guardar cambios (local) o commit (GitHub)
│   │       └── github/
│   │           ├── connect/route.ts   ← Inicia OAuth flow
│   │           ├── callback/route.ts  ← Recibe el callback de GitHub
│   │           └── status/route.ts    ← Verifica conexión actual
│   ├── components/             ← Componentes React
│   │   ├── header.tsx
│   │   ├── hero-section.tsx
│   │   ├── experience-section.tsx
│   │   ├── projects-section.tsx
│   │   ├── tech-stack-section.tsx
│   │   ├── about-section.tsx
│   │   ├── contact-section.tsx
│   │   ├── footer.tsx
│   │   ├── theme-provider.tsx
│   │   └── language-provider.tsx
│   ├── data/                   ← 📁 **CMS: edita estos archivos**
│   │   ├── profile.json
│   │   ├── projects.json
│   │   ├── experience.json
│   │   └── tech-stack.json
│   ├── lib/
│   │   ├── utils.ts            ← Utilidad cn() (clsx + tailwind-merge)
│   │   ├── i18n.ts             ← Sistema de traducciones ES/EN
│   │   └── tech-icons.tsx      ← Iconos SVG inline (sin dependencias externas)
│   └── types/index.ts          ← Tipos TypeScript
├── .env.example                ← Template de variables de entorno
├── public/
│   ├── IDemonSan-Logo.svg      ← Logo del header (reemplázalo por tu logo)
│   ├── IDemon-San-Icon.svg     ← Favicon del sitio (reemplázalo)
│   └── cv-brandon-huerta.txt   ← CV descargable (reemplázalo)
└── package.json
```

---

## 🛠️ Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir build de producción |
| `npm run lint` | Verificar linting |

---

## 🎨 Personalización visual

### Paleta de colores

Las variables CSS están definidas en `src/app/globals.css`.  
Los modos oscuro y claro tienen sus propios valores:

| Variable | Oscuro | Claro |
|---|---|---|
| `--bg-primary` | `#0A0A0F` | `#F5F3EF` |
| `--crimson` | `#DC2626` | `#B91C1C` |
| `--ember` | `#F59E0B` | `#D97706` |

Para cambiar los colores, edita las variables CSS en `:root` (claro) y `.dark` (oscuro).

### Tipografía

Se usa **Geist** (de Vercel) como fuente principal. Para cambiarla:
1. Actualiza la importación en `src/app/layout.tsx`
2. Actualiza `--font-sans` en `globals.css`

### Iconos

Los iconos de tecnologías están en `src/lib/tech-icons.tsx` como SVGs inline.  
Para agregar una tecnología, busca su SVG de [Simple Icons](https://simpleicons.org/) y agrégalo al mapa `techIcons`.

---

## 🔒 Análisis de seguridad

| Componente | Medida de seguridad |
|---|---|
| **Admin login** | Autenticación por Bearer token contra `ADMIN_SECRET` (env var). Rate limiting: 5 intentos/15 min, bloqueo 30 min. |
| **GitHub OAuth** | Usa `state` parameter para CSRF protection. Token almacenado en cookie httpOnly. |
| **Cookies** | `github_token` es httpOnly (no accesible desde JavaScript). `secure` flag en producción. |
| **Validación de archivos** | Solo permite escribir en los 4 archivos JSON conocidos (`profile.json`, `projects.json`, `experience.json`, `tech-stack.json`). Previene directory traversal. |
| **Scope mínimo** | El OAuth solo solicita `repo` — el mínimo necesario para hacer commits. |
| **Sin exposición de secretos** | `ADMIN_SECRET`, `GITHUB_CLIENT_SECRET` y `GITHUB_TOKEN` son variables de entorno del servidor. Nunca se envían al cliente. |
| **CORS** | Las rutas API solo responden al mismo origen (Next.js server). |
| **Timing attacks** | Comparación en tiempo constante con `crypto.timingSafeEqual` para evitar ataques de temporización. |
| **Rate limiting** | Login: 5 intentos/ventana de 15 min (bloqueo 30 min). Save: 20 guardados/ventana de 15 min. Header `Retry-After` y `X-RateLimit-*`. |
| **XSS** | Las entradas del admin se renderizan como texto (React escapea automáticamente). |
| **HTTPS** | Vercel forza HTTPS automáticamente en producción. |

### Limitaciones conocidas

- **Logs de auditoría**: ❌ No implementado. No se registra quién hizo qué cambio. Se podría agregar con `console.log` o un servicio externo.
- **Token expiry**: Si el token OAuth expira (7 días), el usuario debe reconectar. No hay refresh token automático.
- **Secret viaja en header**: `ADMIN_SECRET` viaja en cada request como Bearer token. Usa HTTPS en producción para evitar interceptación.
- **Rate limit en memoria**: El rate limiter usa memoria del servidor. En Vercel, los límites se reinician al hacer redeploy o si la función serverless se enfría.

---

## 📝 Licencia

Este proyecto está bajo la **Licencia MIT**. Consulta el archivo [`LICENSE`](/LICENSE) para más detalles.

### ⚠️ Atribución requerida

Si usas este proyecto como plantilla para tu propio portafolio, **debes**:

1. **Mantener el archivo `LICENSE`** con el copyright original de Brandon Huerta
2. **Dar crédito visible** en tu `README.md`, por ejemplo:

```markdown
> Este portafolio está basado en la plantilla [Portafolio Crimson & Ember](https://github.com/IDemonSan/portafolio-crimson)
> de Brandon Huerta.
```

3. **(Opcional pero apreciado)** Dejar una ⭐ en el [repositorio original](https://github.com/IDemonSan/portafolio-crimson)

El resto del contenido del portafolio (datos personales, imágenes, CV) es tuyo y puedes modificarlo libremente.

---

<div align="center">
  <sub>Hecho con Next.js, Tailwind CSS y ☕ mucho café</sub>
</div>
