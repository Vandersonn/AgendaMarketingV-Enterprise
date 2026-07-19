declare const XLSX: {
  read: (data: ArrayBuffer, options: Record<string, unknown>) => { SheetNames: string[]; Sheets: Record<string, unknown> }
  utils: { sheet_to_json: <T>(sheet: unknown, options: Record<string, unknown>) => T[] }
}

export type ImportedLead = {
  name: string
  city: string
  state: string
  cpf: string
  phone: string
  whatsapp: string
  email: string
  sourceRow: number
  warnings: string[]
}

export type LeadImportResult = {
  sheetName: string
  totalRows: number
  validRows: number
  skippedRows: number
  leads: ImportedLead[]
  detectedColumns: Record<string, string>
}

const aliases: Record<keyof Omit<ImportedLead, 'sourceRow' | 'warnings'>, string[]> = {
  name: ['nome', 'nome completo', 'cliente', 'lead', 'contato', 'pessoa', 'razao social', 'responsavel'],
  city: ['cidade', 'municipio', 'localidade', 'cidade residencial', 'cidade cliente'],
  state: ['estado', 'uf', 'sigla estado', 'estado residencial'],
  cpf: ['cpf', 'cpf cliente', 'documento', 'documento cpf', 'cadastro pessoa fisica'],
  phone: ['telefone', 'fone', 'telefone fixo', 'contato telefone', 'tel'],
  whatsapp: ['whatsapp', 'whats', 'zap', 'celular', 'telefone celular', 'mobile'],
  email: ['email', 'e-mail', 'mail', 'correio eletronico', 'email cliente']
}

const normalizeHeader = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const digits = (value: unknown) => String(value ?? '').replace(/\D/g, '')
const clean = (value: unknown) => String(value ?? '').trim()
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const looksLikeCpf = (value: string) => digits(value).length === 11
const looksLikePhone = (value: string) => {
  const size = digits(value).length
  return size >= 8 && size <= 13
}
const looksLikeState = (value: string) => /^[A-Za-z]{2}$/.test(value.trim())

function scoreColumn(values: string[], field: keyof typeof aliases) {
  const nonEmpty = values.filter(Boolean)
  if (!nonEmpty.length) return 0
  const sample = nonEmpty.slice(0, 25)
  if (field === 'email') return sample.filter(looksLikeEmail).length / sample.length
  if (field === 'cpf') return sample.filter(looksLikeCpf).length / sample.length
  if (field === 'phone' || field === 'whatsapp') return sample.filter(looksLikePhone).length / sample.length
  if (field === 'state') return sample.filter(looksLikeState).length / sample.length
  if (field === 'name') return sample.filter((item) => /[A-Za-zÀ-ÿ]{2,}\s+[A-Za-zÀ-ÿ]{2,}/.test(item) && !looksLikeEmail(item)).length / sample.length
  if (field === 'city') return sample.filter((item) => /[A-Za-zÀ-ÿ]{3,}/.test(item) && !looksLikeEmail(item) && !looksLikePhone(item)).length / sample.length
  return 0
}

function detectHeaderRow(rows: unknown[][]) {
  let bestIndex = 0
  let bestScore = -1
  rows.slice(0, 12).forEach((row, index) => {
    const normalized = row.map(normalizeHeader)
    const score = normalized.reduce((sum, header) => sum + (Object.values(aliases).flat().some((alias) => header === normalizeHeader(alias) || header.includes(normalizeHeader(alias))) ? 1 : 0), 0)
    if (score > bestScore) {
      bestIndex = index
      bestScore = score
    }
  })
  return bestIndex
}

function mapColumns(headers: string[], rows: string[][]) {
  const map: Partial<Record<keyof typeof aliases, number>> = {}
  const used = new Set<number>()

  ;(Object.keys(aliases) as Array<keyof typeof aliases>).forEach((field) => {
    const index = headers.findIndex((header, columnIndex) => !used.has(columnIndex) && aliases[field].some((alias) => {
      const normalizedAlias = normalizeHeader(alias)
      return header === normalizedAlias || header.includes(normalizedAlias)
    }))
    if (index >= 0) {
      map[field] = index
      used.add(index)
    }
  })

  ;(Object.keys(aliases) as Array<keyof typeof aliases>).forEach((field) => {
    if (map[field] !== undefined) return
    let bestIndex = -1
    let bestScore = field === 'city' || field === 'name' ? 0.55 : 0.7
    headers.forEach((_, columnIndex) => {
      if (used.has(columnIndex)) return
      const values = rows.map((row) => clean(row[columnIndex]))
      const score = scoreColumn(values, field)
      if (score > bestScore) {
        bestScore = score
        bestIndex = columnIndex
      }
    })
    if (bestIndex >= 0) {
      map[field] = bestIndex
      used.add(bestIndex)
    }
  })

  return map
}

function formatCpf(value: string) {
  const valueDigits = digits(value).slice(0, 11)
  if (valueDigits.length !== 11) return clean(value)
  return valueDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatPhone(value: string) {
  const valueDigits = digits(value)
  if (valueDigits.length === 11) return valueDigits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (valueDigits.length === 10) return valueDigits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return clean(value)
}

export async function parseLeadSpreadsheet(file: File): Promise<LeadImportResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('A planilha não contém abas válidas.')

  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false })
  const rows = rawRows.map((row) => Array.isArray(row) ? row : [])
  if (!rows.length) throw new Error('A planilha está vazia.')

  const headerRow = detectHeaderRow(rows)
  const headers = rows[headerRow].map(normalizeHeader)
  const dataRows = rows.slice(headerRow + 1).map((row) => row.map(clean))
  const columnMap = mapColumns(headers, dataRows)

  const detectedColumns: Record<string, string> = {}
  Object.entries(columnMap).forEach(([field, index]) => {
    if (typeof index === 'number') detectedColumns[field] = clean(rows[headerRow][index]) || `Coluna ${index + 1}`
  })

  const leads: ImportedLead[] = []
  let skippedRows = 0

  dataRows.forEach((row, index) => {
    if (!row.some(Boolean)) return
    const get = (field: keyof typeof aliases) => {
      const columnIndex = columnMap[field]
      return columnIndex === undefined ? '' : clean(row[columnIndex])
    }

    const name = get('name')
    const email = get('email').toLowerCase()
    const phone = formatPhone(get('phone'))
    const whatsapp = formatPhone(get('whatsapp'))
    const cpf = formatCpf(get('cpf'))
    const warnings: string[] = []

    if (!name && !email && !phone && !whatsapp && !cpf) {
      skippedRows += 1
      return
    }
    if (!name) warnings.push('Nome não identificado')
    if (email && !looksLikeEmail(email)) warnings.push('E-mail possivelmente inválido')
    if (cpf && !looksLikeCpf(cpf)) warnings.push('CPF possivelmente inválido')

    leads.push({
      name: name || email || whatsapp || phone || `Lead da linha ${headerRow + index + 2}`,
      city: get('city'),
      state: get('state').toUpperCase().slice(0, 2),
      cpf,
      phone,
      whatsapp: whatsapp || phone,
      email,
      sourceRow: headerRow + index + 2,
      warnings
    })
  })

  return {
    sheetName,
    totalRows: dataRows.filter((row) => row.some(Boolean)).length,
    validRows: leads.length,
    skippedRows,
    leads,
    detectedColumns
  }
}
