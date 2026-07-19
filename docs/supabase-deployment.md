# Implantação do Supabase

O deploy é manual pelo workflow **Deploy Supabase**. Nada é publicado automaticamente ao fazer push na `main`.

## 1. Criar ambientes protegidos no GitHub

Crie os ambientes `staging` e `production` em Settings > Environments. Para produção, habilite aprovação obrigatória.

Cadastre em cada ambiente:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

Use projetos Supabase separados para staging e produção.

## 2. Configurar segredos das Edge Functions

No painel Supabase de cada projeto, configure:

- `WHATSAPP_ACCESS_TOKEN_CHANNEL_1`
- `WHATSAPP_ACCESS_TOKEN_CHANNEL_2`
- `META_GRAPH_API_VERSION`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`

Os segredos `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidos pelo ambiente das Edge Functions. Nunca copie a service role para variáveis `VITE_*`.

## 3. Executar o deploy

1. Abra Actions > Deploy Supabase > Run workflow.
2. Selecione primeiro `staging`.
3. Digite `DEPLOY`.
4. Aguarde migrations, `whatsapp-send` e `whatsapp-webhook`.
5. Valide staging antes de repetir em produção.

O workflow interrompe antes das migrations se credenciais ou segredos obrigatórios estiverem ausentes.

## 4. Validação após staging

- autentique um usuário real;
- confirme que ele pertence à organização correta;
- cadastre os dois canais, inicialmente desativados;
- registre consentimento de um contato de teste;
- envie somente para um número de teste autorizado;
- confirme a transição `queued -> accepted -> sent -> delivered -> read`;
- confirme que uma assinatura inválida no webhook recebe HTTP 401;
- confirme que um usuário de outra organização não lê canais, consentimentos ou mensagens.

## 5. Reversão

Migrations devem ser corrigidas com uma nova migration; não edite arquivos já aplicados. Edge Functions podem ser revertidas implantando novamente um commit anterior conhecido. Antes de produção, mantenha backup do banco e registre o SHA implantado.
