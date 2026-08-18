export type DashboardMovement = {
  description: string
  createdAtUtc: string
  amount: number
}

export type Dashboard = {
  craftsmanId: string
  fullName: string
  level: string
  balance: number
  rewardValueTry: number
  pointsToNextLevel: number
  movements: DashboardMovement[]
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5028'

export async function getDemoDashboard(signal?: AbortSignal): Promise<Dashboard> {
  const response = await fetch(`${apiBaseUrl}/api/demo/dashboard`, { signal })
  if (!response.ok) {
    throw new Error(`Dashboard alınamadı: ${response.status}`)
  }

  return response.json() as Promise<Dashboard>
}

export type RedeemResult = {
  earnedPoints: number
  balance: number
  product: string
  redeemedAtUtc: string
}

export type WalletMovement = {
  id: string
  amount: number
  transactionType: number
  description: string
  createdAtUtc: string
}

export type Wallet = {
  id: string
  fullName: string
  level: number
  balance: number
  movements: WalletMovement[]
}

export async function getWallet(craftsmanId: string, signal?: AbortSignal): Promise<Wallet> {
  const response = await fetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/wallet`, { signal })
  if (!response.ok) {
    throw new Error('Puan cüzdanı alınamadı.')
  }

  return response.json() as Promise<Wallet>
}

export async function redeemProductCode(craftsmanId: string, code: string): Promise<RedeemResult> {
  const response = await fetch(`${apiBaseUrl}/api/product-codes/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ craftsmanId, code }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? 'Kod kullanılamadı. Lütfen tekrar deneyin.')
  }

  return response.json() as Promise<RedeemResult>
}
