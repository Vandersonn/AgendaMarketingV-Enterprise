## RC16.6.1 — Refatoração do CRM

- Separado o formulário de novo Lead em componente próprio.
- Centralizadas regras de valores padrão, leitura do envio, validação e duplicidade de Leads.
- Separado o Kanban comercial, incluindo pontuação, SLA, seleção e movimentação de etapas.
- `CrmPage.tsx` foi reduzido de 565 para 478 linhas.
- Adicionada suíte `test:crm` com quatro verificações de regressão estrutural.
- Qualidade validada com 12 testes, TypeScript e build Vite.
- Correções de foco e digitação da RC16.6.0 foram preservadas.

# Histórico de versões

## RC16.6.0 — Estabilidade de Formulários
- Modal compartilhado reforçado para não perder foco durante digitação contínua.
- Navegação por Tab agora permanece dentro da janela ativa.
- Foco anterior é restaurado ao fechar e a rolagem do fundo é bloqueada enquanto o modal está aberto.
- Leads e Clientes declaram explicitamente o campo Nome como foco inicial.
- Nova suíte `test:forms` impede regressões de foco e atualizações de estado sujeitas a perda de caracteres.
- `quality:check` executa testes de dados, testes de formulários, TypeScript e build Vite.

## RC16.5 — Integridade de Dados e Formulários

- Validação de e-mail, telefone brasileiro, CPF e CNPJ.
- Prevenção de duplicidade em Leads e Clientes por documento, e-mail, telefone ou identidade.
- Aviso antes de descartar cadastros não salvos.
- Confirmação interna antes de excluir clientes.
- Correção dos botões de envio de observações e propostas.
- Correção da contagem real de Leads importados.
- Mensagens de sucesso e validação dentro da interface.

## RC16.4.11 — Correção do nome completo de Leads

- Corrigido o cadastro de Lead na tela Funil de vendas, inclusive quando o usuário digita e salva rapidamente.
- O nome, empresa, e-mail, WhatsApp, origem, responsável e próxima ação agora são lidos diretamente dos campos no momento do envio.
- Evitada a perda dos últimos caracteres por atraso entre o evento de digitação e o estado da interface.
- Campos receberam nomes e preenchimento automático apropriados para melhorar compatibilidade com o Windows e navegadores.
- Pasta Changelog permanece descontinuada; histórico centralizado neste arquivo.

## RC16.4.10 — Estabilidade de formulários

- Atualizações de estado dos formulários convertidas para o modo funcional do React.
- Corrigida a possibilidade de perda de letras durante digitação rápida em Projetos, Contratos, Organizações, Automações, Vendas, Marketing, Suporte, Equipe, Metas, Missões, Catálogo de Serviços e Base de Conhecimento.
- Correção aplicada também a seletores, caixas de seleção, datas, valores e descrições desses módulos.
- Geração do executável no Windows mantém a validação automática das dependências locais.
- Pasta Changelog permanece descontinuada; histórico centralizado neste arquivo.

## RC16.4.9 — Correção da compilação no Windows

- Corrigida a falha `tsc não é reconhecido` ao gerar executáveis no Windows.
- O gerador agora valida `tsc.cmd`, `vite.cmd` e `electron-builder.cmd`, em vez de verificar apenas a existência de `node_modules`.
- Dependências incompletas ou copiadas de outro sistema operacional são removidas e reinstaladas com `npm ci --include=dev`.
- Cabeçalho antigo da RC16.2 foi atualizado para RC16.4.9.
- O pacote deixa de distribuir `node_modules`, evitando incompatibilidade entre Linux e Windows.
- Pasta Changelog permanece descontinuada; histórico centralizado neste arquivo.

## RC16.4.7 — CRM seguro e consentimento orientado

- Removidas as últimas janelas nativas de alerta e confirmação do CRM.
- Contatos bloqueados agora exibem mensagem interna acessível.
- Contatos sem consentimento confirmado exigem confirmação interna e não registram envio comercial.
- Importação de Leads agora informa resultados por mensagem interna, com singular e plural corretos.
- Exclusão individual e em lote da aba Perdidos usa diálogo interno e confirma o envio para a Lixeira.
- Pasta Changelog permanece descontinuada; histórico centralizado neste arquivo.

A antiga pasta `docs/CHANGELOG` foi descontinuada na RC16.4.4 para reduzir arquivos repetidos e simplificar a manutenção documental.

## Linha evolutiva consolidada

- **RC11–RC14:** inteligência empresarial, CRM 360, lixeira inteligente e perfil multissetorial.
- **RC15–RC15.11:** marketplace, exclusão e recuperação, importação de planilhas, comunicação, campanhas, acompanhamento, SLA, distribuição e pontuação de Leads.
- **RC16.0–RC16.2:** núcleo modular, segurança por funções, lançador, empacotamento, agenda e campos monetários.
- **RC16.3–RC16.3.1:** novo sistema visual AMV e padronização para português brasileiro.
- **RC16.4–RC16.4.3:** Centro de Trabalho, pesquisa global, revisão funcional, acessibilidade e segurança de formulários.
- **RC16.4.4:** consolidação documental, persistência da fila de sincronização e melhoria das mensagens de configuração.

A partir desta versão, as mudanças relevantes serão registradas diretamente neste arquivo único.

## RC16.4.5 — Lixeira segura e consolidação documental

- Confirmada a descontinuação da pasta `Changelog`; nenhum diretório ou arquivo avulso com esse nome é distribuído.
- Exclusões definitivas agora usam uma janela interna acessível, sem `prompt` ou `confirm` do navegador.
- Restaurações não recarregam mais toda a aplicação.
- Itens vencidos pela retenção de 30 dias são removidos automaticamente ao abrir a Lixeira.
- Mensagens de restauração e exclusão agora são exibidas na própria interface.
- Estados vazios da Lixeira e da pesquisa foram diferenciados.
- README e metadados da versão foram atualizados.

## RC16.4.6 — Diálogos internos e feedback operacional

- Substituição de confirmações nativas nas Operações de Vendas e Campanhas.
- Mensagens internas para erros de contato e confirmações de exclusão.
- Novo componente reutilizável `ConfirmDialog`.
- Novo componente reutilizável `StatusMessage`.
- Exclusões continuam enviando registros para a Lixeira quando aplicável.
- Pasta Changelog permanece descontinuada.
## 1.0.0-rc.16.4.8 — Correção de digitação de Leads

- Corrigida a perda de letras durante digitação rápida no formulário de novo Lead.
- Campos do formulário agora usam atualização funcional de estado, evitando sobrescritas por estado desatualizado.
- Botão **Criar lead** voltou a atuar explicitamente como envio do formulário.
- Funcionalidades, rotas e dados existentes foram preservados.


## RC16.4.12 — Geração Windows robusta e diagnóstico
- Geração web executada diretamente pelos binários JavaScript locais, sem depender de `tsc.cmd` ou `vite.cmd`.
- Validação específica do `electron.exe` para Windows.
- Instalação limpa das dependências de desenvolvimento quando necessário.
- Executáveis anteriores preservados até a nova compilação terminar.
- Saída temporária em `releases-novas` e substituição segura após sucesso.
- Registro completo em `logs/compilacao-windows.log`.
- Novo utilitário `scripts/DIAGNOSTICO-WINDOWS.bat`.
## RC16.4.13 — Correção definitiva do foco em cadastros

- Corrigida a causa que fazia campos em janelas modais aceitarem somente uma letra.
- O foco inicial da janela agora é aplicado apenas no momento da abertura.
- Funções de fechamento recriadas durante a digitação não reiniciam mais o efeito de foco.
- Correção válida para os cadastros de Leads, Clientes e demais formulários que usam o componente Modal.
- Cadastro de Clientes recebeu atualizações funcionais de estado e leitura segura dos campos no envio.
- Botões de criar Lead e salvar Cliente agora declaram envio do formulário explicitamente.


## RC16.5.1 — Testes e Proteção de Dados
- Testes automatizados para e-mail, telefone, CPF, CNPJ e normalização de duplicidades.
- Proteção contra fechamento do aplicativo com formulários de Lead ou Cliente não salvos.
- Validação estrutural de snapshots antes da restauração.
- Bloqueio de backups com chaves externas ao namespace do AgendaMarketingV.
- `quality:check` agora executa testes antes do build.

## RC16.6.2 — Camada Central de Dados

- Criada interface `StorageProvider` para desacoplar a aplicação do localStorage.
- Criados provedores para localStorage e memória (testes).
- Criado `CrmRepository` com leitura, gravação e operações imutáveis de Lead e Cliente.
- Criado `DataService` como fachada central de persistência.
- Adicionada migração idempotente do formato legado e controle de versão do esquema.
- `crmStore` passou a persistir por meio da nova camada, mantendo os dados e backups existentes.
- Adicionados testes automatizados de persistência, CRUD e migração.
