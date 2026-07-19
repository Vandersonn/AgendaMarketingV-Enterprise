import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')

test('modelo do formulário centraliza valores padrão e validações', () => {
  const model = read('src/features/crm/leadFormModel.ts')
  assert.match(model, /export const emptyLeadForm/)
  assert.match(model, /export function validateLeadForm/)
  assert.match(model, /export function findDuplicateLead/)
  assert.match(model, /export function leadFormFromSubmit/)
})

test('formulário de Lead usa atualizações por patch e foco estável', () => {
  const form = read('src/features/crm/LeadFormModal.tsx')
  assert.match(form, /initialFocusSelector="input\[name='name'\]"/)
  assert.match(form, /onChange\(\{ name: event\.target\.value \}\)/)
  assert.match(form, /type="submit"/)
})

test('CRM usa componentes separados para formulário e Kanban', () => {
  const page = read('src/modules/crm/pages/CrmPage.tsx')
  assert.match(page, /<LeadFormModal/)
  assert.match(page, /<LeadKanbanBoard/)
  assert.doesNotMatch(page, /<section className="kanban-board">/)
})

test('Kanban encapsula pontuação, SLA e movimentação por etapa', () => {
  const kanban = read('src/features/crm/LeadKanbanBoard.tsx')
  assert.match(kanban, /calculateLeadScore/)
  assert.match(kanban, /getLeadSla/)
  assert.match(kanban, /onDropStage\(stage\.id\)/)
})
