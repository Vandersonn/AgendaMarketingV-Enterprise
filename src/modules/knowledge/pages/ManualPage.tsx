import {
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ContactRound,
  FileText,
  HelpCircle,
  Image,
  MessageCircle,
  Settings,
  UsersRound,
  FileSignature,
  Workflow,
  ShieldCheck,
  ScrollText,
  FolderOpen,
  ScanSearch,
  PanelTopOpen,
  ReceiptText,
  ListTodo,
  BriefcaseBusiness,
  Goal,
  HeartPulse,
  Headphones,
  LibraryBig,
  PackageSearch,
  Activity,
  Cable,
  BrainCircuit,
  Radar,
  LayoutGrid,
  Sparkles
} from 'lucide-react'

const sections = [
  {
    icon: BarChart3,
    title: 'Visão geral',
    description: 'Acompanhe clientes, pipeline, compromissos, receitas, metas e alertas importantes em um único painel.'
  },
  {
    icon: ContactRound,
    title: 'CRM',
    description: 'Cadastre leads, mova oportunidades pelo funil Kanban, registre próxima ação e acompanhe o valor do pipeline.'
  },
  {
    icon: UsersRound,
    title: 'Clientes',
    description: 'Gerencie dados completos, empresa, telefone, e-mail, cidade, estado, CPF/CNPJ, propostas e histórico.'
  },
  {
    icon: CalendarDays,
    title: 'Agenda',
    description: 'Crie reuniões, entregas, conteúdos e tarefas com início, fim, cliente vinculado e observações.'
  },
  {
    icon: Image,
    title: 'Marketing',
    description: 'Planeje conteúdos, organize calendário editorial, acompanhe aprovações e use links do Canva e das redes sociais.'
  },
  {
    icon: Bot,
    title: 'Estúdio IA',
    description: 'Gere textos localmente ou conecte um endpoint seguro para criar textos e imagens com inteligência artificial.'
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    description: 'Selecione clientes do CRM, use respostas rápidas e abra conversas ou envie dados para webhooks autorizados.'
  },
  {
    icon: CircleDollarSign,
    title: 'Financeiro',
    description: 'Controle receitas, despesas, cobranças, vencimentos, pagamentos, meta mensal e lançamentos recorrentes.'
  },
  {
    icon: BarChart3,
    title: 'Métricas e Power BI',
    description: 'Registre campanhas, calcule CTR, CPL e ROAS, analise investimento versus receita e incorpore dashboards.'
  },
  {
    icon: FileText,
    title: 'Relatórios',
    description: 'Exporte clientes, leads, conteúdos, métricas, agenda e financeiro em CSV para Excel ou Power BI.'
  },
  {
    icon: FileSignature,
    title: 'Contratos e renovações',
    description: 'Controle valores, vigência, status, renovação automática e alertas de vencimento.'
  },
  {
    icon: Workflow,
    title: 'Automações',
    description: 'Crie gatilhos e ações, conecte webhooks e teste fluxos com n8n, Make ou backend próprio.'
  },
  {
    icon: ShieldCheck,
    title: 'Equipe e permissões',
    description: 'Cadastre usuários e atribua funções para comercial, marketing, financeiro e administração.'
  },
  {
    icon: ScrollText,
    title: 'Auditoria',
    description: 'Consulte e exporte registros das ações administrativas e operacionais.'
  },
  {
    icon: ScanSearch,
    title: 'Cliente 360º',
    description: 'Consulte em uma tela o CRM, contratos, agenda, documentos, financeiro e timeline do cliente.'
  },
  {
    icon: FolderOpen,
    title: 'Central de documentos',
    description: 'Organize arquivos locais por cliente, categoria e observações.'
  },
  {
    icon: ReceiptText,
    title: 'Propostas profissionais',
    description: 'Gere documentos comerciais, salve no cliente e use a impressão do sistema para exportar em PDF.'
  },
  {
    icon: PanelTopOpen,
    title: 'Portal do cliente',
    description: 'Crie códigos de acesso, acompanhe solicitações e apresente uma visão resumida dos serviços.'
  },
  {
    icon: ListTodo,
    title: 'Tarefas e produtividade',
    description: 'Organize tarefas em Kanban, defina responsáveis, clientes, prazos, prioridades e tags.'
  },
  {
    icon: Bell,
    title: 'Central de notificações',
    description: 'Visualize alertas de CRM, marketing, agenda, financeiro e tarefas. Marque itens como lidos e abra o módulo relacionado.'
  },
  {
    icon: BriefcaseBusiness,
    title: 'Projetos',
    description: 'Controle orçamento, prazo, responsáveis, progresso, saúde e marcos de cada projeto.'
  },
  {
    icon: Goal,
    title: 'Metas e OKRs',
    description: 'Defina objetivos e resultados-chave mensuráveis para empresa e equipe.'
  },
  {
    icon: HeartPulse,
    title: 'Saúde dos clientes',
    description: 'Avalie contratos, inadimplência, agenda, conteúdo e relacionamento para identificar clientes em risco.'
  },
  {
    icon: Headphones,
    title: 'Suporte e SLA',
    description: 'Gerencie chamados, prioridades, responsáveis, prazos, respostas e satisfação.'
  },
  {
    icon: LibraryBig,
    title: 'Base de conhecimento',
    description: 'Documente processos, perguntas frequentes e orientações para equipe e clientes.'
  },
  {
    icon: PackageSearch,
    title: 'Catálogo de serviços',
    description: 'Padronize ofertas, preços, prazos e modelos de cobrança.'
  },
  {
    icon: Activity,
    title: 'Saúde do sistema',
    description: 'Execute diagnósticos, acompanhe integridade, armazenamento, backups automáticos e logs técnicos.'
  },
  {
    icon: Cable,
    title: 'Hub de conexões',
    description: 'Configure endpoints seguros, teste integrações, enfileire sincronizações e acompanhe falhas.'
  },
  {
    icon: BrainCircuit,
    title: 'Agentes de IA',
    description: 'Execute análises comerciais, financeiras, de marketing, projetos e suporte, com insights proativos e memória organizacional.'
  },
  {
    icon: Radar,
    title: 'Painel Executivo',
    description: 'Acompanhe receita, lucro, previsão, pipeline, CAC, LTV, churn, riscos e timeline global.'
  },
  {
    icon: LayoutGrid,
    title: 'Espaço de Trabalho Titanium',
    description: 'Personalize o dashboard com widgets, tamanhos e ordem adaptados ao usuário.'
  },
  {
    icon: Sparkles,
    title: 'CRM Inteligente',
    description: 'Acompanhe score, probabilidade, valor esperado, risco e recomendação por lead.'
  },
  {
    icon: Settings,
    title: 'Configurações',
    description: 'Atualize os dados da empresa, altere a senha, faça backup e importe cópias anteriores.'
  }
]

export function ManualPage() {
  return (
    <div className="page">
      <header className="manual-hero">
        <div>
          <span className="eyebrow">MANUAL OFICIAL</span>
          <h1>Manual do AgendaMarketingV</h1>
          <p>Guia completo para usar a plataforma da DEVVANDERSONAPPS.</p>
        </div>
        <div className="manual-company">
          <strong>DEVVANDERSONAPPS</strong>
          <span>Vanderson de Castro</span>
          <span>produtosecursosnet@gmail.com</span>
          <span>CNPJ: 39.551.372/0001-41</span>
        </div>
      </header>

      <section className="manual-start panel-card">
        <HelpCircle size={34} />
        <div>
          <h2>Primeiros passos</h2>
          <ol>
            <li>Entre com seu e-mail e senha.</li>
            <li>Abra Configurações e confirme os dados da empresa.</li>
            <li>Cadastre clientes e leads.</li>
            <li>Organize oportunidades no CRM.</li>
            <li>Registre compromissos e conteúdos.</li>
            <li>Configure integrações e webhooks apenas com URLs seguras.</li>
            <li>Faça backups periódicos.</li>
          </ol>
        </div>
      </section>

      <section className="manual-grid">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <article key={section.title} className="panel-card manual-card">
              <div className="manual-icon"><Icon size={22} /></div>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </article>
          )
        })}
      </section>

      <section className="manual-security panel-card">
        <CheckCircle2 size={28} />
        <div>
          <h2>Boas práticas de segurança</h2>
          <p>Não coloque chaves secretas diretamente no aplicativo. Use Supabase Edge Functions, n8n, Make ou um backend próprio. Mantenha backups e altere a senha inicial antes de usar em produção.</p>
        </div>
      </section>

      <section className="manual-support panel-card">
        <h2>Suporte e produção</h2>
        <div className="manual-support-grid">
          <div><span>Responsável</span><strong>Vanderson de Castro</strong></div>
          <div><span>Empresa</span><strong>DEVVANDERSONAPPS</strong></div>
          <div><span>E-mail</span><strong>produtosecursosnet@gmail.com</strong></div>
          <div><span>CNPJ</span><strong>39.551.372/0001-41</strong></div>
        </div>
      </section>
    </div>
  )
}
