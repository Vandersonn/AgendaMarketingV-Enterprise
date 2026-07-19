# AgendaMarketingV Enterprise RC16.6.2

## RC16.6.2 — Camada Central de Dados

- Persistência desacoplada por meio da interface `StorageProvider`.
- Provedores para `localStorage` e memória.
- `CrmRepository` centraliza leitura, gravação e operações imutáveis de Leads e Clientes.
- `DataService` atua como fachada central da camada de dados.
- Migração idempotente mantém compatibilidade com os dados e backups existentes.
- Novo comando `npm run test:data-layer`.
- `npm run quality:check` executa 16 testes, TypeScript e build Vite.

# AgendaMarketingV Enterprise RC16.4.5

Sistema CRM/ERP desktop com interface em português brasileiro, módulos comerciais, agenda, financeiro e recursos de inteligência empresarial.

O histórico de versões está centralizado em `docs/HISTORICO-DE-VERSOES.md`. A antiga pasta `Changelog` permanece descontinuada.

# AgendaMarketingV Enterprise 1.0 RC7 — Cloud Enterprise

## Entregas
- DEVVANDERSON License Server em Node.js sem dependências externas.
- Ativação e validação online.
- Limite central de dispositivos.
- Revogação remota.
- Bloqueio e liberação de dispositivos.
- Portal DEVVANDERSONAPPS dentro do aplicativo.
- Publicação das licenças locais no servidor.
- Indicadores online.
- Histórico central de eventos.
- Configuração de endpoint e token administrativo.
- Todos os recursos da RC6 preservados.

## Executar o servidor

PowerShell:

```powershell
$env:ADMIN_TOKEN="troque-por-um-token-muito-forte"
npm run license-server
```

Servidor padrão:

```text
http://localhost:8787
```

Abra o `Portal DEVVANDERSON`, informe o endpoint e o mesmo token.

## Rotas
- GET /health
- POST /api/licenses/activate
- POST /api/licenses/validate
- GET /api/admin/overview
- POST /api/admin/licenses
- PATCH /api/admin/licenses/:id
- PATCH /api/admin/activations/:id

## Produção
A RC utiliza arquivo JSON para testes e implantação inicial. Para publicação na internet, use HTTPS, PostgreSQL, firewall, rate limiting, backup, variáveis seguras e hospedagem separada do aplicativo desktop.

DEVVANDERSONAPPS
Vanderson de Castro
produtosecursosnet@gmail.com
CNPJ 39.551.372/0001-41

## Gerar instalador
Execute `scripts\GERAR-EXE.bat`.


## Validação técnica
- TypeScript compilado sem erros.
- Build Vite concluído com sucesso.
- Portal e License Server incluídos.

## RC7.3 — estabilização do build original

A aplicação e sua estrutura foram preservadas. Para gerar Windows e Web, execute:

```bat
scripts\GERAR-EXE.bat
```

Saídas:

- `release\` — instalador NSIS e versão portátil.
- `dist-web\` — versão para navegadores.

O manual fica em `scripts\MANUAL-GERACAO-WINDOWS-E-WEB.txt`.

## Central de Vendas Profissional

Módulo adicional disponível em **Central de Vendas** no menu lateral.

Recursos incluídos:
- Pipeline financeiro e receita ponderada por probabilidade;
- Meta mensal editável e acompanhamento de progresso;
- Indicadores de receita, conversão e negócios ganhos;
- Funil financeiro por etapa;
- Cadastro, edição, busca, filtro e exclusão de oportunidades;
- Priorização comercial automática;
- Gestão de atividades e follow-ups;
- Persistência local independente do CRM original;
- Interface responsiva para desktop e dispositivos móveis.

O CRM original foi preservado. A Central de Vendas funciona como um módulo complementar e independente.

## RC8 — Infraestrutura profissional Supabase

Esta versão preserva o modo local e adiciona uma infraestrutura cloud opcional:

- autenticação Supabase;
- estrutura multiempresa com papéis owner, admin, vendas, marketing, financeiro e visualizador;
- políticas RLS para isolamento dos dados por empresa;
- perfis, membros, oportunidades, atividades e auditoria;
- sincronização automática da Central de Vendas quando o Supabase estiver configurado;
- fallback local integral quando as variáveis de ambiente não estiverem presentes.

### Ativação

1. Crie um projeto no Supabase.
2. Execute `supabase/migrations/202607170001_enterprise_infrastructure.sql` no SQL Editor.
3. Copie `.env.example` para `.env` e preencha URL e chave anônima.
4. Crie o primeiro usuário pelo cadastro do aplicativo.
5. Cadastre uma organização no banco ou pela API; associe o usuário em `organization_members` como `owner`.

Nunca coloque a chave `service_role` no frontend.


## RC9.0 — Operação Comercial

- Sales Workspace com funil Kanban por arrastar e soltar.
- Cadastro independente de clientes.
- Catálogo de produtos e serviços com preço, custo, margem e recorrência.
- Propostas comerciais com itens, descontos, validade e status.
- Persistência local preservada e estrutura SQL pronta para Supabase.
- A Central de Vendas RC8 permanece disponível sem alterações.

## RC12.0 — CRM 360 Enterprise

A visão Cliente 360 agora inclui score comercial, status de relacionamento, responsável, próximo contato, tags de segmentação, notas rápidas e acesso direto pela pesquisa global. Consulte `docs/HISTORICO-DE-VERSOES.md` para a evolução consolidada.


## Geração no Windows
Execute `scripts/GERAR-EXE.bat`. Em caso de falha, consulte `logs/compilacao-windows.log` ou execute `scripts/DIAGNOSTICO-WINDOWS.bat`. Os executáveis anteriores são preservados até a conclusão da nova geração.


## Qualidade RC16.6.1
Execute `npm run quality:check` para validar regras de dados, TypeScript e o build web.
