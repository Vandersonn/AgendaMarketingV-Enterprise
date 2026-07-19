import type { CopyType } from './aiTypes'

interface Options {
  type: CopyType
  subject: string
  audience: string
  objective: string
  tone: string
  offer: string
}

export function generateOfflineCopy({ type, subject, audience, objective, tone, offer }: Options): string {
  const hook = `Chega de perder oportunidades com ${subject}.`
  const benefit = `Para ${audience}, a estratégia certa transforma atenção em resultado real.`
  const offerLine = offer ? `Agora: ${offer}.` : ''
  const cta = objective ? `O próximo passo é simples: ${objective}.` : 'Fale conosco e dê o próximo passo.'

  if (type === 'reel_script') {
    return `ROTEIRO PARA REEL

[GANCHO — 0 a 3s]
${hook}

[DESENVOLVIMENTO — 4 a 18s]
${benefit}
Mostre o problema, apresente uma solução prática e use um exemplo visual.

[OFERTA — 19 a 25s]
${offerLine || 'Apresente o serviço de forma direta e objetiva.'}

[CTA — 26 a 30s]
${cta}

Tom: ${tone}.`
  }

  if (type === 'carousel') {
    return `CARROSSEL

Slide 1 — ${hook}
Slide 2 — O problema que trava ${audience}
Slide 3 — O erro mais comum
Slide 4 — A solução prática
Slide 5 — Como aplicar ainda hoje
Slide 6 — ${offerLine || 'Conheça nossa solução'}
Slide 7 — ${cta}`
  }

  if (type === 'email') {
    return `Assunto: Uma forma mais inteligente de melhorar ${subject}

Olá,

${benefit}

${offerLine}

${cta}

Abraço,
AgendaMarketingV`
  }

  if (type === 'whatsapp') {
    return `Olá! Tudo bem?

${benefit}

${offerLine}

${cta}`
  }

  if (type === 'ad') {
    return `${hook}

${benefit}

${offerLine}

${cta}`
  }

  return `${hook}

${benefit}

${offerLine}

${cta}

#marketing #resultados #negócios`
}
