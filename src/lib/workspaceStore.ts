import { create } from 'zustand'
import { supabase, supabaseConfigured } from './supabase'
import { loadLocal, saveLocal } from './storage'
import type { TeamRole } from './teamStore'

export interface CloudWorkspace { id:string; name:string; role:TeamRole }
interface WorkspaceState {
  loading:boolean; cloudEnabled:boolean; workspaces:CloudWorkspace[]; currentWorkspaceId:string;
  initialize:(userId:string)=>Promise<void>; createWorkspace:(name:string,userId:string)=>Promise<string|null>; setCurrent:(id:string)=>void;
}
const savedId=loadLocal('cloud_workspace_id','')
export const useWorkspaceStore=create<WorkspaceState>((set,get)=>({
  loading:false, cloudEnabled:supabaseConfigured, workspaces:[], currentWorkspaceId:savedId,
  initialize:async(userId)=>{
    if(!supabase){set({loading:false,cloudEnabled:false});return}
    set({loading:true})
    const {data,error}=await supabase.from('organization_members').select('role,organizations(id,name)').eq('user_id',userId).eq('active',true)
    if(error){console.error(error);set({loading:false});return}
    const workspaces=(data??[]).flatMap((row:any)=>row.organizations?[{id:row.organizations.id,name:row.organizations.name,role:row.role as TeamRole}]:[])
    const currentWorkspaceId=workspaces.some(w=>w.id===get().currentWorkspaceId)?get().currentWorkspaceId:(workspaces[0]?.id??'')
    saveLocal('cloud_workspace_id',currentWorkspaceId)
    set({workspaces,currentWorkspaceId,loading:false,cloudEnabled:true})
  },
  createWorkspace:async(name,userId)=>{
    if(!supabase)return 'Supabase não configurado.'
    const {data,error}=await supabase.from('organizations').insert({name,created_by:userId}).select('id,name').single()
    if(error)return error.message
    const member=await supabase.from('organization_members').insert({organization_id:data.id,user_id:userId,role:'owner'})
    if(member.error)return member.error.message
    await get().initialize(userId); get().setCurrent(data.id); return null
  },
  setCurrent:(id)=>{saveLocal('cloud_workspace_id',id);set({currentWorkspaceId:id})}
}))
