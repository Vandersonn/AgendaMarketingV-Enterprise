# DEVVANDERSON License Server

Servidor HTTP sem dependências externas.

## Executar

Windows PowerShell:

```powershell
$env:ADMIN_TOKEN="uma-chave-administrativa-forte"
npm run license-server
```

O servidor utiliza a porta `8787` por padrão.

## Rotas principais

- `GET /health`
- `POST /api/licenses/activate`
- `POST /api/licenses/validate`
- `GET /api/admin/overview`
- `POST /api/admin/licenses`
- `PATCH /api/admin/licenses/:id`
- `PATCH /api/admin/activations/:id`

As rotas administrativas exigem:

```text
Authorization: Bearer ADMIN_TOKEN
```

## Produção

Use HTTPS, banco PostgreSQL, rate limiting, logs externos, backup e um gerenciador de segredos. O arquivo JSON desta RC serve para implantação inicial e testes controlados.
