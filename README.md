# Verdiq — Frontend

SPA React (Vite + TypeScript) do calendário de safra FLV. Consome a API em `http://localhost:8080`.

## Docker (deploy)

```bash
cd front
docker build --build-arg VITE_API_URL=https://SUA-API.up.railway.app -t verdiq-front .
docker run --rm -p 8080:80 -e PORT=80 verdiq-front
```

No Railway: builder **Dockerfile**, root `front`. Build arg / variável de build `VITE_API_URL` = URL pública da API (sem `/` no final). Start command: deixe vazio (nginx). A imagem escuta `PORT` (default 80).

## Subir local

```bash
# API (outro terminal) — exporte ORACLE_* (ver back/.env.example)
cd ../back && ./mvnw spring-boot:run

# Front
cd ../front
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

Em dev, o Vite faz proxy de `/v1` → `:8080`. Opcional: copie `.env.example` para `.env` e defina `VITE_API_URL`.

## Contas seed (senha `Senha@123`)

| E-mail | Papel |
|--------|-------|
| `admin@naepoca.local` | Admin (ETL, upload preços) |
| `marta@naepoca.local` | Comerciante / ERP |
| `ana@naepoca.local` | Cliente |

## Rotas

- Público: `/`, `/produtos`, `/produtos/:id`, `/safra`, `/ofertas`, `/planos`
- Auth: `/entrar`, `/cadastro`
- Cliente: `/conta`
- Comerciante: `/comerciante`, `/comerciante/registros`, `/comerciante/ofertas`
- Admin: `/admin`
