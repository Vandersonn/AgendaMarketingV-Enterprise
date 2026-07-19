import { useMemo, useState } from 'react'
import { Copy, Heart, Image, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { generateOfflineCopy } from '../../../lib/copyGenerator'
import { useAiStore } from '../../../lib/aiStore'
import type { CopyType, ImageFormat } from '../../../lib/aiTypes'

export function AiStudioPage() {
  const { assets, integrations, addAsset, toggleFavorite, deleteAsset } = useAiStore()
  const [tab, setTab] = useState<'image' | 'copy'>('image')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [imageForm, setImageForm] = useState({
    title: '',
    prompt: '',
    format: 'square' as ImageFormat,
    style: 'profissional, moderno, azul-claro e branco'
  })
  const [copyForm, setCopyForm] = useState({
    title: '',
    type: 'caption' as CopyType,
    subject: '',
    audience: '',
    objective: '',
    tone: 'direto e profissional',
    offer: ''
  })

  const latest = useMemo(() => assets[0], [assets])

  async function generateImage(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    if (!integrations.imageEndpoint) {
      setMessage('Configure o endpoint de imagens em Integrações. A chave da API não deve ficar dentro do aplicativo.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(integrations.imageEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${imageForm.prompt}. Estilo: ${imageForm.style}`,
          format: imageForm.format,
          size: {
            square: '1024x1024',
            story: '1024x1536',
            landscape: '1536x1024',
            youtube: '1536x1024'
          }[imageForm.format]
        })
      })
      if (!response.ok) throw new Error('Falha no endpoint')
      const data = await response.json() as { imageUrl?: string; dataUrl?: string; url?: string }
      const output = data.dataUrl || data.imageUrl || data.url
      if (!output) throw new Error('Resposta sem imagem')
      addAsset({
        type: 'image',
        title: imageForm.title || 'Imagem gerada',
        prompt: imageForm.prompt,
        output,
        format: imageForm.format
      })
      setMessage('Imagem gerada e salva na biblioteca.')
    } catch {
      setMessage('Não foi possível gerar. Verifique o endpoint e o formato da resposta.')
    } finally {
      setLoading(false)
    }
  }

  async function generateCopy(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      let output = ''
      if (integrations.textEndpoint) {
        const response = await fetch(integrations.textEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(copyForm)
        })
        if (!response.ok) throw new Error()
        const data = await response.json() as { text?: string; output?: string; content?: string }
        output = data.text || data.output || data.content || ''
      } else {
        output = generateOfflineCopy(copyForm)
      }

      if (!output) throw new Error()
      addAsset({
        type: 'copy',
        title: copyForm.title || 'Texto gerado',
        prompt: copyForm.subject,
        output,
        copyType: copyForm.type
      })
      setMessage(integrations.textEndpoint ? 'Texto gerado pela integração.' : 'Texto gerado pelo modelo local.')
    } catch {
      setMessage('Não foi possível gerar o texto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">INTELIGÊNCIA ARTIFICIAL</span>
          <h1>Estúdio de criação</h1>
          <p>Gere imagens, copies, roteiros, carrosséis e mensagens.</p>
        </div>
      </header>

      <div className="studio-tabs">
        <button type="button" className={tab === 'image' ? 'active' : ''} onClick={() => setTab('image')}><Image size={18} /> Imagens</button>
        <button type="button" className={tab === 'copy' ? 'active' : ''} onClick={() => setTab('copy')}><Sparkles size={18} /> Textos</button>
      </div>

      {message && <div className="form-message success">{message}</div>}

      <section className="ai-studio-grid">
        <article className="panel-card">
          {tab === 'image' ? (
            <form className="form-grid" onSubmit={generateImage}>
              <label className="full">Nome do criativo<input value={imageForm.title} onChange={(e) => setImageForm({ ...imageForm, title: e.target.value })} /></label>
              <label className="full">Descreva a imagem<textarea value={imageForm.prompt} onChange={(e) => setImageForm({ ...imageForm, prompt: e.target.value })} required /></label>
              <label>Formato
                <select value={imageForm.format} onChange={(e) => setImageForm({ ...imageForm, format: e.target.value as ImageFormat })}>
                  <option value="square">Instagram Feed — 1:1</option>
                  <option value="story">Story/Reel — 9:16</option>
                  <option value="landscape">Facebook/LinkedIn — horizontal</option>
                  <option value="youtube">Thumbnail YouTube</option>
                </select>
              </label>
              <label>Estilo<input value={imageForm.style} onChange={(e) => setImageForm({ ...imageForm, style: e.target.value })} /></label>
              <Button className="full" disabled={loading}>{loading ? 'Gerando...' : 'Gerar imagem'}</Button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={generateCopy}>
              <label className="full">Nome do conteúdo<input value={copyForm.title} onChange={(e) => setCopyForm({ ...copyForm, title: e.target.value })} /></label>
              <label>Tipo
                <select value={copyForm.type} onChange={(e) => setCopyForm({ ...copyForm, type: e.target.value as CopyType })}>
                  <option value="caption">Legenda</option>
                  <option value="ad">Anúncio</option>
                  <option value="reel_script">Roteiro para Reel</option>
                  <option value="carousel">Carrossel</option>
                  <option value="email">E-mail</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </label>
              <label>Tom<input value={copyForm.tone} onChange={(e) => setCopyForm({ ...copyForm, tone: e.target.value })} /></label>
              <label className="full">Tema/problema<input value={copyForm.subject} onChange={(e) => setCopyForm({ ...copyForm, subject: e.target.value })} required /></label>
              <label>Público<input value={copyForm.audience} onChange={(e) => setCopyForm({ ...copyForm, audience: e.target.value })} /></label>
              <label>Objetivo/CTA<input value={copyForm.objective} onChange={(e) => setCopyForm({ ...copyForm, objective: e.target.value })} /></label>
              <label className="full">Oferta<input value={copyForm.offer} onChange={(e) => setCopyForm({ ...copyForm, offer: e.target.value })} /></label>
              <Button className="full" disabled={loading}>{loading ? 'Gerando...' : 'Gerar texto'}</Button>
            </form>
          )}
        </article>

        <article className="panel-card ai-preview">
          {!latest ? (
            <div className="empty-panel"><Sparkles size={38} /><strong>Sua criação aparecerá aqui</strong><span>Gere uma imagem ou texto para começar.</span></div>
          ) : latest.type === 'image' ? (
            <img src={latest.output} alt={latest.title} />
          ) : (
            <div className="generated-copy">
              <h2>{latest.title}</h2>
              <pre>{latest.output}</pre>
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(latest.output)}><Copy size={17} /> Copiar texto</Button>
            </div>
          )}
        </article>
      </section>

      <section className="panel-card library-panel">
        <div className="panel-header"><div><h2>Biblioteca de IA</h2><p>Histórico de imagens e textos.</p></div></div>
        <div className="asset-grid">
          {assets.map((asset) => (
            <article key={asset.id} className="asset-card">
              {asset.type === 'image' ? <img src={asset.output} alt={asset.title} /> : <div className="asset-copy">{asset.output.slice(0, 180)}…</div>}
              <div className="asset-footer">
                <div><strong>{asset.title}</strong><span>{new Date(asset.createdAt).toLocaleString('pt-BR')}</span></div>
                <button type="button" onClick={() => toggleFavorite(asset.id)} className={asset.favorite ? 'favorite active' : 'favorite'}><Heart size={17} /></button>
                <button type="button" onClick={() => deleteAsset(asset.id)} className="icon-danger"><Trash2 size={17} /></button>
              </div>
            </article>
          ))}
          {!assets.length && <div className="empty-inline">Nenhuma criação salva.</div>}
        </div>
      </section>
    </div>
  )
}
