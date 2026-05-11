const BASE_URL = (process.env.EVOLUTION_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

function headers() {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.EVOLUTION_API_KEY ?? '',
  }
}

export async function sendWhatsAppMessage(
  instance: string,
  phone: string,
  text: string,
): Promise<{ messageId: string | null; error?: string }> {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return { messageId: null, error: 'Telefone inválido.' }
  // Normaliza: se já começa com 55 e tem 12+ dígitos, usa como está; senão, prepend 55
  const number = digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`

  try {
    const res = await fetch(`${BASE_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        number,
        text,
        delay: 1200,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { messageId: null, error: `Evolution API ${res.status}: ${body}` }
    }

    const data = await res.json()
    return { messageId: data.key?.id ?? data.messageId ?? null }
  } catch (err) {
    return { messageId: null, error: String(err) }
  }
}

export async function getInstanceStatus(
  instance: string,
): Promise<'open' | 'close' | 'connecting' | 'unknown'> {
  try {
    const res = await fetch(`${BASE_URL}/instance/connectionState/${instance}`, {
      headers: headers(),
    })
    if (!res.ok) return 'unknown'
    const data = await res.json()
    return data.instance?.state ?? 'unknown'
  } catch {
    return 'unknown'
  }
}
