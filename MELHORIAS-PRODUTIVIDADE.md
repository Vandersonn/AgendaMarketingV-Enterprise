# Melhorias de produtividade — RC16.6.2

## Implementado

### Paleta central de comandos
- `Ctrl + K` abre a paleta global existente.
- O campo de busca da Topbar usa a mesma paleta, eliminando a busca duplicada.
- Pesquisa comandos e dados globais do sistema.

### Criação rápida
- Botão global **Novo** na Topbar.
- Atalho `Ctrl + N`.
- Acesso rápido a cliente, lead, tarefa, projeto, proposta, compromisso, lançamento financeiro e conteúdo.
- A intenção de criação é registrada em `sessionStorage` e a rota recebe `?action=new`, permitindo que cada módulo evolua para abrir diretamente seu formulário.

### Favoritos e recentes
- Qualquer item da navegação pode ser fixado pela estrela.
- Limite de seis favoritos.
- Três páginas recentes aparecem automaticamente.
- Preferências persistidas localmente por meio de um store dedicado.

### Dashboard por perfil
- Visões diferentes para proprietário, administrador, comercial, marketing, financeiro e consulta.
- Texto de contexto e atalhos são adaptados ao papel do usuário.
- Os indicadores centrais continuam disponíveis para manter consistência operacional.

## Arquivos principais
- `src/lib/navigationPreferencesStore.ts`
- `src/components/Sidebar.tsx`
- `src/components/Topbar.tsx`
- `src/components/CommandPalette.tsx`
- `src/modules/dashboard/pages/DashboardPage.tsx`
