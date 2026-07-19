import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface WhiteLabelSettings {
  productName:string
  companyName:string
  tagline:string
  logoUrl:string
  primaryColor:string
  supportEmail:string
  customDomain:string
  hideVendorBrand:boolean
}

const defaults:WhiteLabelSettings={
  productName:'AgendaMarketingV', companyName:'DEVVANDERSONAPPS', tagline:'Gestão empresarial inteligente', logoUrl:'./icon.png', primaryColor:'#7c3aed', supportEmail:'', customDomain:'', hideVendorBrand:false
}
const initial=loadLocal<WhiteLabelSettings>('white_label_settings',defaults)
interface State{settings:WhiteLabelSettings;update:(patch:Partial<WhiteLabelSettings>)=>void;reset:()=>void}
export const useWhiteLabelStore=create<State>((set)=>({
  settings:initial,
  update:(patch)=>set((state)=>{const settings={...state.settings,...patch};saveLocal('white_label_settings',settings);return{settings}}),
  reset:()=>{saveLocal('white_label_settings',defaults);set({settings:defaults})}
}))
