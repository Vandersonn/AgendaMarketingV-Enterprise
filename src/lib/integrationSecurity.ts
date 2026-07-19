const blockedHostnames = new Set(['localhost', '0.0.0.0', '127.0.0.1', '::1', '[::1]'])

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
}

export function validatePublicHttpsUrl(value: string): string {
  const parsed = new URL(value.trim())
  const hostname = parsed.hostname.toLowerCase()
  if (parsed.protocol !== 'https:') throw new Error('Use um endereço HTTPS.')
  if (parsed.username || parsed.password) throw new Error('Não inclua usuário ou senha na URL.')
  if (blockedHostnames.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.localhost') || isPrivateIpv4(hostname)) {
    throw new Error('Endereços locais ou de rede privada não são permitidos.')
  }
  return parsed.toString()
}

export function isPublicHttpsUrl(value: string): boolean {
  try {
    validatePublicHttpsUrl(value)
    return true
  } catch {
    return false
  }
}
