export type PendingRedemption = { requestId: string; craftsmanId: string; code: string; createdAtUtc: string }

const queueKey = 'usta-encrypted-redemption-queue'
const sessionKey = 'usta-redemption-session-key'

function bytesToBase64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)) }
function base64ToBytes(value: string) { return Uint8Array.from(atob(value), (character) => character.charCodeAt(0)) }

async function getKey() {
  let encoded = sessionStorage.getItem(sessionKey)
  if (!encoded) { encoded = bytesToBase64(crypto.getRandomValues(new Uint8Array(32))); sessionStorage.setItem(sessionKey, encoded) }
  return crypto.subtle.importKey('raw', base64ToBytes(encoded), 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function readQueue(): Promise<PendingRedemption[]> {
  const stored = localStorage.getItem(queueKey)
  if (!stored) return []
  try {
    const payload = JSON.parse(stored) as { iv: string; data: string }
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(payload.iv) }, await getKey(), base64ToBytes(payload.data))
    return JSON.parse(new TextDecoder().decode(decrypted)) as PendingRedemption[]
  } catch { localStorage.removeItem(queueKey); return [] }
}

async function writeQueue(items: PendingRedemption[]) {
  if (items.length === 0) { localStorage.removeItem(queueKey); return }
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await getKey(), new TextEncoder().encode(JSON.stringify(items)))
  localStorage.setItem(queueKey, JSON.stringify({ iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(encrypted)) }))
}

export async function enqueueRedemption(item: PendingRedemption) { const items = await readQueue(); if (!items.some((existing) => existing.requestId === item.requestId)) await writeQueue([...items, item].slice(-10)); return items.length + 1 }
export async function getPendingRedemptions(craftsmanId: string) { return (await readQueue()).filter((item) => item.craftsmanId === craftsmanId) }
export async function removePendingRedemption(requestId: string) { await writeQueue((await readQueue()).filter((item) => item.requestId !== requestId)) }
export function clearPendingRedemptions() { localStorage.removeItem(queueKey); sessionStorage.removeItem(sessionKey) }
