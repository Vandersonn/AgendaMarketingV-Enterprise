# Backend do WhatsApp Business

Esta implementação prepara dois números oficiais por organização sem armazenar tokens no navegador ou no banco.

## Antes de implantar

1. Execute a migration `202607190004_whatsapp_business_backend.sql`.
2. Cadastre os dois canais em `whatsapp_business_channels`.
3. Configure os segredos da Edge Function:
   - `WHATSAPP_ACCESS_TOKEN_CHANNEL_1`
   - `WHATSAPP_ACCESS_TOKEN_CHANNEL_2`
   - `META_GRAPH_API_VERSION`
4. Implante `supabase/functions/whatsapp-send`.
5. Registre o consentimento do contato em `contact_communication_consents` antes de enviar.

Os tokens devem existir somente nos segredos do ambiente Supabase. Não use variáveis `VITE_*` para tokens da Meta.

## Contrato de envio

A função aceita apenas `POST` autenticado:

```json
{
  "organizationId": "uuid",
  "channelId": "uuid",
  "contactKey": "lead:uuid",
  "to": "5531999999999",
  "text": "Mensagem autorizada"
}
```

Ela confirma a associação ativa do usuário à organização, o consentimento vigente e o canal ativo. A resposta `202` significa apenas que a Meta aceitou a solicitação; estados `sent`, `delivered` e `read` deverão ser atualizados pelo webhook oficial em um pacote posterior.

## Limites intencionais

- Nenhum envio é ativado automaticamente por esta alteração.
- A interface atual continua abrindo o WhatsApp manualmente.
- Templates, webhook de status e caixa de entrada ainda não foram implementados.
- Mensagens comerciais fora da janela permitida deverão usar templates aprovados pela Meta.
