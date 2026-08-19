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

export async function getCraftsmanDashboard(craftsmanId: string, signal?: AbortSignal): Promise<Dashboard> {
  const response = await fetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/dashboard`, { signal })
  if (!response.ok) throw new Error('Dashboard alınamadı.')
  return response.json() as Promise<Dashboard>
}

export type OtpChallenge = { id: string; expiresInSeconds: number; developmentCode: string | null }
export async function requestOtpCode(phoneNumber: string): Promise<OtpChallenge> {
  const response = await fetch(`${apiBaseUrl}/api/auth/request-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneNumber }) })
  const body = await response.json() as OtpChallenge & { message?: string }
  if (!response.ok) throw new Error(body.message ?? 'Kod gönderilemedi.')
  return body
}

export async function verifyOtpCode(challengeId: string, code: string): Promise<{ craftsmanId: string; fullName: string; needsProfile: boolean }> {
  const response = await fetch(`${apiBaseUrl}/api/auth/verify-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId, code }) })
  const body = await response.json() as { craftsmanId: string; fullName: string; needsProfile: boolean; message?: string }
  if (!response.ok) throw new Error(body.message ?? 'Kod doğrulanamadı.')
  return body
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

export type DealerCoupon = { id: string; fulfillmentCode: string; reward: string; craftsman: string; status: 'Created' | 'Fulfilled' | 'Cancelled'; expiresAtUtc: string | null; fulfilledAtUtc: string | null; fulfilledByDealerEmployeeId: string | null; alreadyProcessed: boolean }
const demoDealerEmployeeId = '77777777-7777-7777-7777-777777777772'

export async function verifyDealerCoupon(code: string): Promise<DealerCoupon> {
  const response = await fetch(`${apiBaseUrl}/api/dealer/coupons/${encodeURIComponent(code)}?dealerEmployeeId=${demoDealerEmployeeId}`)
  const body = await response.json() as DealerCoupon & { message?: string }
  if (!response.ok) throw new Error(body.message ?? 'Kupon doğrulanamadı.')
  return body
}

export async function fulfillDealerCoupon(code: string): Promise<DealerCoupon> {
  const response = await fetch(`${apiBaseUrl}/api/dealer/coupons/${encodeURIComponent(code)}/fulfill`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dealerEmployeeId: demoDealerEmployeeId }) })
  const body = await response.json() as DealerCoupon & { message?: string }
  if (!response.ok) throw new Error(body.message ?? 'Teslim onaylanamadı.')
  return body
}

export type ProductReturnResult = { alreadyProcessed: boolean; reversedPoints: number; balance?: number; product?: string; returnedAtUtc: string; returnReason?: string }
export async function returnDealerProduct(code: string, reason: string): Promise<ProductReturnResult> {
  const response = await fetch(`${apiBaseUrl}/api/product-codes/return`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dealerEmployeeId: demoDealerEmployeeId, code, reason }) })
  const body = await response.json() as ProductReturnResult & { message?: string; detail?: string }
  if (!response.ok) throw new Error(body.message ?? body.detail ?? 'İade işlemi tamamlanamadı.')
  return body
}

export async function reportDealerRisk(request: { referenceType: string; referenceValue: string; reason: string; description: string }): Promise<{ id: string; status: string; createdAtUtc: string }> {
  const response = await fetch(`${apiBaseUrl}/api/dealer/risk-cases`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dealerEmployeeId: demoDealerEmployeeId, ...request }) })
  const body = await response.json() as { id: string; status: string; createdAtUtc: string; message?: string; detail?: string }
  if (!response.ok) throw new Error(body.message ?? body.detail ?? 'Şüpheli işlem bildirilemedi.')
  return body
}

export type AdminOverview = { craftsmen: number; dealers: number; activeCoupons: number; openRiskCases: number }
export type AdminRiskCase = { id: string; referenceType: string; referenceValue: string; reason: string; description: string; status: 'Open' | 'InReview' | 'Resolved' | 'Rejected'; createdAtUtc: string; reviewedAtUtc: string | null; dealerEmployee: string; dealer: string }
export async function getAdminOverview(): Promise<AdminOverview> { const response = await fetch(`${apiBaseUrl}/api/admin/overview`); if (!response.ok) throw new Error('Yönetici özeti alınamadı.'); return response.json() as Promise<AdminOverview> }
export async function getAdminRiskCases(): Promise<AdminRiskCase[]> { const response = await fetch(`${apiBaseUrl}/api/admin/risk-cases`); if (!response.ok) throw new Error('Risk kayıtları alınamadı.'); return response.json() as Promise<AdminRiskCase[]> }
export async function updateAdminRiskStatus(id: string, status: 'InReview' | 'Resolved' | 'Rejected'): Promise<void> { const response = await fetch(`${apiBaseUrl}/api/admin/risk-cases/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); if (!response.ok) throw new Error('Vaka durumu güncellenemedi.') }
export type AdminCraftsman = { id: string; fullName: string; phoneNumber: string; city: string | null; level: string; isActive: boolean; createdAtUtc: string; balance: number }
export type AdminDealer = { id: string; code: string; name: string; isActive: boolean; activeEmployees: number; totalEmployees: number }
export async function getAdminCraftsmen(): Promise<AdminCraftsman[]> { const response = await fetch(`${apiBaseUrl}/api/admin/craftsmen`); if (!response.ok) throw new Error('Ustalar alınamadı.'); return response.json() as Promise<AdminCraftsman[]> }
export async function getAdminDealers(): Promise<AdminDealer[]> { const response = await fetch(`${apiBaseUrl}/api/admin/dealers`); if (!response.ok) throw new Error('Bayiler alınamadı.'); return response.json() as Promise<AdminDealer[]> }
export async function setAdminEntityActive(kind: 'craftsmen' | 'dealers', id: string, isActive: boolean): Promise<void> { const response = await fetch(`${apiBaseUrl}/api/admin/${kind}/${id}/active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) }); if (!response.ok) throw new Error('Durum güncellenemedi.') }
export type AdminCampaign = Campaign & { isActive: boolean; displayOrder: number }
export async function getAdminCampaigns(): Promise<AdminCampaign[]> { const response = await fetch(`${apiBaseUrl}/api/admin/campaigns`); if (!response.ok) throw new Error('Kampanyalar alınamadı.'); return response.json() as Promise<AdminCampaign[]> }
export async function createAdminCampaign(request: Omit<AdminCampaign, 'id'>): Promise<void> { const response = await fetch(`${apiBaseUrl}/api/admin/campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }); if (!response.ok) { const body = await response.json().catch(() => null) as { detail?: string } | null; throw new Error(body?.detail ?? 'Kampanya oluşturulamadı.') } }
export async function setAdminCampaignActive(id: string, isActive: boolean): Promise<void> { const response = await fetch(`${apiBaseUrl}/api/admin/campaigns/${id}/active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) }); if (!response.ok) throw new Error('Kampanya durumu güncellenemedi.') }
