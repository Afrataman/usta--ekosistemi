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
  updatedAtUtc: string
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5028'
const craftsmanHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('usta-token') ?? ''}` })
const craftsmanFetch = (input: RequestInfo | URL, init: RequestInit = {}) => fetch(input, { ...init, headers: { ...craftsmanHeaders(), ...(init.headers as Record<string, string> | undefined) } })
const adminHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('admin-token') ?? ''}` })
const adminFetch = (input: RequestInfo | URL, init: RequestInit = {}) => fetch(input, { ...init, headers: { ...adminHeaders(), ...(init.headers as Record<string, string> | undefined) } })
export type AdminLoginResult = { token: string; expiresAtUtc: string; user: string; role: string }
export async function loginAdmin(userName: string, password: string): Promise<AdminLoginResult> { const response = await fetch(`${apiBaseUrl}/api/admin/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName, password }) }); const body = await response.json() as AdminLoginResult & { message?: string }; if (!response.ok) throw new Error(body.message ?? 'Yönetici girişi başarısız.'); return body }
export async function logoutAdmin(): Promise<void> { await fetch(`${apiBaseUrl}/api/admin/auth/logout`, { method: 'POST', headers: adminHeaders() }); sessionStorage.removeItem('admin-token'); sessionStorage.removeItem('admin-profile') }

export async function getDemoDashboard(signal?: AbortSignal): Promise<Dashboard> {
  const response = await fetch(`${apiBaseUrl}/api/demo/dashboard`, { signal })
  if (!response.ok) {
    throw new Error(`Dashboard alınamadı: ${response.status}`)
  }

  return response.json() as Promise<Dashboard>
}

export async function getCraftsmanDashboard(craftsmanId: string, signal?: AbortSignal): Promise<Dashboard> {
  const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/dashboard`, { signal })
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

export type CraftsmanLoginResult = { craftsmanId: string; fullName: string; needsProfile: boolean; token: string; expiresAtUtc: string }
export async function verifyOtpCode(challengeId: string, code: string): Promise<CraftsmanLoginResult> {
  const response = await fetch(`${apiBaseUrl}/api/auth/verify-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId, code }) })
  const body = await response.json() as CraftsmanLoginResult & { message?: string }
  if (!response.ok) throw new Error(body.message ?? 'Kod doğrulanamadı.')
  return body
}

export async function logoutCraftsman(): Promise<void> { await fetch(`${apiBaseUrl}/api/auth/logout`, { method: 'POST', headers: craftsmanHeaders() }) }

export type RedeemResult = {
  alreadyProcessed: boolean
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
  const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/profile`, { signal })
  if (!response.ok) throw new Error('Profil alınamadı.')
  return response.json() as Promise<CraftsmanProfile>
}

export async function updateCraftsmanProfile(craftsmanId: string, profile: UpdateCraftsmanProfile): Promise<void> {
  const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/profile`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string; message?: string } | null
    throw new Error(body?.detail ?? body?.message ?? 'Profil kaydedilemedi.')
  }
}

export type Campaign = { id: string; title: string; summary: string; pointMultiplier: number; startsAtUtc: string; endsAtUtc: string }
export type CraftsmanNotification = { id: string; type: string; title: string; message: string; referenceType: string | null; referenceId: string | null; createdAtUtc: string; readAtUtc: string | null }
export type NotificationInbox = { unreadCount: number; items: CraftsmanNotification[] }
export type SupportItem = { id: string; category: string; subject: string; description: string; status: string; createdAtUtc: string; resolvedAtUtc: string | null }

export async function getCampaigns(signal?: AbortSignal): Promise<Campaign[]> {
  const response = await fetch(`${apiBaseUrl}/api/campaigns`, { signal })
  if (!response.ok) throw new Error('Kampanyalar alınamadı.')
  return response.json() as Promise<Campaign[]>
}

export async function getNotifications(craftsmanId: string, signal?: AbortSignal): Promise<NotificationInbox> {
  const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/notifications`, { signal })
  if (!response.ok) throw new Error('Bildirimler alınamadı.')
  return response.json() as Promise<NotificationInbox>
}

export async function markNotificationRead(craftsmanId: string, notificationId: string): Promise<void> {
  const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/notifications/${notificationId}/read`, { method: 'POST' })
  if (!response.ok) throw new Error('Bildirim güncellenemedi.')
}

export async function markAllNotificationsRead(craftsmanId: string): Promise<void> {
  const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/notifications/read-all`, { method: 'POST' })
  if (!response.ok) throw new Error('Bildirimler güncellenemedi.')
}

export async function getSupportRequests(craftsmanId: string, signal?: AbortSignal): Promise<SupportItem[]> {
  const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/support-requests`, { signal })
  if (!response.ok) throw new Error('Destek talepleri alınamadı.')
  return response.json() as Promise<SupportItem[]>
}

export async function createSupportRequest(craftsmanId: string, request: { category: string; subject: string; description: string }): Promise<void> {
  const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/support-requests`, { method: 'POST', body: JSON.stringify(request) })
  if (!response.ok) throw new Error('Destek talebi oluşturulamadı.')
}

export async function getRewardRedemptions(craftsmanId: string, signal?: AbortSignal): Promise<RewardRedemption[]> {
  const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/reward-redemptions`, { signal })
  if (!response.ok) {
    throw new Error('Kuponlar alınamadı.')
  }

  return response.json() as Promise<RewardRedemption[]>
}

export async function redeemReward(rewardId: string, craftsmanId: string): Promise<RewardRedemptionResult> {
  const response = await craftsmanFetch(`${apiBaseUrl}/api/rewards/${rewardId}/redeem`, {
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
  const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/wallet`, { signal })
  if (!response.ok) {
    throw new Error('Puan cüzdanı alınamadı.')
  }

  return response.json() as Promise<Wallet>
}

export async function redeemProductCode(craftsmanId: string, code: string, requestId: string): Promise<RedeemResult> {
  const response = await craftsmanFetch(`${apiBaseUrl}/api/product-codes/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ craftsmanId, code, requestId }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? 'Kod kullanılamadı. Lütfen tekrar deneyin.')
  }

  return response.json() as Promise<RedeemResult>
}

export type DealerCoupon = { id: string; fulfillmentCode: string; reward: string; craftsman: string; status: 'Created' | 'Fulfilled' | 'Cancelled'; expiresAtUtc: string | null; fulfilledAtUtc: string | null; fulfilledByDealerEmployeeId: string | null; alreadyProcessed: boolean }
const dealerHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('dealer-token') ?? ''}` })
export type DealerLoginResult = { token: string; expiresAtUtc: string; employee: string; dealer: string }
export async function loginDealer(dealerCode: string, pin: string): Promise<DealerLoginResult> { const response = await fetch(`${apiBaseUrl}/api/dealer/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dealerCode, pin }) }); const body = await response.json() as DealerLoginResult & { message?: string }; if (!response.ok) throw new Error(body.message ?? 'Bayi girişi başarısız.'); return body }
export async function logoutDealer(): Promise<void> { await fetch(`${apiBaseUrl}/api/dealer/auth/logout`, { method: 'POST', headers: dealerHeaders() }); sessionStorage.removeItem('dealer-token'); sessionStorage.removeItem('dealer-profile') }

export async function verifyDealerCoupon(code: string): Promise<DealerCoupon> {
  const response = await fetch(`${apiBaseUrl}/api/dealer/coupons/${encodeURIComponent(code)}`, { headers: dealerHeaders() })
  const body = await response.json() as DealerCoupon & { message?: string }
  if (!response.ok) throw new Error(body.message ?? 'Kupon doğrulanamadı.')
  return body
}

export async function fulfillDealerCoupon(code: string): Promise<DealerCoupon> {
  const response = await fetch(`${apiBaseUrl}/api/dealer/coupons/${encodeURIComponent(code)}/fulfill`, { method: 'POST', headers: dealerHeaders() })
  const body = await response.json() as DealerCoupon & { message?: string }
  if (!response.ok) throw new Error(body.message ?? 'Teslim onaylanamadı.')
  return body
}

export type ProductReturnResult = { alreadyProcessed: boolean; reversedPoints: number; balance?: number; product?: string; returnedAtUtc: string; returnReason?: string }
export async function returnDealerProduct(code: string, reason: string): Promise<ProductReturnResult> {
  const response = await fetch(`${apiBaseUrl}/api/product-codes/return`, { method: 'POST', headers: dealerHeaders(), body: JSON.stringify({ code, reason }) })
  const body = await response.json() as ProductReturnResult & { message?: string; detail?: string }
  if (!response.ok) throw new Error(body.message ?? body.detail ?? 'İade işlemi tamamlanamadı.')
  return body
}

export async function reportDealerRisk(request: { referenceType: string; referenceValue: string; reason: string; description: string }): Promise<{ id: string; status: string; createdAtUtc: string }> {
  const response = await fetch(`${apiBaseUrl}/api/dealer/risk-cases`, { method: 'POST', headers: dealerHeaders(), body: JSON.stringify(request) })
  const body = await response.json() as { id: string; status: string; createdAtUtc: string; message?: string; detail?: string }
  if (!response.ok) throw new Error(body.message ?? body.detail ?? 'Şüpheli işlem bildirilemedi.')
  return body
}
export type MembershipPassResult = { token: string; expiresAtUtc: string }
export async function createMembershipPass(craftsmanId: string): Promise<MembershipPassResult> { const response = await craftsmanFetch(`${apiBaseUrl}/api/craftsmen/${craftsmanId}/membership-pass`, { method: 'POST' }); if (!response.ok) throw new Error('Üyelik QR’ı oluşturulamadı.'); return response.json() as Promise<MembershipPassResult> }
export type VerifiedMembership = { id: string; expiresAtUtc: string; craftsman: string; level: string }
export async function verifyMembershipPass(token: string): Promise<VerifiedMembership> { const response = await fetch(`${apiBaseUrl}/api/dealer/membership-passes/${encodeURIComponent(token)}`, { headers: dealerHeaders() }); const body = await response.json() as VerifiedMembership & { message?: string }; if (!response.ok) throw new Error(body.message ?? 'Üyelik QR’ı doğrulanamadı.'); return body }
export type DealerSaleResult = { id: string; saleReference: string; totalAmount: number; craftsman: string; createdAtUtc: string }
export async function createDealerSale(membershipToken: string, saleReference: string, totalAmount: number): Promise<DealerSaleResult> { const response = await fetch(`${apiBaseUrl}/api/dealer/sales`, { method: 'POST', headers: dealerHeaders(), body: JSON.stringify({ membershipToken, saleReference, totalAmount }) }); const body = await response.json() as DealerSaleResult & { message?: string; detail?: string }; if (!response.ok) throw new Error(body.message ?? body.detail ?? 'Satış eşleştirilemedi.'); return body }

export type AdminOverview = { craftsmen: number; dealers: number; activeCoupons: number; openRiskCases: number }
export type AdminRiskCase = { id: string; referenceType: string; referenceValue: string; reason: string; description: string; status: 'Open' | 'InReview' | 'Resolved' | 'Rejected'; createdAtUtc: string; reviewedAtUtc: string | null; dealerEmployee: string; dealer: string }
export async function getAdminOverview(): Promise<AdminOverview> { const response = await adminFetch(`${apiBaseUrl}/api/admin/overview`); if (!response.ok) throw new Error('Yönetici özeti alınamadı.'); return response.json() as Promise<AdminOverview> }
export async function getAdminRiskCases(): Promise<AdminRiskCase[]> { const response = await adminFetch(`${apiBaseUrl}/api/admin/risk-cases`); if (!response.ok) throw new Error('Risk kayıtları alınamadı.'); return response.json() as Promise<AdminRiskCase[]> }
export async function updateAdminRiskStatus(id: string, status: 'InReview' | 'Resolved' | 'Rejected'): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/risk-cases/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); if (!response.ok) throw new Error('Vaka durumu güncellenemedi.') }
export type AdminCraftsman = { id: string; fullName: string; phoneNumber: string; city: string | null; level: string; isActive: boolean; createdAtUtc: string; balance: number }
export type AdminDealer = { id: string; code: string; name: string; isActive: boolean; activeEmployees: number; totalEmployees: number }
export async function getAdminCraftsmen(): Promise<AdminCraftsman[]> { const response = await adminFetch(`${apiBaseUrl}/api/admin/craftsmen`); if (!response.ok) throw new Error('Ustalar alınamadı.'); return response.json() as Promise<AdminCraftsman[]> }
export async function getAdminDealers(): Promise<AdminDealer[]> { const response = await adminFetch(`${apiBaseUrl}/api/admin/dealers`); if (!response.ok) throw new Error('Bayiler alınamadı.'); return response.json() as Promise<AdminDealer[]> }
export async function setAdminEntityActive(kind: 'craftsmen' | 'dealers', id: string, isActive: boolean): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/${kind}/${id}/active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) }); if (!response.ok) throw new Error('Durum güncellenemedi.') }
export type AdminCampaign = Campaign & { isActive: boolean; displayOrder: number }
export async function getAdminCampaigns(): Promise<AdminCampaign[]> { const response = await adminFetch(`${apiBaseUrl}/api/admin/campaigns`); if (!response.ok) throw new Error('Kampanyalar alınamadı.'); return response.json() as Promise<AdminCampaign[]> }
export async function createAdminCampaign(request: Omit<AdminCampaign, 'id'>): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }); if (!response.ok) { const body = await response.json().catch(() => null) as { detail?: string } | null; throw new Error(body?.detail ?? 'Kampanya oluşturulamadı.') } }
export async function setAdminCampaignActive(id: string, isActive: boolean): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/campaigns/${id}/active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) }); if (!response.ok) throw new Error('Kampanya durumu güncellenemedi.') }
export type AdminReward = Reward & { isActive: boolean; displayOrder: number; createdAtUtc: string }
export async function getAdminRewards(): Promise<AdminReward[]> { const response = await adminFetch(`${apiBaseUrl}/api/admin/rewards`); if (!response.ok) throw new Error('Ödüller alınamadı.'); return response.json() as Promise<AdminReward[]> }
export async function createAdminReward(request: Omit<AdminReward, 'id' | 'createdAtUtc' | 'isAvailable'>): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/rewards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }); if (!response.ok) { const body = await response.json().catch(() => null) as { detail?: string } | null; throw new Error(body?.detail ?? 'Ödül oluşturulamadı.') } }
export async function updateAdminReward(reward: AdminReward): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/rewards/${reward.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reward) }); if (!response.ok) throw new Error('Ödül güncellenemedi.') }
export type AdminProduct = { id: string; sku: string; name: string; basePoints: number; isActive: boolean; createdAtUtc: string; totalCodes: number; availableCodes: number; redeemedCodes: number; returnedCodes: number }
export async function getAdminProducts(): Promise<AdminProduct[]> { const response = await adminFetch(`${apiBaseUrl}/api/admin/products`); if (!response.ok) throw new Error('Ürünler alınamadı.'); return response.json() as Promise<AdminProduct[]> }
export async function createAdminProduct(request: { sku: string; name: string; basePoints: number }): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }); if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string; detail?: string } | null; throw new Error(body?.message ?? body?.detail ?? 'Ürün eklenemedi.') } }
export async function generateAdminProductCodes(id: string, count: number): Promise<{ codes: string[]; warning: string }> { const response = await adminFetch(`${apiBaseUrl}/api/admin/products/${id}/generate-codes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count }) }); const body = await response.json() as { codes: string[]; warning: string; detail?: string }; if (!response.ok) throw new Error(body.detail ?? 'Kodlar üretilemedi.'); return body }
export type LoyaltyRuleAudit = { id: string; silverThreshold: number; goldThreshold: number; pointsPerRewardTry: number; changeNote: string; createdAtUtc: string }
export type LoyaltyRules = { silverThreshold: number; goldThreshold: number; pointsPerRewardTry: number; updatedAtUtc: string; history: LoyaltyRuleAudit[] }
export async function getAdminLoyaltyRules(): Promise<LoyaltyRules> { const response = await adminFetch(`${apiBaseUrl}/api/admin/loyalty-rules`); if (!response.ok) throw new Error('Puan kuralları alınamadı.'); return response.json() as Promise<LoyaltyRules> }
export async function updateAdminLoyaltyRules(request: { silverThreshold: number; goldThreshold: number; pointsPerRewardTry: number; changeNote: string }): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/loyalty-rules`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }); if (!response.ok) { const body = await response.json().catch(() => null) as { detail?: string } | null; throw new Error(body?.detail ?? 'Puan kuralları güncellenemedi.') } }
export type AdminTransaction = { id: string; category: string; type: string; description: string; amount: number; craftsman: string; phoneNumber: string; referenceType: string; referenceValue: string; occurredAtUtc: string; dealerEmployee: string | null }
export type AdminTransactionResponse = { rows: AdminTransaction[]; summary: { earnedPoints: number; spentPoints: number; reversedPoints: number; fulfilledCoupons: number } }
export async function getAdminTransactions(type?: string): Promise<AdminTransactionResponse> { const query = type ? `?type=${encodeURIComponent(type)}` : ''; const response = await adminFetch(`${apiBaseUrl}/api/admin/transactions${query}`); if (!response.ok) throw new Error('İşlem geçmişi alınamadı.'); return response.json() as Promise<AdminTransactionResponse> }
export type AdminLoyaltyReport = { from: string; to: string; summary: { earnedPoints: number; spentPoints: number; reversedPoints: number; uniqueCraftsmen: number; rewardRequests: number; fulfilledRewards: number }; daily: { date: string; earned: number; spent: number; reversed: number }[]; topCraftsmen: { name: string; phoneNumber: string; earnedPoints: number }[]; topRewards: { name: string; count: number; points: number }[] }
export type ReportExportAudit = { id: string; reportType: string; actor: string; startsAtUtc: string; endsAtUtc: string; rowCount: number; createdAtUtc: string }
export async function getAdminLoyaltyReport(from: string, to: string): Promise<AdminLoyaltyReport> { const response = await adminFetch(`${apiBaseUrl}/api/admin/reports/loyalty?from=${from}&to=${to}`); if (!response.ok) throw new Error('Rapor alınamadı.'); return response.json() as Promise<AdminLoyaltyReport> }
export async function getReportExportAudits(): Promise<ReportExportAudit[]> { const response = await adminFetch(`${apiBaseUrl}/api/admin/reports/exports`); if (!response.ok) throw new Error('Dışa aktarma geçmişi alınamadı.'); return response.json() as Promise<ReportExportAudit[]> }
export async function exportAdminLoyaltyReport(from: string, to: string): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/reports/loyalty/export?from=${from}&to=${to}`); if (!response.ok) throw new Error('CSV oluşturulamadı.'); const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `usta-kulubu-raporu-${to}.csv`; link.click(); URL.revokeObjectURL(url) }
export type SupportResponseItem = { id: string; author: string; message: string; createdAtUtc: string }
export type AdminSupportRequest = { id: string; category: string; subject: string; description: string; status: 'Open' | 'InProgress' | 'Resolved' | 'Closed'; priority: 'Low' | 'Normal' | 'High' | 'Urgent'; assignedTo: string | null; createdAtUtc: string; updatedAtUtc: string; resolvedAtUtc: string | null; craftsman: string; phoneNumber: string; responses: SupportResponseItem[] }
export async function getAdminSupportRequests(status?: string): Promise<AdminSupportRequest[]> { const query = status ? `?status=${status}` : ''; const response = await adminFetch(`${apiBaseUrl}/api/admin/support-requests${query}`); if (!response.ok) throw new Error('Destek talepleri alınamadı.'); return response.json() as Promise<AdminSupportRequest[]> }
export async function updateAdminSupportRequest(id: string, request: { status: string; priority: string; assignedTo: string | null }): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/support-requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) }); if (!response.ok) throw new Error('Destek talebi güncellenemedi.') }
export async function replyAdminSupportRequest(id: string, message: string): Promise<void> { const response = await adminFetch(`${apiBaseUrl}/api/admin/support-requests/${id}/responses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) }); if (!response.ok) throw new Error('Yanıt gönderilemedi.') }
