# Dota Build Assistant

Monorepo (npm workspaces) con:
- `@dba/server`: API Express/TypeScript
- `@dba/web`: Frontend React/Vite/TypeScript
- `@dba/shared`: Tipos/Zod compartidos

## Licencia
Este repositorio está marcado como **UNLICENSED** (propietario). Consulta `LICENSE` y actualiza con tu nombre/empresa.

## Desarrollo local
1. Copia `.env.example` a `.env` y rellena `OPENAI_API_KEY`.
2. Instala dependencias:
   ```powershell
   npm install
   ```
3. Arranca backend+web:
   ```powershell
   npm run dev
   ```

## Build
```powershell
npm run build
```

## Producción en GitHub

### 1) Crear repo y push
- Crea un repo vacío en GitHub.
- En PowerShell desde la raíz del proyecto:
  ```powershell
  git init
  git add .
  git commit -m "chore: initial import"
  git branch -M main
  git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
  git push -u origin main
  ```

### 2) CI (GitHub Actions)
- Se añadió `.github/workflows/ci.yml` para instalar y compilar en cada push.

### 3) Publicar API con Docker (opcional)
- Se añadió `packages/server/Dockerfile` y `.dockerignore`.
- Puedes publicar la imagen:
  - Configura `GHCR` o tu registry preferido.
  - Crea `secrets` en GitHub si haces workflow de publicación.

### 4) Desplegar `@dba/web` a GitHub Pages (opcional)
- Vite genera sitio estático. Puedes usar Pages o cualquier hosting estático.
- Para Pages: configura el repo en Settings > Pages (desde `gh-pages` o `docs`).
- Si el API vive en otro host, define `VITE_API_URL` en build.

## Variables de entorno
- Backend: `OPENAI_API_KEY`, `PORT` (opcional)
- Frontend: `VITE_API_URL`

## Docker (backend)
Construir y correr localmente:
```powershell
docker build -t dba-server ./packages/server
docker run --rm -p 4000:4000 -e OPENAI_API_KEY=sk-xxx dba-server
```

## Notas
- Si el frontend se sirve en otro dominio, habilita CORS en el backend (ya activado por defecto).
- Para producción, configura logs, rate limiting, y una URL estable para `VITE_API_URL`.
