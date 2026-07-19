import { supabase } from './supabase'
import { useAuthStore } from './authStore'
import { useSalesStore } from './salesStore'
import { useWorkspaceStore } from './workspaceStore'

let started=false
export async function initializeCloudSalesSync(){
  if(started||!supabase)return
  const user=useAuthStore.getState().user
  if(!user)return
  await useWorkspaceStore.getState().initialize(user.id)
  const orgId=useWorkspaceStore.getState().currentWorkspaceId
  if(!orgId)return
  const [{data:ops},{data:tasks}]=await Promise.all([
    supabase.from('sales_opportunities').select('*').eq('organization_id',orgId),
    supabase.from('sales_tasks').select('*').eq('organization_id',orgId)
  ])
  if((ops?.length??0)>0){
    useSalesStore.setState({opportunities:ops!.map((o:any)=>({id:o.id,title:o.title,contact:o.contact??'',company:o.company??'',email:o.email??'',phone:o.phone??'',value:Number(o.value),probability:o.probability,status:o.status,priority:o.priority,source:o.source??'',owner:o.owner_name??'',expectedClose:o.expected_close??'',nextStep:o.next_step??'',notes:o.notes??'',createdAt:o.created_at,updatedAt:o.updated_at}))})
  }
  if((tasks?.length??0)>0){useSalesStore.setState({tasks:tasks!.map((t:any)=>({id:t.id,opportunityId:t.opportunity_id??undefined,title:t.title,dueDate:t.due_date??'',completed:t.completed,priority:t.priority}))})}
  started=true
  let timer:number|undefined
  useSalesStore.subscribe(()=>{
    window.clearTimeout(timer)
    timer=window.setTimeout(async()=>{
      const state=useSalesStore.getState(); const uid=useAuthStore.getState().user?.id; const workspace=useWorkspaceStore.getState().currentWorkspaceId
      if(!uid||!workspace||!supabase)return
      await supabase.from('sales_opportunities').upsert(state.opportunities.map(o=>({id:o.id,organization_id:workspace,title:o.title,contact:o.contact,company:o.company,email:o.email,phone:o.phone,value:o.value,probability:o.probability,status:o.status,priority:o.priority,source:o.source,owner_name:o.owner,expected_close:o.expectedClose||null,next_step:o.nextStep,notes:o.notes,created_by:uid,created_at:o.createdAt,updated_at:o.updatedAt})))
      await supabase.from('sales_tasks').upsert(state.tasks.map(t=>({id:t.id,organization_id:workspace,opportunity_id:t.opportunityId||null,title:t.title,due_date:t.dueDate||null,completed:t.completed,priority:t.priority,created_by:uid})))
    },700)
  })
}
