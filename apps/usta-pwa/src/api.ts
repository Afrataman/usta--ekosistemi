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

export type Reward = {
  id: string
  name: string
  description: string
  pointCost: number
  deliveryType: 'Digital' | 'DealerPickup'
  imageKey: string
  stockQuantity: number | null
  isAvailable: boolean
}

export async function getRewards(deliveryType?: Reward['deliveryType'], signal?: AbortSignal): Promise<Reward[]> {
  const query = deliveryType ? `?deliveryType=${deliveryType}` : ''
  const response = await fetch(`${apiBaseUrl}/api/rewards${query}`, { signal })
  if (!response.ok) {
    throw new Error('Ödül kataloğu alınamadı.')
  }

  return response.json() as Promise<Reward[]>
}

export type RewardRedemptionResult = {
  id: string
  reward: string
  pointsSpent: number
  fulfillmentCode: string
  deliveryType: Reward['deliveryType']
  balance: number
}

export type RewardRedemption = {
  id: string
  rewardName: string
  imageKey: string
  deliveryType: Reward['deliveryType']
  status: 'Created' | 'Fulfilled' | 'Cancelled'
  pointsSpent: number
  fulfillmentCode: string
  createdAtUtc: string
  fulfilledAtUtc: string | null
}

export type CraftsmanProfile = {
  id: string
  fullName: string
  phoneNumber: string
  city: string | null
  level: string
  campaignNotificationsEnabled: boolean
  smsNotificationsEnabled: boolean
  createdAtUtc: string
}

export type UpdateCraftsmanProfile = Pick<CraftsmanProfile,
  'fullName' | 'city' | 'campaignNotificationsEnabled' | 'smsNotificationsEnabled'>

export async function getCraftsmanProfile(craftsmanId: string, signal?: AbortSignal): Promise<CraftsmanProfile> {
  const response = await fetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/profile`, { signal })
  if (!response.ok) throw new Error('Profil alınamadı.')
  return response.json() as Promise<CraftsmanProfile>
}

export async function updateCraftsmanProfile(craftsmanId: string, profile: UpdateCraftsmanProfile): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/profile`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string; message?: string } | null
    throw new Error(body?.detail ?? body?.message ?? 'Profil kaydedilemedi.')
  }
}

export type Campaign = { id: string; title: string; summary: string; pointMultiplier: number; startsAtUtc: string; endsAtUtc: string }
export type SupportItem = { id: string; category: string; subject: string; description: string; status: string; createdAtUtc: string; resolvedAtUtc: string | null }

export async function getCampaigns(signal?: AbortSignal): Promise<Campaign[]> {
  const response = await fetch(`${apiBaseUrl}/api/campaigns`, { signal })
  if (!response.ok) throw new Error('Kampanyalar alınamadı.')
  return response.json() as Promise<Campaign[]>
}

export async function getSupportRequests(craftsmanId: string, signal?: AbortSignal): Promise<SupportItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/support-requests`, { signal })
  if (!response.ok) throw new Error('Destek talepleri alınamadı.')
  return response.json() as Promise<SupportItem[]>
}

export async function createSupportRequest(craftsmanId: string, request: { category: string; subject: string; description: string }): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/support-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) })
  if (!response.ok) throw new Error('Destek talebi oluşturulamadı.')
}

export async function getRewardRedemptions(craftsmanId: string, signal?: AbortSignal): Promise<RewardRedemption[]> {
  const response = await fetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/reward-redemptions`, { signal })
  if (!response.ok) {
    throw new Error('Kuponlar alınamadı.')
  }

  return response.json() as Promise<RewardRedemption[]>
}

export async function redeemReward(rewardId: string, craftsmanId: string): Promise<RewardRedemptionResult> {
  const response = await fetch(`${apiBaseUrl}/api/rewards/${rewardId}/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ craftsmanId }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? 'Ödül alınamadı.')
  }

  return response.json() as Promise<RewardRedemptionResult>
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
