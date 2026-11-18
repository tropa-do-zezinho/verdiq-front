# Verdiq — Frontend

SPA React (Vite + TypeScript) do calendário de safra FLV. Consome a API em `http://localhost:8080`.

## Subir

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
