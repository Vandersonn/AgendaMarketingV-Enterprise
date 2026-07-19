export type AiAssetType = 'image' | 'copy'
export type ImageFormat = 'square' | 'story' | 'landscape' | 'youtube'
export type CopyType = 'caption' | 'ad' | 'reel_script' | 'carousel' | 'email' | 'whatsapp'

export interface AiAsset {
  id: string
  type: AiAssetType
  title: string
  prompt: string
  output: string
  format?: ImageFormat
  copyType?: CopyType
  favorite: boolean
  createdAt: string
}

export interface MetricRecord {
  id: string
  source: string
  campaign: string
  period: string
  impressions: number
  clicks: number
  leads: number
  conversions: number
  spend: number
  revenue: number
  createdAt: string
}

export interface IntegrationConfig {
  imageEndpoint: string
  textEndpoint: string
  whatsappWebhook: string
  generalWebhook: string
  powerBiUrl: string
  canvaUrl: string
  facebookUrl: string
  instagramUrl: string
  metaBusinessUrl: string
  n8nWebhook: string
  makeWebhook: string
  supabaseUrl: string
  googleCalendarUrl: string
  gmailUrl: string
}
