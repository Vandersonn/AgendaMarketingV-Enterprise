# Arquitetura modular

Cada domínio do produto vive em `src/modules/<dominio>` e expõe somente seu contrato público por `index.ts`.

## Estrutura

- `pages/`: telas pertencentes ao domínio.
- `routes.ts`: rotas, permissões e recursos de licença do módulo.
- `index.ts`: API pública do módulo.
- `src/app/`: composição global das rotas e proteções transversais.
- `src/components`, `src/hooks`, `src/lib` e `src/data`: infraestrutura compartilhada.

## Regra de dependência

Um módulo não deve importar arquivos internos de outro módulo. Integrações entre domínios devem passar pela API pública (`index.ts`) ou por serviços compartilhados.

## Novo módulo

1. Crie `src/modules/nome/pages`.
2. Defina as telas.
3. Registre as rotas em `routes.ts`.
4. Exporte as rotas em `index.ts`.
5. Adicione o módulo em `src/app/routes.ts`.

As páginas são carregadas com `React.lazy`, reduzindo o bundle inicial. Permissões, licenças e acesso exclusivo do proprietário ficam declarados junto às rotas do próprio domínio.

## Navegação modular

A barra lateral passou a consumir configurações exportadas por cada módulo em `navigation.ts`.

- Grupos recolhíveis com apenas um grupo aberto por vez.
- A seção da rota atual abre automaticamente.
- Estado do grupo persistido no `localStorage`.
- Permissões, proprietário e módulos habilitados continuam filtrando os itens.
- No modo recolhido, cada domínio abre um submenu flutuante.
- Administração e ferramentas técnicas foram separadas em grupos próprios.

O registro central está em `src/app/navigationRegistry.ts`; ele apenas reúne os contratos públicos dos módulos.
