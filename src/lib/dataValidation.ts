export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function isValidEmail(value: string) {
  if (!value.trim()) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim())
}

export function isValidBrazilianPhone(value: string) {
  if (!value.trim()) return true
  const digits = onlyDigits(value).replace(/^55/, '')
  return digits.length === 10 || digits.length === 11
}

function allDigitsEqual(value: string) {
  return /^(\d)\1+$/.test(value)
}

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11 || allDigitsEqual(cpf)) return false

  let sum = 0
  for (let index = 0; index < 9; index += 1) sum += Number(cpf[index]) * (10 - index)
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== Number(cpf[9])) return false

  sum = 0
  for (let index = 0; index < 10; index += 1) sum += Number(cpf[index]) * (11 - index)
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  return digit === Number(cpf[10])
}

export function isValidCnpj(value: string) {
  const cnpj = onlyDigits(value)
  if (cnpj.length !== 14 || allDigitsEqual(cnpj)) return false

  const calculate = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = cnpj.slice(0, length).split('').reduce((total, char, index) => total + Number(char) * weights[index], 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  return calculate(12) === Number(cnpj[12]) && calculate(13) === Number(cnpj[13])
}

export function isValidCpfOrCnpj(value: string) {
  if (!value.trim()) return true
  const digits = onlyDigits(value)
  return digits.length === 11 ? isValidCpf(digits) : digits.length === 14 ? isValidCnpj(digits) : false
}

export function samePersonKey(name: string, company: string) {
  return `${normalizeText(name)}|${normalizeText(company)}`
}
