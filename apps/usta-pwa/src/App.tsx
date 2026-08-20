import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createAdminCampaign, createAdminPointAdjustment, createAdminProduct, createAdminReward, createDealerSale, createMembershipPass, createSupportRequest, exportAdminLoyaltyReport, fulfillDealerCoupon, generateAdminProductCodes, getAdminCampaigns, getAdminCraftsmen, getAdminDealers, getAdminLoyaltyReport, getAdminLoyaltyRules, getAdminOverview, getAdminProducts, getAdminRewards, getAdminRiskCases, getAdminSupportRequests, getAdminTransactions, getCampaigns, getCraftsmanDashboard, getCraftsmanProfile, getDealerDashboard, getNotifications, getReportExportAudits, getRewardRedemptions, getRewards, getSupportRequests, getWallet, loginAdmin, loginDealer, logoutAdmin, logoutCraftsman, logoutDealer, markAllNotificationsRead, markNotificationRead, redeemProductCode, redeemReward, replyAdminSupportRequest, replySupportRequest, reportDealerRisk, requestOtpCode, returnDealerProduct, setAdminCampaignActive, setAdminEntityActive, updateAdminLoyaltyRules, updateAdminReward, updateAdminRiskStatus, updateAdminSupportRequest, updateCraftsmanProfile, verifyDealerCoupon, verifyMembershipPass, verifyOtpCode, type AdminLoginResult, type AdminCampaign, type AdminCraftsman, type AdminDealer, type AdminLoyaltyReport, type AdminOverview, type AdminProduct, type AdminReward, type AdminRiskCase, type AdminSupportRequest, type AdminTransactionResponse, type Campaign, type CraftsmanNotification, type CraftsmanProfile, type Dashboard, type DealerCoupon, type DealerDashboard, type DealerLoginResult, type DealerSaleResult, type MembershipPassResult, type LoyaltyRules, type ProductReturnResult, type ReportExportAudit, type Reward, type RewardRedemption, type RewardRedemptionResult, type SupportItem, type Wallet as WalletData } from './api'
import { createAdminDealerEmployee, getAdminDealerEmployees, resetAdminDealerEmployeePin, setAdminDealerEmployeeActive, type AdminDealerEmployee } from './api'
import './App.css'
import { clearPendingRedemptions, enqueueRedemption, getPendingRedemptions, removePendingRedemption } from './offlineQueue'
import QRCode from 'qrcode'

type Screen = 'home' | 'scan' | 'rewards' | 'wallet' | 'coupons' | 'campaigns' | 'notifications' | 'support' | 'profile'

const fallbackRewards: Reward[] = [
  { id: '1', name: 'Takım Çantası', description: '', pointCost: 2_500, imageKey: 'tool-bag', deliveryType: 'DealerPickup', stockQuantity: 40, isAvailable: true },
  { id: '2', name: 'Akülü Matkap', description: '', pointCost: 7_500, imageKey: 'drill', deliveryType: 'DealerPickup', stockQuantity: 15, isAvailable: true },
  { id: '3', name: 'Usta Montu', description: '', pointCost: 3_000, imageKey: 'work-jacket', deliveryType: 'DealerPickup', stockQuantity: 60, isAvailable: true },
  { id: '4', name: 'Dijital Hediye Kodu', description: '', pointCost: 1_500, imageKey: 'digital-gift', deliveryType: 'Digital', stockQuantity: null, isAvailable: true },
]
const rewardArt: Record<string, string> = { 'tool-bag': '🧰', drill: '🔧', 'work-jacket': '🦺', 'digital-gift': '🎁' }

const fallbackDashboard: Dashboard = {
  craftsmanId: '',
  fullName: 'Ahmet Usta',
  level: 'Silver',
  balance: 10_000,
  availablePoints: 10_000,
  pointDebt: 0,
  canRedeemRewards: true,
  rewardValueTry: 500,
  pointsToNextLevel: 2_500,
  movements: [
    { description: 'Ürün kodu okuma', createdAtUtc: new Date().toISOString(), amount: 250 },
    { description: 'Kampanya bonusu', createdAtUtc: new Date().toISOString(), amount: 150 },
    { description: 'Kupon kullanımı', createdAtUtc: new Date().toISOString(), amount: -50 },
  ],
  updatedAtUtc: new Date(0).toISOString(),
}
function cachedDashboard() { try { const value = localStorage.getItem('usta-dashboard-cache'); return value ? { ...fallbackDashboard, ...JSON.parse(value) as Dashboard } : fallbackDashboard } catch { return fallbackDashboard } }

const numberFormatter = new Intl.NumberFormat('tr-TR')
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const levelNames: Record<string, string> = { Bronze: 'Bronz', Silver: 'Gümüş', Gold: 'Altın' }

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Ana menü">
      <button className={screen === 'home' ? 'active' : ''} onClick={() => setScreen('home')} type="button"><span>⌂</span>Ana Sayfa</button>
      <button className={screen === 'wallet' ? 'active' : ''} onClick={() => setScreen('wallet')} type="button"><span>▣</span>Cüzdan</button>
      <button className="scan-nav" onClick={() => setScreen('scan')} type="button" aria-label="QR okut"><span>▦</span></button>
      <button className={screen === 'rewards' ? 'active' : ''} onClick={() => setScreen('rewards')} type="button"><span>♙</span>Ödüller</button>
      <button className={screen === 'profile' ? 'active' : ''} onClick={() => setScreen('profile')} type="button"><span>♧</span>Profil</button>
    </nav>
  )
}

function Home({ go, dashboard, connected }: { go: (screen: Screen) => void; dashboard: Dashboard; connected: boolean }) {
  return (
    <>
      <header className="brand-header"><div className="brand"><span>⚒</span><strong>Usta Kulübü</strong></div><button onClick={() => go('notifications')} aria-label="Bildirimler" type="button">♧<i className="notification-dot" /></button></header>
      <p className="hello">Merhaba {dashboard.fullName} 👋 <i className={connected ? 'api-dot connected' : 'api-dot'} title={connected ? 'SQL Server bağlantısı açık' : 'Örnek veriler gösteriliyor'} /></p>

      <section className="points-card">
        <div><strong>{numberFormatter.format(dashboard.availablePoints)} <small>puan</small></strong><p>Bu puanla alabileceğiniz ödüllerin<br />değeri: {numberFormatter.format(dashboard.rewardValueTry)} TL'ye kadar</p></div><span className="gift-art">♙</span>
      </section>
      {dashboard.pointDebt > 0 && <div className="point-debt-warning"><strong>{numberFormatter.format(dashboard.pointDebt)} puan açığınız var</strong><span>İade sonrası oluşan açık kapanana kadar yeni ödül alamazsınız. Kazandığınız yeni puanlar önce bu açığı kapatır.</span></div>}

      <section className="level-card">
        <div className="medal">★</div><div className="level-copy"><strong>{levelNames[dashboard.level] ?? dashboard.level} Seviye</strong><div className="level-progress"><i /></div><span>Altın seviyeye {numberFormatter.format(dashboard.pointsToNextLevel)} puan</span></div><b>★</b>
      </section>

      <button className="primary-action" onClick={() => go('scan')} type="button"><span>▦</span>QR Okut</button>
      <button className="secondary-action" onClick={() => go('scan')} type="button"><span>⌨</span>Kodu Elle Gir</button>

      <h2 className="block-title">Hızlı İşlemler</h2>
      <div className="quick-grid">
        <button onClick={() => go('wallet')} type="button"><span>◴</span>Puan Geçmişi</button><button onClick={() => go('coupons')} type="button"><span>▰</span>Kuponlar</button>
        <button onClick={() => go('campaigns')} type="button"><span>◇</span>Kampanyalar</button><button onClick={() => go('support')} type="button"><span>♧</span>Destek</button>
      </div>

      <div className="section-row"><h2>Son Puan Hareketleri</h2><button type="button">Tümü ›</button></div>
      <div className="movement-list">{dashboard.movements.map((movement, index) => <div key={`${movement.createdAtUtc}-${index}`}><span>{movement.description}</span><time>{dateFormatter.format(new Date(movement.createdAtUtc))}</time><b className={movement.amount < 0 ? 'minus' : ''}>{movement.amount > 0 ? '+' : ''}{numberFormatter.format(movement.amount)}</b></div>)}</div>
    </>
  )
}

function Scanner({ back, craftsmanId, onRedeemed }: { back: () => void; craftsmanId: string; onRedeemed: () => Promise<void> }) {
  const [manualEntryOpen, setManualEntryOpen] = useState(false)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [cameraState, setCameraState] = useState<'starting' | 'active' | 'unavailable'>('starting')
  const [pendingCount, setPendingCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function startCamera() {
      const Detector = (window as typeof window & { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
      if (!Detector || !navigator.mediaDevices?.getUserMedia) { setCameraState('unavailable'); return }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return }
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
        setCameraState('active')
        const detector = new Detector({ formats: ['qr_code'] })
        const scan = async () => {
          if (cancelled || scanningRef.current || !videoRef.current) return
          try {
            const found = await detector.detect(videoRef.current)
            if (found[0]?.rawValue) { scanningRef.current = true; setCode(found[0].rawValue.trim().toUpperCase()); setManualEntryOpen(true); setResult({ kind: 'success', message: 'QR kod okundu. Kodu kullanarak işlemi onaylayın.' }); return }
          } catch { /* Kamera bir sonraki karede yeniden denenir. */ }
          window.setTimeout(scan, 350)
        }
        void scan()
      } catch { if (!cancelled) setCameraState('unavailable') }
    }
    void startCamera()
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((track) => track.stop()) }
  }, [])

  useEffect(() => {
    let active = true
    const retryPending = async () => {
      const pending = await getPendingRedemptions(craftsmanId)
      if (active) setPendingCount(pending.length)
      if (!navigator.onLine) return
      for (const item of pending) {
        try { await redeemProductCode(item.craftsmanId, item.code, item.requestId); await removePendingRedemption(item.requestId); if (active) setPendingCount((count) => Math.max(0, count - 1)); await onRedeemed(); if (active) setResult({ kind: 'success', message: 'Bekleyen ürün kodu sunucuda güvenle işlendi.' }) }
        catch (error) { if (error instanceof TypeError) return; await removePendingRedemption(item.requestId); if (active) { setPendingCount((count) => Math.max(0, count - 1)); setResult({ kind: 'error', message: error instanceof Error ? error.message : 'Bekleyen kod işlenemedi.' }) } }
      }
    }
    void retryPending(); window.addEventListener('online', retryPending)
    return () => { active = false; window.removeEventListener('online', retryPending) }
  }, [craftsmanId, onRedeemed])

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!craftsmanId) {
      setResult({ kind: 'error', message: 'Backend bağlantısı kurulamadı. İkinci terminalde API’yi çalıştırın.' })
      return
    }

    const normalizedCode = code.trim().toUpperCase(), requestId = crypto.randomUUID()
    setSubmitting(true)
    setResult(null)
    if (!navigator.onLine) {
      const count = await enqueueRedemption({ requestId, craftsmanId, code: normalizedCode, createdAtUtc: new Date().toISOString() })
      setPendingCount(count); setResult({ kind: 'success', message: 'İşlem şifreli kuyruğa alındı. Bağlantı gelince otomatik gönderilecek.' }); setSubmitting(false); setCode(''); return
    }
    try {
      const response = await redeemProductCode(craftsmanId, normalizedCode, requestId)
      await onRedeemed()
      setResult({ kind: 'success', message: `${response.product}: +${numberFormatter.format(response.earnedPoints)} puan eklendi.` })
      setCode('')
    } catch (error) {
      if (error instanceof TypeError) { const count = await enqueueRedemption({ requestId, craftsmanId, code: normalizedCode, createdAtUtc: new Date().toISOString() }); setPendingCount(count); setResult({ kind: 'success', message: 'Sunucuya ulaşılamadı; işlem şifreli kuyruğa alındı.' }); setCode('') }
      else setResult({ kind: 'error', message: error instanceof Error ? error.message : 'Kod kullanılamadı.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="page-header"><button onClick={back} type="button">‹</button><h1>Ürün Kodunu Okut</h1><button type="button">?</button></header>
      <p className="scan-instruction">Kodu çerçevenin içine hizalayın</p>
      <div className="camera-frame">
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <video className={cameraState === 'active' ? 'camera-preview active' : 'camera-preview'} ref={videoRef} playsInline muted aria-label="QR kod kamerası" />
        {cameraState !== 'active' && <div className="product-box"><div className="box-top" /><div className="qr-art">▦</div><small>||||||||||</small></div>}
        {cameraState === 'starting' && <span className="camera-status">Kamera hazırlanıyor…</span>}
        {cameraState === 'unavailable' && <span className="camera-status">Kamera kullanılamadı; kodu elle girebilirsiniz.</span>}
      </div>
      <button className="secondary-action scanner-manual" onClick={() => setManualEntryOpen((open) => !open)} type="button"><span>⌨</span>Kodu Elle Gir</button>
      {manualEntryOpen && <form className="manual-code-form" onSubmit={submitCode}>
        <label htmlFor="product-code">Ürün kodu</label>
        <div><input id="product-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Örn. USTA-DEMO-2026" minLength={8} required autoComplete="off" /><button disabled={submitting} type="submit">{submitting ? 'Kontrol ediliyor…' : 'Kodu Kullan'}</button></div>
        <small>Deneme kodu: <button onClick={() => setCode('USTA-DEMO-2026')} type="button">USTA-DEMO-2026</button></small>
        {result && <p className={result.kind}>{result.message}</p>}
      </form>}
      <section className="how-card"><h2>Nasıl Çalışır?</h2><div className="steps"><div><span>▦</span><small>Kodu Okut</small></div><b>→</b><div><span>♢</span><small>Ürün doğrulansın</small></div><b>→</b><div><span>★</span><small>Puanın hemen eklensin</small></div></div><p>♢ Her ürün kodu yalnızca bir kez kullanılabilir.</p></section>
      {(pendingCount > 0 || !navigator.onLine) && <div className="connection-warning">⌁ <strong>{pendingCount > 0 ? `${pendingCount} işlem bekliyor — bağlantı gelince güvenle tekrar denenecek` : 'Bağlantı yok — yeni işlem şifreli kuyruğa alınacak'}</strong></div>}
    </>
  )
}

function Rewards({ availablePoints, pointDebt, craftsmanId, onBalanceChanged }: { availablePoints: number; pointDebt: number; craftsmanId: string; onBalanceChanged: () => Promise<void> }) {
  const [filter, setFilter] = useState<'all' | Reward['deliveryType']>('all')
  const [catalog, setCatalog] = useState(fallbackRewards)
  const [connected, setConnected] = useState(false)
  const [catalogVersion, setCatalogVersion] = useState(0)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [redemptionRequestId, setRedemptionRequestId] = useState('')
  const [redemption, setRedemption] = useState<RewardRedemptionResult | null>(null)
  const [redemptionError, setRedemptionError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getRewards(filter === 'all' ? undefined : filter, controller.signal)
      .then((items) => { setCatalog(items); setConnected(true) })
      .catch(() => {
        setConnected(false)
        setCatalog(filter === 'all' ? fallbackRewards : fallbackRewards.filter((item) => item.deliveryType === filter))
      })
    return () => controller.abort()
  }, [filter, catalogVersion])

  async function confirmRedemption() {
    if (!selectedReward || !craftsmanId) return
    setSubmitting(true)
    setRedemptionError('')
    try {
      const response = await redeemReward(selectedReward.id, craftsmanId, redemptionRequestId)
      setRedemption(response)
      setSelectedReward(null)
      setCatalogVersion((version) => version + 1)
      await onBalanceChanged()
    } catch (error) {
      setRedemptionError(error instanceof Error ? error.message : 'Ödül alınamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="rewards-header"><h1>Ödüller</h1><strong>{numberFormatter.format(availablePoints)} <small>puan</small></strong></header>
      {pointDebt > 0 && <div className="point-debt-warning"><strong>{numberFormatter.format(pointDebt)} puan açığınız var</strong><span>Açık kapanana kadar ödül alımı geçici olarak durduruldu.</span></div>}
      <div className="filters"><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')} type="button">Tümü</button><button className={filter === 'Digital' ? 'selected' : ''} onClick={() => setFilter('Digital')} type="button">Dijital</button><button className={filter === 'DealerPickup' ? 'selected' : ''} onClick={() => setFilter('DealerPickup')} type="button">Bayiden Teslim</button></div>
      <div className={connected ? 'catalog-source connected' : 'catalog-source'}>{connected ? 'Canlı katalog' : 'Örnek katalog'}</div>
      <div className="rewards-grid">
        {catalog.map((reward) => <article className="reward-product" key={reward.id} title={reward.description}>
          {reward.deliveryType === 'DealerPickup' && <span className="delivery">Bayiden Teslim</span>}<div className="product-art">{rewardArt[reward.imageKey] ?? '🎁'}</div><h2>{reward.name}</h2><p>{numberFormatter.format(reward.pointCost)} puan</p><button onClick={() => { setSelectedReward(reward); setRedemptionRequestId(crypto.randomUUID()); setRedemption(null); setRedemptionError('') }} disabled={!reward.isAvailable || pointDebt > 0 || availablePoints < reward.pointCost || !craftsmanId} type="button">{!reward.isAvailable ? 'Stokta Yok' : pointDebt > 0 ? 'Puan Açığı Var' : availablePoints < reward.pointCost ? 'Puan Yetersiz' : reward.deliveryType === 'Digital' ? 'İncele' : 'Ödülü Al'}</button>
        </article>)}
      </div>
      <div className="points-note">ⓘ <span>Puanlar nakit değildir; yalnızca program ödüllerinde kullanılır.</span></div>
      {selectedReward && <div className="reward-dialog-backdrop"><section className="reward-dialog" role="dialog" aria-modal="true" aria-labelledby="reward-dialog-title">
        <button className="dialog-close" onClick={() => setSelectedReward(null)} type="button" aria-label="Kapat">×</button><div className="dialog-art">{rewardArt[selectedReward.imageKey] ?? '🎁'}</div>
        <h2 id="reward-dialog-title">{selectedReward.name}</h2><p>{selectedReward.description}</p><strong>{numberFormatter.format(selectedReward.pointCost)} puan kullanılacak</strong>
        {redemptionError && <span className="dialog-error">{redemptionError}</span>}<button className="dialog-confirm" onClick={confirmRedemption} disabled={submitting} type="button">{submitting ? 'İşlem yapılıyor…' : 'Onayla ve Ödülü Al'}</button><button className="dialog-cancel" onClick={() => setSelectedReward(null)} type="button">Vazgeç</button>
      </section></div>}
      {redemption && <section className="redemption-success"><span>✓</span><div><strong>Ödülün hazır!</strong><p>{redemption.reward}</p><code>{redemption.fulfillmentCode}</code><small>{redemption.deliveryType === 'Digital' ? 'Dijital kodunu yukarıda görebilirsin.' : 'Bu kodu bayide görevliye göster.'}</small></div><button onClick={() => setRedemption(null)} type="button">×</button></section>}
    </>
  )
}

function Wallet({ dashboard, go }: { dashboard: Dashboard; go: (screen: Screen) => void }) {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!dashboard.craftsmanId) return
    const controller = new AbortController()
    getWallet(dashboard.craftsmanId, controller.signal).then(setWallet).catch(() => setError(true))
    return () => controller.abort()
  }, [dashboard.craftsmanId, dashboard.balance])

  const availablePoints = wallet?.availablePoints ?? dashboard.availablePoints
  const pointDebt = wallet?.pointDebt ?? dashboard.pointDebt
  const movements = wallet?.movements ?? dashboard.movements.map((movement, index) => ({ ...movement, id: String(index), transactionType: 0 }))

  return <>
    <header className="wallet-header"><div><span>PUAN CÜZDANI</span><h1>{dashboard.fullName}</h1></div><b>{levelNames[dashboard.level] ?? dashboard.level}</b></header>
    <section className="wallet-balance"><span>Kullanılabilir puanın</span><strong>{numberFormatter.format(availablePoints)} <small>puan</small></strong><p>Bu puanla alabileceğin ödüllerin değeri: <b>{numberFormatter.format(Math.floor(availablePoints / 20))} TL'ye kadar</b></p></section>
    {pointDebt > 0 && <div className="point-debt-warning"><strong>{numberFormatter.format(pointDebt)} puan açığınız var</strong><span>İade edilen üründen kazanılan puan geri alındı. Yeni puanlarınız önce bu açığı kapatacak.</span></div>}
    <div className="wallet-actions"><button onClick={() => go('scan')} type="button"><span>▦</span>Puan Kazan</button><button onClick={() => go('rewards')} disabled={pointDebt > 0} type="button"><span>♙</span>{pointDebt > 0 ? 'Ödüller Kilitli' : 'Ödüllere Git'}</button></div>
    <div className="wallet-title"><h2>Puan hareketleri</h2><button type="button">Tümü</button></div>
    {error && <p className="wallet-error">Bağlantı kurulamadı; son bilinen hareketler gösteriliyor.</p>}
    <section className="wallet-movements">
      {movements.length === 0 && <p className="empty-wallet">Henüz puan hareketi yok.</p>}
      {movements.map((movement) => <article key={movement.id}>
        <span className={movement.amount < 0 ? 'movement-badge spent' : 'movement-badge'}>{movement.amount < 0 ? '↙' : '↗'}</span>
        <div><strong>{movement.description}</strong><time>{dateFormatter.format(new Date(movement.createdAtUtc))}</time></div>
        <b className={movement.amount < 0 ? 'negative' : ''}>{movement.amount > 0 ? '+' : ''}{numberFormatter.format(movement.amount)}</b>
      </article>)}
    </section>
    <div className="wallet-info">ⓘ <span>Puanlar nakit değildir ve banka hesabına çekilemez. Yalnızca Usta Kulübü ödüllerinde kullanılır.</span></div>
  </>
}

function Coupons({ craftsmanId, back }: { craftsmanId: string; back: () => void }) {
  const [items, setItems] = useState<RewardRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  useEffect(() => {
    if (!craftsmanId) { setLoading(false); setError('Backend bağlantısı kurulamadı.'); return }
    const controller = new AbortController()
    getRewardRedemptions(craftsmanId, controller.signal)
      .then(setItems)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Kuponlar alınamadı.'))
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [craftsmanId])

  async function copyCode(item: RewardRedemption) {
    await navigator.clipboard.writeText(item.fulfillmentCode)
    setCopiedId(item.id)
    window.setTimeout(() => setCopiedId(''), 1600)
  }

  return <>
    <header className="page-header coupons-header"><button onClick={back} type="button">‹</button><h1>Kuponlarım</h1><span>{items.length}</span></header>
    <div className="coupon-tabs"><button className="selected" type="button">Tümü</button><button type="button">Aktif</button><button type="button">Kullanılmış</button></div>
    {loading && <div className="coupon-state">Kuponlar yükleniyor…</div>}
    {error && <div className="coupon-state error">{error}</div>}
    {!loading && !error && items.length === 0 && <div className="coupon-empty"><span>▰</span><h2>Henüz kuponun yok</h2><p>Ödül kataloğundan bir ödül aldığında teslim kodun burada saklanır.</p></div>}
    <section className="coupon-list">{items.map((item) => <article className={item.status === 'Created' || item.deliveryType === 'Digital' ? 'coupon-card' : 'coupon-card inactive'} key={item.id}>
      <div className="coupon-art">{rewardArt[item.imageKey] ?? '🎁'}</div><div className="coupon-main"><div className="coupon-name"><h2>{item.rewardName}</h2><span>{item.deliveryType === 'Digital' && item.status === 'Fulfilled' ? 'Teslim Edildi' : item.status === 'Created' ? 'Aktif' : item.status === 'Fulfilled' ? 'Kullanıldı' : 'İptal'}</span></div><p>{item.deliveryType === 'Digital' ? 'Dijital ödül kodu' : 'Bayiden teslim kodu'} · {numberFormatter.format(item.pointsSpent)} puan</p><code>{item.fulfillmentCode}</code><small>Oluşturulma: {dateFormatter.format(new Date(item.createdAtUtc))}</small></div>
      <button onClick={() => copyCode(item)} disabled={item.status !== 'Created' && item.deliveryType !== 'Digital'} type="button">{copiedId === item.id ? 'Kopyalandı' : 'Kopyala'}</button>
    </article>)}</section>
    <div className="wallet-info">ⓘ <span>Bayiden teslim ödüllerinde bu kodu bayi görevlisine göster. Kodu tanımadığın kişilerle paylaşma.</span></div>
  </>
}

function Profile({ craftsmanId, onUpdated, onLogout }: { craftsmanId: string; onUpdated: () => Promise<void>; onLogout: () => void }) {
  const [profile, setProfile] = useState<CraftsmanProfile | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [membershipPass, setMembershipPass] = useState<MembershipPassResult | null>(null), [membershipQr, setMembershipQr] = useState('')

  useEffect(() => {
    if (!craftsmanId) return
    const controller = new AbortController()
    getCraftsmanProfile(craftsmanId, controller.signal).then(setProfile).catch(() => setMessage({ kind: 'error', text: 'Profil yüklenemedi. Backend bağlantısını kontrol edin.' }))
    return () => controller.abort()
  }, [craftsmanId])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return
    setSaving(true); setMessage(null)
    try {
      await updateCraftsmanProfile(craftsmanId, profile); await onUpdated()
      setMessage({ kind: 'success', text: 'Profil bilgilerin kaydedildi.' })
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Profil kaydedilemedi.' })
    } finally { setSaving(false) }
  }
  async function showMembershipQr() { try { const pass = await createMembershipPass(craftsmanId); setMembershipPass(pass); setMembershipQr(await QRCode.toDataURL(pass.token, { width: 240, margin: 1, color: { dark: '#041521', light: '#ffffff' } })) } catch (error) { setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Üyelik QR’ı oluşturulamadı.' }) } }

  if (!profile) return <div className="profile-loading">{message?.text ?? 'Profil yükleniyor…'}</div>
  const maskedPhone = `${profile.phoneNumber.slice(0, 4)} *** ** ${profile.phoneNumber.slice(-2)}`
  return <><header className="profile-header"><div className="profile-avatar">AU</div><div><h1>{profile.fullName}</h1><span>{levelNames[profile.level] ?? profile.level} Seviye</span></div></header>
    <form className="profile-form" onSubmit={save}><section><h2>Kişisel bilgiler</h2><label>Ad soyad<input value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} minLength={3} maxLength={120} required /></label><label>Şehir<input value={profile.city ?? ''} onChange={(event) => setProfile({ ...profile, city: event.target.value })} maxLength={80} placeholder="Şehir seçilmedi" /></label><label>Telefon numarası<div className="locked-field"><span>{maskedPhone}</span><b>Doğrulandı</b></div><small>Telefon değişikliği SMS doğrulaması gerektirir.</small></label></section>
      <section><h2>Bildirim tercihleri</h2><label className="toggle-row"><div><strong>Kampanya bildirimleri</strong><small>Yeni kampanya ve fırsatları uygulamada göster.</small></div><input type="checkbox" checked={profile.campaignNotificationsEnabled} onChange={(event) => setProfile({ ...profile, campaignNotificationsEnabled: event.target.checked })} /><i /></label><label className="toggle-row"><div><strong>SMS bildirimleri</strong><small>Önemli puan ve kupon bilgilerini SMS ile al.</small></div><input type="checkbox" checked={profile.smsNotificationsEnabled} onChange={(event) => setProfile({ ...profile, smsNotificationsEnabled: event.target.checked })} /><i /></label></section>
      <section className="membership-card"><h2>Bayi Üyelik QR’ı</h2><p>Satışın hesabınla eşleştirilmesi için bu geçici kodu bayi görevlisine göster.</p>{membershipQr && membershipPass ? <><img src={membershipQr} alt="Geçici usta üyelik QR kodu" /><code>{membershipPass.token}</code><small>{new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(membershipPass.expiresAtUtc))} saatine kadar geçerli ve tek kullanımlık.</small></> : <button onClick={showMembershipQr} type="button">Üyelik QR’ımı Oluştur</button>}</section><div className="profile-meta">Üyelik tarihi: {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(profile.createdAtUtc))}</div>{message && <p className={`profile-message ${message.kind}`}>{message.text}</p>}<button className="profile-save" disabled={saving} type="submit">{saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}</button><button className="profile-logout" onClick={onLogout} type="button">Güvenli Çıkış Yap</button></form></>
}

function Campaigns({ back }: { back: () => void }) {
  const [items, setItems] = useState<Campaign[]>([]); const [error, setError] = useState('')
  useEffect(() => { const controller = new AbortController(); getCampaigns(controller.signal).then(setItems).catch(() => setError('Kampanyalar yüklenemedi.')); return () => controller.abort() }, [])
  return <><header className="page-header simple-header"><button onClick={back} type="button">‹</button><h1>Kampanyalar</h1><span>◇</span></header>{error && <p className="screen-error">{error}</p>}<section className="campaign-list">{items.map((item) => <article key={item.id}><div className="campaign-badge">{item.pointMultiplier > 1 ? `${item.pointMultiplier}X` : '★'}</div><div><span>AKTİF KAMPANYA · {item.productName ?? 'TÜM ÜRÜNLER'}</span><h2>{item.title}</h2><p>{item.summary}</p><small>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.endsAtUtc))} tarihine kadar</small></div></article>)}</section>{!error && items.length === 0 && <div className="coupon-state">Aktif kampanya bulunmuyor.</div>}</>
}

function Notifications({ craftsmanId, back }: { craftsmanId: string; back: () => void }) {
  const [items, setItems] = useState<CraftsmanNotification[]>([]); const [unreadCount, setUnreadCount] = useState(0); const [error, setError] = useState('')
  useEffect(() => { if (!craftsmanId) return; const controller = new AbortController(); getNotifications(craftsmanId, controller.signal).then((inbox) => { setItems(inbox.items); setUnreadCount(inbox.unreadCount) }).catch(() => setError('Bildirimler yüklenemedi.')); return () => controller.abort() }, [craftsmanId])
  async function read(item: CraftsmanNotification) { if (item.readAtUtc) return; await markNotificationRead(craftsmanId, item.id); setItems((current) => current.map((x) => x.id === item.id ? { ...x, readAtUtc: new Date().toISOString() } : x)); setUnreadCount((count) => Math.max(0, count - 1)) }
  async function readAll() { await markAllNotificationsRead(craftsmanId); const now = new Date().toISOString(); setItems((current) => current.map((x) => ({ ...x, readAtUtc: x.readAtUtc ?? now }))); setUnreadCount(0) }
  const icons: Record<string, string> = { Welcome: '★', Campaign: '◇', PointsEarned: '+', Reward: '🎁', Delivery: '✓', Return: '↩', Support: '♧' }
  return <><header className="page-header simple-header"><button onClick={back} type="button">‹</button><h1>Bildirimler {unreadCount > 0 && <small>({unreadCount})</small>}</h1><button disabled={unreadCount === 0} onClick={readAll} type="button">Tümünü oku</button></header>{error && <p className="screen-error">{error}</p>}<section className="notification-list">{items.map((item) => <article className={item.readAtUtc ? 'read' : 'unread'} key={item.id} onClick={() => read(item)}><span>{icons[item.type] ?? '◇'}</span><div><b>{item.title}</b><p>{item.message}</p><small>{dateFormatter.format(new Date(item.createdAtUtc))}{!item.readAtUtc && ' · Yeni'}</small></div></article>)}</section>{!error && items.length === 0 && <div className="coupon-state">Henüz işlem bildirimi bulunmuyor.</div>}</>
}

function SupportRequestCard({ item, craftsmanId, onChanged }: { item: SupportItem; craftsmanId: string; onChanged: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(item.responses.length > 0); const [reply, setReply] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  const status = item.status === 'Open' ? 'Açık' : item.status === 'Resolved' ? 'Çözüldü' : item.status === 'Closed' ? 'Kapalı' : 'İşlemde'
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { await replySupportRequest(craftsmanId, item.id, reply); setReply(''); setMessage('Yanıtınız destek ekibine gönderildi.'); await onChanged() } catch (error) { setMessage(error instanceof Error ? error.message : 'Yanıt gönderilemedi.') } finally { setBusy(false) } }
  return <article className="craftsman-support-card"><button className="support-card-summary" onClick={() => setExpanded(!expanded)} type="button"><span>{item.category}</span><div><h3>{item.subject}</h3><small>{dateFormatter.format(new Date(item.createdAtUtc))} · {item.responses.length} yanıt</small></div><b>{status}</b></button>{expanded && <div className="craftsman-support-thread">{item.referenceValue && <code className="support-reference">İşlem: {item.referenceValue}</code>}<div className="support-original"><b>Siz</b><p>{item.description}</p></div>{item.responses.map((response) => <div className={response.author === 'Usta' ? 'from-craftsman' : 'from-support'} key={response.id}><b>{response.author === 'Usta' ? 'Siz' : response.author}</b><p>{response.message}</p><small>{dateFormatter.format(new Date(response.createdAtUtc))}</small></div>)}{item.status !== 'Closed' && <form onSubmit={send}><textarea value={reply} onChange={(event) => setReply(event.target.value)} minLength={3} maxLength={1500} placeholder="Destek ekibine yanıt yazın…" required /><button disabled={busy} type="submit">{busy ? 'Gönderiliyor…' : 'Yanıtla'}</button></form>}{message && <p className="support-reply-message">{message}</p>}</div>}</article>
}

function Support({ craftsmanId, back }: { craftsmanId: string; back: () => void }) {
  const [items, setItems] = useState<SupportItem[]>([]); const [subject, setSubject] = useState(''); const [description, setDescription] = useState(''); const [referenceValue, setReferenceValue] = useState(''); const [category, setCategory] = useState('Puan'); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false)
  async function load() { if (craftsmanId) setItems(await getSupportRequests(craftsmanId)) }
  useEffect(() => { if (!craftsmanId) return; const controller = new AbortController(); getSupportRequests(craftsmanId, controller.signal).then(setItems).catch(() => setMessage('Talepler yüklenemedi.')); return () => controller.abort() }, [craftsmanId])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setMessage(''); try { await createSupportRequest(craftsmanId, { category, subject, description, referenceValue: referenceValue.trim() || null }); setSubject(''); setDescription(''); setReferenceValue(''); setMessage(category === 'İtiraz' ? 'İtirazın işlem referansıyla kaydedildi.' : 'Destek talebin oluşturuldu.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Talep oluşturulamadı.') } finally { setSaving(false) } }
  return <><header className="page-header simple-header"><button onClick={back} type="button">‹</button><h1>Destek</h1><span>♧</span></header><form className="support-form" onSubmit={submit}><h2>Yeni destek talebi</h2><label>Kategori<select value={category} onChange={(event) => { setCategory(event.target.value); if (event.target.value !== 'İtiraz') setReferenceValue('') }}><option>Puan</option><option>Ürün Kodu</option><option>Ödül / Kupon</option><option>Hesap</option><option>İtiraz</option><option>Diğer</option></select></label>{category === 'İtiraz' && <label>İşlem referansı<input value={referenceValue} onChange={(event) => setReferenceValue(event.target.value.toUpperCase())} minLength={4} maxLength={120} placeholder="Ürün kodu, kupon veya satış numarası" required /><small>İtiraz ettiğiniz işlemin ekranda görünen kodunu yazın.</small></label>}<label>Konu<input value={subject} onChange={(event) => setSubject(event.target.value)} minLength={5} maxLength={140} required /></label><label>Açıklama<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={1500} required /></label>{message && <p>{message}</p>}<button disabled={saving} type="submit">{saving ? 'Gönderiliyor…' : category === 'İtiraz' ? 'İtirazı Gönder' : 'Talebi Gönder'}</button></form><h2 className="request-title">Geçmiş talepler</h2><section className="request-list">{items.length === 0 && <p>Henüz destek talebiniz yok.</p>}{items.map((item) => <SupportRequestCard item={item} craftsmanId={craftsmanId} onChanged={load} key={item.id} />)}</section></>
}

function Login({ onAuthenticated }: { onAuthenticated: (result: { craftsmanId: string; needsProfile: boolean; token: string; expiresAtUtc: string }) => void }) {
  const [phone, setPhone] = useState('05550000000'); const [challengeId, setChallengeId] = useState(''); const [code, setCode] = useState(''); const [developmentCode, setDevelopmentCode] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function requestCode(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await requestOtpCode(phone); setChallengeId(result.id); setDevelopmentCode(result.developmentCode ?? ''); setMessage('6 haneli doğrulama kodu gönderildi.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Kod gönderilemedi.') } finally { setBusy(false) } }
  async function verify(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await verifyOtpCode(challengeId, code); onAuthenticated(result) } catch (error) { setMessage(error instanceof Error ? error.message : 'Kod doğrulanamadı.') } finally { setBusy(false) } }
  return <main className="login-shell"><div className="login-logo">⚒</div><span className="login-eyebrow">USTA KULÜBÜ</span><h1>Puanın, ödülün,<br />emeğinin karşılığı.</h1><p>Telefon numaranla güvenli ve kolayca giriş yap.</p>{!challengeId ? <form onSubmit={requestCode}><label>Telefon numarası<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="05xx xxx xx xx" required /></label><button disabled={busy} type="submit">{busy ? 'Gönderiliyor…' : 'SMS Kodu Gönder'}</button></form> : <form onSubmit={verify}><label>6 haneli kod<input className="otp-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" placeholder="••••••" required autoFocus /></label>{developmentCode && <small>Geliştirme kodu: <button onClick={() => setCode(developmentCode)} type="button">{developmentCode}</button></small>}<button disabled={busy || code.length !== 6} type="submit">{busy ? 'Kontrol ediliyor…' : 'Giriş Yap'}</button><button className="login-back" onClick={() => { setChallengeId(''); setCode(''); setMessage('') }} type="button">Numarayı değiştir</button></form>}{message && <div className="login-message">{message}</div>}<small className="login-legal">Devam ederek üyelik ve kişisel veri koşullarını kabul etmiş olursun.</small></main>
}

function ProfileSetup({ craftsmanId, onCompleted }: { craftsmanId: string; onCompleted: () => void }) {
  const [fullName, setFullName] = useState(''); const [city, setCity] = useState(''); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage('')
    try { await updateCraftsmanProfile(craftsmanId, { fullName, city, campaignNotificationsEnabled: true, smsNotificationsEnabled: true }); onCompleted() }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Profil kaydedilemedi.') }
    finally { setSaving(false) }
  }
  return <main className="login-shell setup-shell"><div className="login-logo">✓</div><span className="login-eyebrow">SON BİR ADIM</span><h1>Seni tanıyalım,<br />kulübe hoş geldin.</h1><p>Ödül ve kampanyaları sana uygun gösterebilmemiz için kısa profilini tamamla.</p><form onSubmit={submit}><label>Ad soyad<input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={3} maxLength={120} placeholder="Adınız ve soyadınız" required autoFocus /></label><label>Şehir<input value={city} onChange={(event) => setCity(event.target.value)} maxLength={80} placeholder="Örn. Yalova" /></label>{message && <div className="login-message">{message}</div>}<button disabled={saving} type="submit">{saving ? 'Kaydediliyor…' : 'Kulübe Katıl'}</button></form><small className="login-legal">Bilgilerini daha sonra Profil ekranından değiştirebilirsin.</small></main>
}

function DealerRiskForm() {
  const [referenceType, setReferenceType] = useState('ProductCode'); const [referenceValue, setReferenceValue] = useState(''); const [reason, setReason] = useState(''); const [description, setDescription] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await reportDealerRisk({ referenceType, referenceValue, reason, description }); setMessage(`Bildirim oluşturuldu · ${result.id.slice(0, 8).toUpperCase()}`); setReferenceValue(''); setReason(''); setDescription('') } catch (error) { setMessage(error instanceof Error ? error.message : 'Bildirim oluşturulamadı.') } finally { setBusy(false) } }
  return <><form className="dealer-search dealer-return" onSubmit={submit}><label>İşlem türü<select value={referenceType} onChange={(event) => setReferenceType(event.target.value)}><option value="ProductCode">Ürün kodu</option><option value="Coupon">Kupon</option><option value="Sale">Satış</option></select></label><label>İşlem referansı<input value={referenceValue} onChange={(event) => setReferenceValue(event.target.value.toUpperCase())} minLength={4} maxLength={120} required /></label><label>Şüphe nedeni<input value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={80} required /></label><label>Açıklama<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={1000} required /></label><button disabled={busy} type="submit">{busy ? 'Gönderiliyor…' : 'İncelemeye Gönder'}</button></form>{message && <p className="dealer-message">{message}</p>}</>
}

function DealerRiskPage() { return <main className="dealer-shell"><header><div><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Bayi Paneli</strong></div></div><i>Yalova Merkez Bayi</i></header><section className="dealer-hero"><span>⚑</span><h1>Şüpheli İşlem Bildir</h1><p>Şüpheli ürün kodu, kupon veya satış işlemini yönetici incelemesine gönderin.</p></section><DealerRiskForm /><footer><a href="/dealer">Bayi işlemlerine dön</a><span>Demo Bayi Görevlisi</span></footer></main> }

function AdminLogin({ onAuthenticated }: { onAuthenticated: (profile: AdminLoginResult) => void }) {
  const [userName, setUserName] = useState('admin'), [password, setPassword] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await loginAdmin(userName, password); sessionStorage.setItem('admin-token', result.token); sessionStorage.setItem('admin-profile', JSON.stringify(result)); onAuthenticated(result) } catch (error) { setMessage(error instanceof Error ? error.message : 'Giriş yapılamadı.') } finally { setBusy(false) } }
  return <main className="admin-login"><div className="login-logo">⚒</div><span>USTA KULÜBÜ YÖNETİMİ</span><h1>Yönetici Girişi</h1><p>Kampanya, puan ve raporlama araçlarına yalnızca yetkili hesaplar erişebilir.</p><form onSubmit={submit}><label>Kullanıcı adı<input value={userName} onChange={(event) => setUserName(event.target.value)} autoComplete="username" required /></label><label>Parola<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" minLength={8} required /></label><small>Geliştirme hesabı: admin / Usta2026!</small>{message && <p>{message}</p>}<button disabled={busy} type="submit">{busy ? 'Doğrulanıyor…' : 'Yönetim Paneline Gir'}</button></form></main>
}

function AdminRouter() {
  const path = window.location.pathname
  return path.startsWith('/admin/dealer-employees') ? <AdminDealerEmployeesPage /> : path.startsWith('/admin/adjustments') ? <AdminPointAdjustmentsPage /> : path.startsWith('/admin/support') ? <AdminSupportPage /> : path.startsWith('/admin/reports') ? <AdminReportsPage /> : path.startsWith('/admin/transactions') ? <AdminTransactionsPage /> : path.startsWith('/admin/loyalty-rules') ? <AdminLoyaltyRulesPage /> : path.startsWith('/admin/products') ? <AdminProductsPage /> : path.startsWith('/admin/rewards') ? <AdminRewardsPage /> : path.startsWith('/admin/campaigns') ? <AdminCampaignsPage /> : path.startsWith('/admin/craftsmen') ? <AdminManagementPage kind="craftsmen" /> : path.startsWith('/admin/dealers') ? <AdminManagementPage kind="dealers" /> : <AdminApp />
}

function AdminPortal() {
  const [profile, setProfile] = useState<AdminLoginResult | null>(() => { try { const saved = sessionStorage.getItem('admin-profile'); const parsed = saved ? JSON.parse(saved) as AdminLoginResult : null; return parsed && new Date(parsed.expiresAtUtc) > new Date() && sessionStorage.getItem('admin-token') ? parsed : null } catch { return null } })
  if (!profile) return <AdminLogin onAuthenticated={setProfile} />
  const exit = async () => { await logoutAdmin(); setProfile(null) }
  return <><AdminRouter /><div className="admin-shortcuts"><a href="/admin/dealer-employees">Bayi Çalışanları</a><a href="/admin/adjustments">± Puan Düzelt</a></div><button className="admin-logout" onClick={exit} type="button">{profile.user} · Çıkış</button></>
}

function AdminApp() {
  const [overview, setOverview] = useState<AdminOverview | null>(null); const [items, setItems] = useState<AdminRiskCase[]>([]); const [notes, setNotes] = useState<Record<string, string>>({}); const [message, setMessage] = useState(''); const [busyId, setBusyId] = useState('')
  async function load() { const [summary, risks] = await Promise.all([getAdminOverview(), getAdminRiskCases()]); setOverview(summary); setItems(risks) }
  useEffect(() => { load().catch(() => setMessage('Yönetici verileri yüklenemedi.')) }, [])
  async function changeStatus(id: string, status: 'InReview' | 'Resolved' | 'Rejected') { const note = notes[id]?.trim() ?? ''; if (note.length < 5) { setMessage('Karar vermeden önce en az 5 karakterlik inceleme notu yazın.'); return } setBusyId(id); setMessage(''); try { await updateAdminRiskStatus(id, status, note); setNotes((current) => ({ ...current, [id]: '' })); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Durum güncellenemedi.') } finally { setBusyId('') } }
  const labels: Record<AdminRiskCase['status'], string> = { Open: 'Açık', InReview: 'İncelemede', Resolved: 'Çözüldü', Rejected: 'Reddedildi' }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><button className="active" type="button">⌂ Genel Bakış</button><button type="button">♧ Ustalar</button><button type="button">▣ Bayiler</button><button type="button">◇ Kampanyalar</button><button type="button">♙ Ödüller</button><button type="button">⚑ Risk Kontrolü</button></nav><a href="/">Usta uygulaması</a><a href="/dealer">Bayi paneli</a></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Genel Bakış</h1></div><b>Demo Yönetici</b></header>{message && <p className="admin-message">{message}</p>}<div className="admin-stats"><article><span>♧</span><div><small>Aktif Usta</small><strong>{overview?.craftsmen ?? '—'}</strong></div></article><article><span>▣</span><div><small>Aktif Bayi</small><strong>{overview?.dealers ?? '—'}</strong></div></article><article><span>♙</span><div><small>Aktif Kupon</small><strong>{overview?.activeCoupons ?? '—'}</strong></div></article><article className="risk"><span>⚑</span><div><small>Açık Risk Kaydı</small><strong>{overview?.openRiskCases ?? '—'}</strong></div></article></div><div className="admin-section-title"><div><h2>Şüpheli İşlemler</h2><p>Bayi çalışanlarından gelen son bildirimler</p></div><span>{items.length} kayıt</span></div><section className="admin-risk-list">{items.length === 0 && <p>Henüz şüpheli işlem bildirimi bulunmuyor.</p>}{items.map((item) => <article key={item.id}><div className="risk-head"><span>{item.referenceType === 'ProductCode' ? 'ÜRÜN KODU' : item.referenceType === 'Coupon' ? 'KUPON' : 'SATIŞ'}</span><b className={item.status}>{labels[item.status]}</b></div><h3>{item.reason}</h3><code>{item.referenceValue}</code><p>{item.description}</p><small>{item.dealer} · {item.dealerEmployee} · {dateFormatter.format(new Date(item.createdAtUtc))}</small>{item.actions.length > 0 && <div className="risk-history"><strong>İnceleme geçmişi</strong>{item.actions.map((action) => <div key={action.id}><b>{labels[action.status]}</b><p>{action.decisionNote}</p><small>{action.reviewer} · {dateFormatter.format(new Date(action.createdAtUtc))}</small></div>)}</div>}<label className="risk-note">İnceleme / karar notu<textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} minLength={5} maxLength={1000} placeholder="Kanıtı ve karar gerekçesini yazın…" /></label><div className="risk-actions"><button onClick={() => changeStatus(item.id, 'InReview')} disabled={busyId === item.id || item.status !== 'Open' || (notes[item.id]?.trim().length ?? 0) < 5} type="button">İncelemeye Al</button><button onClick={() => changeStatus(item.id, 'Resolved')} disabled={busyId === item.id || item.status === 'Resolved' || (notes[item.id]?.trim().length ?? 0) < 5} type="button">Çözüldü</button><button onClick={() => changeStatus(item.id, 'Rejected')} disabled={busyId === item.id || item.status === 'Rejected' || (notes[item.id]?.trim().length ?? 0) < 5} type="button">Reddet</button></div></article>)}</section></section></main>
}

function AdminManagementPage({ kind }: { kind: 'craftsmen' | 'dealers' }) {
  const [craftsmen, setCraftsmen] = useState<AdminCraftsman[]>([]); const [dealers, setDealers] = useState<AdminDealer[]>([]); const [message, setMessage] = useState(''); const [busyId, setBusyId] = useState('')
  async function load() { if (kind === 'craftsmen') setCraftsmen(await getAdminCraftsmen()); else setDealers(await getAdminDealers()) }
  useEffect(() => { const request = kind === 'craftsmen' ? getAdminCraftsmen().then(setCraftsmen) : getAdminDealers().then(setDealers); request.catch(() => setMessage('Kayıtlar yüklenemedi.')) }, [kind])
  async function toggle(id: string, active: boolean) { setBusyId(id); setMessage(''); try { await setAdminEntityActive(kind, id, !active); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Durum güncellenemedi.') } finally { setBusyId('') } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a className={kind === 'craftsmen' ? 'active' : ''} href="/admin/craftsmen">♧ Ustalar</a><a className={kind === 'dealers' ? 'active' : ''} href="/admin/dealers">▣ Bayiler</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>{kind === 'craftsmen' ? 'Usta Yönetimi' : 'Bayi Yönetimi'}</h1></div><b>{kind === 'craftsmen' ? craftsmen.length : dealers.length} kayıt</b></header>{message && <p className="admin-message">{message}</p>}<section className="management-list">{kind === 'craftsmen' ? craftsmen.map((item) => <article key={item.id}><div className="management-avatar">{item.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div className="management-info"><h2>{item.fullName}</h2><p>{item.phoneNumber} · {item.city ?? 'Şehir belirtilmemiş'}</p><small>{levelNames[item.level] ?? item.level} · {numberFormatter.format(item.balance)} puan · {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.createdAtUtc))}</small></div><span className={item.isActive ? 'entity-active' : 'entity-passive'}>{item.isActive ? 'Aktif' : 'Pasif'}</span><button onClick={() => toggle(item.id, item.isActive)} disabled={busyId === item.id} type="button">{item.isActive ? 'Pasife Al' : 'Aktifleştir'}</button></article>) : dealers.map((item) => <article key={item.id}><div className="management-avatar">▣</div><div className="management-info"><h2>{item.name}</h2><p>Bayi kodu: {item.code}</p><small>{item.activeEmployees}/{item.totalEmployees} aktif çalışan</small></div><span className={item.isActive ? 'entity-active' : 'entity-passive'}>{item.isActive ? 'Aktif' : 'Pasif'}</span><button onClick={() => toggle(item.id, item.isActive)} disabled={busyId === item.id} type="button">{item.isActive ? 'Pasife Al' : 'Aktifleştir'}</button></article>)}</section></section></main>
}

function AdminDealerEmployeesPage() {
  const [dealers, setDealers] = useState<AdminDealer[]>([]), [dealerId, setDealerId] = useState(''), [employees, setEmployees] = useState<AdminDealerEmployee[]>([])
  const [fullName, setFullName] = useState(''), [pin, setPin] = useState(''), [resetPins, setResetPins] = useState<Record<string, string>>({}), [message, setMessage] = useState(''), [busyId, setBusyId] = useState('')
  const loadEmployees = async (id: string) => { if (!id) return; setEmployees(await getAdminDealerEmployees(id)) }
  useEffect(() => { getAdminDealers().then((items) => { setDealers(items); const first = items.find((item) => item.isActive)?.id ?? items[0]?.id ?? ''; setDealerId(first); if (first) void loadEmployees(first) }).catch(() => setMessage('Bayi listesi yüklenemedi.')) }, [])
  const chooseDealer = (id: string) => { setDealerId(id); setMessage(''); void loadEmployees(id).catch(() => setMessage('Çalışanlar yüklenemedi.')) }
  const create = async (event: FormEvent) => { event.preventDefault(); setBusyId('new'); setMessage(''); try { await createAdminDealerEmployee(dealerId, fullName.trim(), pin); setFullName(''); setPin(''); setMessage('Çalışan oluşturuldu. Erişim kodunu yalnızca ilgili çalışana güvenli biçimde iletin.'); await loadEmployees(dealerId) } catch (error) { setMessage(error instanceof Error ? error.message : 'Çalışan oluşturulamadı.') } finally { setBusyId('') } }
  const toggle = async (item: AdminDealerEmployee) => { setBusyId(item.id); setMessage(''); try { await setAdminDealerEmployeeActive(dealerId, item.id, !item.isActive); setMessage(item.isActive ? 'Çalışan pasife alındı ve açık oturumları kapatıldı.' : 'Çalışan yeniden aktifleştirildi.'); await loadEmployees(dealerId) } catch (error) { setMessage(error instanceof Error ? error.message : 'Durum güncellenemedi.') } finally { setBusyId('') } }
  const resetPin = async (item: AdminDealerEmployee) => { const nextPin = resetPins[item.id] ?? ''; setBusyId(item.id); setMessage(''); try { await resetAdminDealerEmployeePin(dealerId, item.id, nextPin); setResetPins({ ...resetPins, [item.id]: '' }); setMessage('Erişim kodu yenilendi ve çalışanın açık oturumları kapatıldı.'); await loadEmployees(dealerId) } catch (error) { setMessage(error instanceof Error ? error.message : 'Kod yenilenemedi.') } finally { setBusyId('') } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/dealers">▣ Bayiler</a><a className="active" href="/admin/dealer-employees">♧ Bayi Çalışanları</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Bayi Çalışanı Yönetimi</h1></div><b>{employees.filter((item) => item.isActive).length} aktif çalışan</b></header><label className="employee-dealer-select">Bayi<select value={dealerId} onChange={(event) => chooseDealer(event.target.value)}>{dealers.map((dealer) => <option value={dealer.id} key={dealer.id}>{dealer.code} · {dealer.name}{dealer.isActive ? '' : ' (pasif)'}</option>)}</select></label>{message && <p className="admin-info-message">{message}</p>}<div className="employee-admin-layout"><form className="employee-create" onSubmit={create}><h2>Yeni çalışan</h2><p>Her çalışan için ayrı bir giriş kodu oluşturun. Kod veritabanında açık biçimde tutulmaz.</p><label>Ad soyad<input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={3} maxLength={120} required /></label><label>6 haneli erişim kodu<input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" required /></label><button disabled={busyId === 'new' || !dealerId} type="submit">{busyId === 'new' ? 'Oluşturuluyor…' : 'Çalışanı Oluştur'}</button></form><section className="employee-list">{employees.map((item) => <article key={item.id}><div className="employee-avatar">{item.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div className="employee-copy"><h2>{item.fullName}</h2><p>{item.hasAccessCode ? 'Erişim kodu tanımlı' : 'Erişim kodu eksik'} · {item.activeSessions} açık oturum</p><span className={item.isActive ? 'entity-active' : 'entity-passive'}>{item.isActive ? 'Aktif' : 'Pasif'}</span></div><button onClick={() => toggle(item)} disabled={busyId === item.id} type="button">{item.isActive ? 'Pasife Al' : 'Aktifleştir'}</button><div className="employee-pin-reset"><input value={resetPins[item.id] ?? ''} onChange={(event) => setResetPins({ ...resetPins, [item.id]: event.target.value.replace(/\D/g, '').slice(0, 6) })} inputMode="numeric" placeholder="Yeni 6 haneli kod" maxLength={6} /><button onClick={() => resetPin(item)} disabled={busyId === item.id || (resetPins[item.id]?.length ?? 0) !== 6} type="button">Kodu Yenile</button></div></article>)}{employees.length === 0 && <p>Bu bayide henüz çalışan bulunmuyor.</p>}</section></div></section></main>
}

function AdminCampaignsPage() {
  const initialStart = new Date().toISOString().slice(0, 16); const initialEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16)
  const [items, setItems] = useState<AdminCampaign[]>([]); const [products, setProducts] = useState<AdminProduct[]>([]); const [productId, setProductId] = useState(''); const [title, setTitle] = useState(''); const [summary, setSummary] = useState(''); const [multiplier, setMultiplier] = useState(2); const [startsAt, setStartsAt] = useState(initialStart); const [endsAt, setEndsAt] = useState(initialEnd); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { setItems(await getAdminCampaigns()) }
  useEffect(() => { Promise.all([getAdminCampaigns(), getAdminProducts()]).then(([campaigns, productItems]) => { setItems(campaigns); setProducts(productItems.filter((x) => x.isActive)) }).catch(() => setMessage('Kampanya verileri yüklenemedi.')) }, [])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { await createAdminCampaign({ title, summary, pointMultiplier: multiplier, startsAtUtc: new Date(startsAt).toISOString(), endsAtUtc: new Date(endsAt).toISOString(), isActive: true, displayOrder: 1, productId: productId || null }); setTitle(''); setSummary(''); setProductId(''); setMessage('Ürün ve tarih kuralı kod değişmeden yayınlandı.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Kampanya oluşturulamadı.') } finally { setBusy(false) } }
  async function toggle(item: AdminCampaign) { setBusy(true); try { await setAdminCampaignActive(item.id, !item.isActive); await load() } finally { setBusy(false) } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/craftsmen">♧ Ustalar</a><a href="/admin/dealers">▣ Bayiler</a><a className="active" href="/admin/campaigns">◇ Kampanyalar</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Kampanya Yönetimi</h1></div><b>{items.length} kampanya</b></header><div className="campaign-admin-grid"><form className="campaign-create" onSubmit={submit}><h2>Yeni Kampanya</h2><label>Başlık<input value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} maxLength={140} placeholder="Ağustos Çifte Puan" required /></label><label>Geçerli ürün<select value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">Tüm aktif ürünler</option>{products.map((product) => <option value={product.id} key={product.id}>{product.sku} · {product.name}</option>)}</select><small>Tek ürün seçerseniz çarpan yalnızca o ürünün kodlarında çalışır.</small></label><label>Açıklama<textarea value={summary} onChange={(event) => setSummary(event.target.value)} minLength={10} maxLength={500} required /></label><label>Puan çarpanı<input value={multiplier} onChange={(event) => setMultiplier(Number(event.target.value))} type="number" min="1" max="10" step="0.1" required /></label><div><label>Başlangıç<input value={startsAt} onChange={(event) => setStartsAt(event.target.value)} type="datetime-local" required /></label><label>Bitiş<input value={endsAt} onChange={(event) => setEndsAt(event.target.value)} type="datetime-local" required /></label></div>{message && <p>{message}</p>}<button disabled={busy} type="submit">{busy ? 'Kaydediliyor…' : 'Kampanya Kuralını Yayınla'}</button></form><section className="admin-campaign-list">{items.map((item) => <article key={item.id}><div><span>{item.pointMultiplier}X</span><b className={item.isActive ? 'entity-active' : 'entity-passive'}>{item.isActive ? 'Aktif' : 'Pasif'}</b></div><h2>{item.title}</h2><p>{item.summary}</p><strong>{item.productName ?? 'Tüm aktif ürünler'}</strong><small>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.startsAtUtc))} – {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.endsAtUtc))}</small><button onClick={() => toggle(item)} disabled={busy} type="button">{item.isActive ? 'Durdur' : 'Etkinleştir'}</button></article>)}</section></div></section></main>
}

function AdminRewardCard({ initial, onSaved }: { initial: AdminReward; onSaved: () => Promise<void> }) {
  const [item, setItem] = useState(initial); const [saving, setSaving] = useState(false)
  useEffect(() => setItem(initial), [initial])
  async function save() { setSaving(true); try { await updateAdminReward(item); await onSaved() } finally { setSaving(false) } }
  return <article><div className="reward-admin-art">{rewardArt[item.imageKey] ?? '🎁'}</div><div className="reward-admin-fields"><input value={item.name} onChange={(event) => setItem({ ...item, name: event.target.value })} /><textarea value={item.description} onChange={(event) => setItem({ ...item, description: event.target.value })} /><div><label>Puan<input value={item.pointCost} onChange={(event) => setItem({ ...item, pointCost: Number(event.target.value) })} type="number" min="1" /></label><label>Stok<input value={item.stockQuantity ?? ''} onChange={(event) => setItem({ ...item, stockQuantity: event.target.value === '' ? null : Number(event.target.value) })} type="number" min="0" placeholder="Sınırsız" /></label></div></div><label className="reward-active"><input checked={item.isActive} onChange={(event) => setItem({ ...item, isActive: event.target.checked })} type="checkbox" />Aktif</label><button onClick={save} disabled={saving} type="button">{saving ? 'Kaydediliyor…' : 'Kaydet'}</button></article>
}

function AdminRewardsPage() {
  const [items, setItems] = useState<AdminReward[]>([]); const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [pointCost, setPointCost] = useState(1500); const [deliveryType, setDeliveryType] = useState<Reward['deliveryType']>('Digital'); const [stock, setStock] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { setItems(await getAdminRewards()) }
  useEffect(() => { getAdminRewards().then(setItems).catch(() => setMessage('Ödüller yüklenemedi.')) }, [])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { await createAdminReward({ name, description, pointCost, deliveryType, imageKey: deliveryType === 'Digital' ? 'digital-gift' : 'tool-bag', stockQuantity: stock === '' ? null : Number(stock), isActive: true, displayOrder: items.length + 1 }); setName(''); setDescription(''); setMessage('Ödül kataloğa eklendi.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Ödül eklenemedi.') } finally { setBusy(false) } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/craftsmen">♧ Ustalar</a><a href="/admin/dealers">▣ Bayiler</a><a href="/admin/campaigns">◇ Kampanyalar</a><a className="active" href="/admin/rewards">♙ Ödüller</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Ödül Yönetimi</h1></div><b>{items.length} ödül</b></header><div className="reward-admin-grid"><form className="campaign-create" onSubmit={submit}><h2>Yeni Ödül</h2><label>Ödül adı<input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={120} required /></label><label>Açıklama<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={5} maxLength={400} required /></label><label>Puan bedeli<input value={pointCost} onChange={(event) => setPointCost(Number(event.target.value))} type="number" min="1" required /></label><label>Teslim türü<select value={deliveryType} onChange={(event) => setDeliveryType(event.target.value as Reward['deliveryType'])}><option value="Digital">Dijital</option><option value="DealerPickup">Bayiden Teslim</option></select></label><label>Stok — boş bırakılırsa sınırsız<input value={stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" /></label>{message && <p>{message}</p>}<button disabled={busy} type="submit">{busy ? 'Ekleniyor…' : 'Ödülü Ekle'}</button></form><section className="reward-admin-list">{items.map((item) => <AdminRewardCard initial={item} key={item.id} onSaved={load} />)}</section></div></section></main>
}

function AdminProductsPage() {
  const [items, setItems] = useState<AdminProduct[]>([]); const [sku, setSku] = useState(''); const [name, setName] = useState(''); const [basePoints, setBasePoints] = useState(500); const [counts, setCounts] = useState<Record<string, number>>({}); const [generated, setGenerated] = useState<string[]>([]); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { setItems(await getAdminProducts()) }
  useEffect(() => { getAdminProducts().then(setItems).catch(() => setMessage('Ürünler yüklenemedi.')) }, [])
  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { await createAdminProduct({ sku, name, basePoints }); setSku(''); setName(''); setMessage('Ürün tanımlandı.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Ürün eklenemedi.') } finally { setBusy(false) } }
  async function generate(item: AdminProduct) { setBusy(true); setMessage(''); setGenerated([]); try { const result = await generateAdminProductCodes(item.id, counts[item.id] ?? 10); setGenerated(result.codes); setMessage(result.warning); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Kod üretilemedi.') } finally { setBusy(false) } }
  async function copyCodes() { await navigator.clipboard.writeText(generated.join('\n')); setMessage('Kodlar panoya kopyalandı. Güvenli bir dosyaya kaydedin.') }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/craftsmen">♧ Ustalar</a><a href="/admin/dealers">▣ Bayiler</a><a className="active" href="/admin/products">▦ Ürün Kodları</a><a href="/admin/campaigns">◇ Kampanyalar</a><a href="/admin/rewards">♙ Ödüller</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Ürün ve Kod Yönetimi</h1></div><b>{items.length} ürün</b></header><form className="product-create" onSubmit={create}><label>SKU<input value={sku} onChange={(event) => setSku(event.target.value.toUpperCase())} minLength={2} maxLength={50} placeholder="URUN-001" required /></label><label>Ürün adı<input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={160} required /></label><label>Temel puan<input value={basePoints} onChange={(event) => setBasePoints(Number(event.target.value))} type="number" min="1" required /></label><button disabled={busy} type="submit">Ürünü Ekle</button></form>{message && <p className="admin-info-message">{message}</p>}{generated.length > 0 && <section className="generated-codes"><div><h2>Yeni Ürün Kodları</h2><button onClick={copyCodes} type="button">Tümünü Kopyala</button></div><textarea readOnly value={generated.join('\n')} /><small>Ham kodlar veritabanında tutulmaz ve bu ekran kapatıldığında tekrar gösterilemez.</small></section>}<section className="product-admin-list">{items.map((item) => <article key={item.id}><div className="product-admin-head"><div><span>{item.sku}</span><h2>{item.name}</h2></div><b>{numberFormatter.format(item.basePoints)} puan</b></div><div className="product-code-stats"><span>Toplam <b>{item.totalCodes}</b></span><span>Kullanılabilir <b>{item.availableCodes}</b></span><span>Kullanılmış <b>{item.redeemedCodes}</b></span><span>İade <b>{item.returnedCodes}</b></span></div><div className="code-generate"><label>Üretilecek kod<input value={counts[item.id] ?? 10} onChange={(event) => setCounts({ ...counts, [item.id]: Number(event.target.value) })} type="number" min="1" max="1000" /></label><button onClick={() => generate(item)} disabled={busy || !item.isActive} type="button">Kodları Üret</button></div></article>)}</section></section></main>
}

function AdminLoyaltyRulesPage() {
  const [rules, setRules] = useState<LoyaltyRules | null>(null); const [silver, setSilver] = useState(5000); const [gold, setGold] = useState(12500); const [rate, setRate] = useState(20); const [note, setNote] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { const data = await getAdminLoyaltyRules(); setRules(data); setSilver(data.silverThreshold); setGold(data.goldThreshold); setRate(data.pointsPerRewardTry) }
  useEffect(() => { getAdminLoyaltyRules().then((data) => { setRules(data); setSilver(data.silverThreshold); setGold(data.goldThreshold); setRate(data.pointsPerRewardTry) }).catch(() => setMessage('Puan kuralları yüklenemedi.')) }, [])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { await updateAdminLoyaltyRules({ silverThreshold: silver, goldThreshold: gold, pointsPerRewardTry: rate, changeNote: note }); setNote(''); setMessage('Puan ve seviye kuralları yayınlandı.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Kurallar güncellenemedi.') } finally { setBusy(false) } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/products">▦ Ürün Kodları</a><a className="active" href="/admin/loyalty-rules">★ Puan Kuralları</a><a href="/admin/campaigns">◇ Kampanyalar</a><a href="/admin/rewards">♙ Ödüller</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Puan ve Seviye Kuralları</h1></div><b>{rules ? `Son güncelleme ${dateFormatter.format(new Date(rules.updatedAtUtc))}` : 'Yükleniyor'}</b></header><div className="loyalty-rule-grid"><form className="campaign-create" onSubmit={submit}><h2>Aktif Kurallar</h2><label>Gümüş seviye eşiği<input value={silver} onChange={(event) => setSilver(Number(event.target.value))} type="number" min="1" required /></label><label>Altın seviye eşiği<input value={gold} onChange={(event) => setGold(Number(event.target.value))} type="number" min={silver + 1} required /></label><label>1 TL ödül değeri için puan<input value={rate} onChange={(event) => setRate(Number(event.target.value))} type="number" min="1" required /></label><div className="rule-preview"><span>10.000 puanın ödül değeri</span><b>{numberFormatter.format(Math.floor(10000 / Math.max(rate, 1)))} TL'ye kadar</b></div><label>Değişiklik gerekçesi<textarea value={note} onChange={(event) => setNote(event.target.value)} minLength={5} maxLength={300} placeholder="Neden değiştirdiğinizi yazın" required /></label>{message && <p>{message}</p>}<button disabled={busy} type="submit">{busy ? 'Yayınlanıyor…' : 'Kuralları Yayınla'}</button></form><section className="rule-history"><h2>Değişiklik Geçmişi</h2>{rules?.history.length === 0 && <p>Henüz kural değişikliği yapılmadı.</p>}{rules?.history.map((item) => <article key={item.id}><div><b>Gümüş {numberFormatter.format(item.silverThreshold)}</b><b>Altın {numberFormatter.format(item.goldThreshold)}</b><b>{item.pointsPerRewardTry} puan / TL</b></div><p>{item.changeNote}</p><small>{dateFormatter.format(new Date(item.createdAtUtc))}</small></article>)}</section></div></section></main>
}

function AdminSupportCard({ item, onChanged }: { item: AdminSupportRequest; onChanged: () => Promise<void> }) {
  const [status, setStatus] = useState(item.status), [priority, setPriority] = useState(item.priority), [assignedTo, setAssignedTo] = useState(item.assignedTo ?? ''), [reply, setReply] = useState(''), [busy, setBusy] = useState(false), [expanded, setExpanded] = useState(false)
  const save = async () => { setBusy(true); try { await updateAdminSupportRequest(item.id, { status, priority, assignedTo: assignedTo || null }); await onChanged() } finally { setBusy(false) } }
  const send = async (event: FormEvent) => { event.preventDefault(); if (reply.trim().length < 3) return; setBusy(true); try { await replyAdminSupportRequest(item.id, reply); setReply(''); setExpanded(true); await onChanged() } finally { setBusy(false) } }
  const statusNames = { Open: 'Açık', InProgress: 'İşlemde', Resolved: 'Çözüldü', Closed: 'Kapalı' }, priorityNames = { Low: 'Düşük', Normal: 'Normal', High: 'Yüksek', Urgent: 'Acil' }
  return <article className={`support-admin-card priority-${item.priority}`}><div className="support-admin-head"><div><span>{item.category}</span><h2>{item.subject}</h2></div><b className={`support-status ${item.status}`}>{statusNames[item.status]}</b></div><div className="support-craftsman"><strong>{item.craftsman}</strong><small>{item.phoneNumber} · Açılış {dateFormatter.format(new Date(item.createdAtUtc))}</small></div><p>{item.description}</p>{item.referenceValue && <div className="support-admin-reference"><span>İşlem referansı</span><code>{item.referenceValue}</code></div>}<div className="support-controls"><label>Durum<select value={status} onChange={(event) => setStatus(event.target.value as AdminSupportRequest['status'])}>{Object.entries(statusNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Öncelik<select value={priority} onChange={(event) => setPriority(event.target.value as AdminSupportRequest['priority'])}>{Object.entries(priorityNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Atanan kişi<input value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="Destek görevlisi" /></label><button onClick={save} disabled={busy} type="button">Kaydet</button></div><button className="support-history-toggle" onClick={() => setExpanded(!expanded)} type="button">{expanded ? 'Yanıtları gizle' : `Yanıt geçmişi (${item.responses.length})`}</button>{expanded && <div className="support-thread">{item.responses.length === 0 && <small>Henüz yanıt verilmedi.</small>}{item.responses.map((response) => <div key={response.id}><b>{response.author}</b><p>{response.message}</p><time>{dateFormatter.format(new Date(response.createdAtUtc))}</time></div>)}<form onSubmit={send}><textarea value={reply} onChange={(event) => setReply(event.target.value)} minLength={3} maxLength={1500} placeholder="Ustaya verilecek yanıtı yazın…" required /><button disabled={busy} type="submit">Yanıt Gönder</button></form></div>}</article>
}

function AdminSupportPage() {
  const [items, setItems] = useState<AdminSupportRequest[]>([]), [filter, setFilter] = useState(''), [message, setMessage] = useState('')
  const load = async () => { try { setItems(await getAdminSupportRequests(filter || undefined)); setMessage('') } catch { setMessage('Destek talepleri yüklenemedi.') } }
  useEffect(() => { getAdminSupportRequests(filter || undefined).then(setItems).catch(() => setMessage('Destek talepleri yüklenemedi.')) }, [filter])
  const openCount = items.filter((item) => item.status === 'Open').length, urgentCount = items.filter((item) => item.priority === 'Urgent' && item.status !== 'Closed').length
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/transactions">◴ İşlem Geçmişi</a><a href="/admin/reports">▥ Raporlar</a><a className="active" href="/admin/support">☏ Destek</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Destek Yönetimi</h1></div><b>{items.length} talep</b></header>{message && <p className="admin-message">{message}</p>}<div className="support-admin-summary"><article><small>Açık Talepler</small><strong>{openCount}</strong></article><article><small>Acil Talepler</small><strong>{urgentCount}</strong></article><label>Duruma göre filtrele<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Tüm talepler</option><option value="Open">Açık</option><option value="InProgress">İşlemde</option><option value="Resolved">Çözüldü</option><option value="Closed">Kapalı</option></select></label></div><section className="support-admin-list">{items.length === 0 && <p>Bu filtrede destek talebi bulunmuyor.</p>}{items.map((item) => <AdminSupportCard item={item} key={`${item.id}-${item.updatedAtUtc}`} onChanged={load} />)}</section></section></main>
}

function AdminReportsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const initialFrom = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
  const [from, setFrom] = useState(initialFrom), [to, setTo] = useState(today)
  const [report, setReport] = useState<AdminLoyaltyReport | null>(null), [audits, setAudits] = useState<ReportExportAudit[]>([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const load = async () => { setBusy(true); setMessage(''); try { const [data, history] = await Promise.all([getAdminLoyaltyReport(from, to), getReportExportAudits()]); setReport(data); setAudits(history) } catch (error) { setMessage(error instanceof Error ? error.message : 'Rapor yüklenemedi.') } finally { setBusy(false) } }
  useEffect(() => { Promise.all([getAdminLoyaltyReport(initialFrom, today), getReportExportAudits()]).then(([data, history]) => { setReport(data); setAudits(history) }).catch(() => setMessage('Rapor yüklenemedi.')) }, [initialFrom, today])
  const download = async () => { setBusy(true); try { await exportAdminLoyaltyReport(from, to); setAudits(await getReportExportAudits()); setMessage('Maskeli CSV raporu indirildi ve işlem denetim kaydına eklendi.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Rapor indirilemedi.') } finally { setBusy(false) } }
  const maxEarned = Math.max(...(report?.daily.map((item) => item.earned) ?? [1]), 1)
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/transactions">◴ İşlem Geçmişi</a><a className="active" href="/admin/reports">▥ Raporlar</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Sadakat Raporları</h1></div><b>Kişisel veriler maskeli</b></header><form className="report-toolbar" onSubmit={(event) => { event.preventDefault(); void load() }}><label>Başlangıç<input value={from} onChange={(event) => setFrom(event.target.value)} type="date" max={to} /></label><label>Bitiş<input value={to} onChange={(event) => setTo(event.target.value)} type="date" min={from} max={today} /></label><button disabled={busy} type="submit">Raporu Getir</button><button className="export" onClick={download} disabled={busy || !report} type="button">CSV İndir</button></form>{message && <p className="admin-info-message">{message}</p>}<div className="report-stats"><article><small>Kazanılan</small><strong>+{numberFormatter.format(report?.summary.earnedPoints ?? 0)}</strong></article><article><small>Harcanan</small><strong>{numberFormatter.format(report?.summary.spentPoints ?? 0)}</strong></article><article><small>Aktif Usta</small><strong>{report?.summary.uniqueCraftsmen ?? 0}</strong></article><article><small>Ödül Talebi</small><strong>{report?.summary.rewardRequests ?? 0}</strong></article><article><small>Teslim Edilen</small><strong>{report?.summary.fulfilledRewards ?? 0}</strong></article></div><div className="report-grid"><section className="report-panel"><h2>Günlük Puan Kazanımı</h2><div className="report-chart">{report?.daily.length === 0 && <p>Seçilen dönemde hareket bulunmuyor.</p>}{report?.daily.map((item) => <div key={item.date}><time>{new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(`${item.date}T00:00:00`))}</time><span><i style={{ width: `${Math.max(item.earned / maxEarned * 100, item.earned ? 3 : 0)}%` }} /></span><b>{numberFormatter.format(item.earned)}</b></div>)}</div></section><section className="report-panel"><h2>En Çok Puan Kazanan Ustalar</h2><div className="report-ranking">{report?.topCraftsmen.map((item, index) => <article key={`${item.name}-${index}`}><span>{index + 1}</span><div><b>{item.name}</b><small>{item.phoneNumber}</small></div><strong>{numberFormatter.format(item.earnedPoints)}</strong></article>)}</div></section><section className="report-panel"><h2>Ödül Tercihleri</h2><div className="report-ranking">{report?.topRewards.map((item) => <article key={item.name}><span>♙</span><div><b>{item.name}</b><small>{item.count} talep</small></div><strong>{numberFormatter.format(item.points)} puan</strong></article>)}</div></section><section className="report-panel"><h2>Dışa Aktarma Denetimi</h2><div className="report-ranking">{audits.length === 0 && <p>Henüz rapor indirilmedi.</p>}{audits.map((item) => <article key={item.id}><span>CSV</span><div><b>{item.actor}</b><small>{dateFormatter.format(new Date(item.createdAtUtc))}</small></div><strong>{item.rowCount} satır</strong></article>)}</div></section></div></section></main>
}

function AdminPointAdjustmentsPage() {
  const [craftsmen, setCraftsmen] = useState<AdminCraftsman[]>([])
  const [craftsmanId, setCraftsmanId] = useState(''), [amount, setAmount] = useState(0), [reason, setReason] = useState(''), [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { getAdminCraftsmen().then((items) => { setCraftsmen(items.filter((item) => item.isActive)); setCraftsmanId(items.find((item) => item.isActive)?.id ?? '') }).catch(() => setMessage('Usta listesi yüklenemedi.')) }, [])
  const selected = craftsmen.find((item) => item.id === craftsmanId)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try { const result = await createAdminPointAdjustment(craftsmanId, amount, reason.trim()); setMessage(`${result.craftsman} için ${result.amount > 0 ? '+' : ''}${numberFormatter.format(result.amount)} puan kaydedildi. Yeni bakiye: ${numberFormatter.format(result.balance)} puan.`); setAmount(0); setReason(''); setConfirmed(false) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Puan düzeltmesi yapılamadı.') }
    finally { setBusy(false) }
  }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/transactions">◴ İşlem Geçmişi</a><a className="active" href="/admin/adjustments">± Puan Düzeltmesi</a><a href="/admin/support">☏ Destek</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Yetkili Puan Düzeltmesi</h1></div><b>Denetimli işlem</b></header><section className="adjustment-layout"><form className="adjustment-form" onSubmit={submit}><h2>Yeni düzeltme</h2><p>Yalnızca doğrulanmış destek veya operasyon kararlarında kullanın.</p><label>Usta<select value={craftsmanId} onChange={(event) => setCraftsmanId(event.target.value)} required>{craftsmen.map((item) => <option value={item.id} key={item.id}>{item.fullName} · {item.phoneNumber}</option>)}</select></label>{selected && <div className="adjustment-balance"><span>Mevcut bakiye</span><strong>{numberFormatter.format(selected.balance)} puan</strong></div>}<label>Düzeltme miktarı<input value={amount || ''} onChange={(event) => setAmount(Number(event.target.value))} type="number" min="-100000" max="100000" placeholder="Örn. 250 veya -250" required /><small>Puan eklemek için pozitif, geri almak için negatif yazın.</small></label><label>Karar ve gerekçe<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={240} placeholder="Destek talebi, kanıt ve karar gerekçesi" required /></label><label className="adjustment-confirm"><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span>Ustayı, miktarı ve gerekçeyi kontrol ettim. Bu işlemin geri alınması için yeni bir ters kayıt gerektiğini biliyorum.</span></label><button disabled={busy || !confirmed || amount === 0 || !craftsmanId} type="submit">{busy ? 'Kaydediliyor…' : 'Düzeltmeyi Kaydet'}</button>{message && <p className="admin-info-message">{message}</p>}</form><aside className="adjustment-rules"><h2>Neden silinmiyor?</h2><p>Puan hareketi finansal kayda benzer. Eski kayıt değiştirilmez; her düzeltme yeni ve izlenebilir bir hareket olarak eklenir.</p><ul><li>İşlemi yapan yönetici kayda eklenir.</li><li>Gerekçe yazmak zorunludur.</li><li>Ustaya uygulama içi bildirim gider.</li><li>Sonuç işlem geçmişinde görünür.</li></ul></aside></section></section></main>
}

function AdminTransactionsPage() {
  const [data, setData] = useState<AdminTransactionResponse | null>(null); const [filter, setFilter] = useState(''); const [message, setMessage] = useState('')
  useEffect(() => { getAdminTransactions(filter || undefined).then(setData).catch(() => setMessage('İşlem geçmişi yüklenemedi.')) }, [filter])
  const typeNames: Record<string, string> = { ProductCodeEarned: 'Ürün Puanı', RewardRedeemed: 'Ödül Harcaması', ReturnReversal: 'İade Geri Alımı', ManualAdjustment: 'Manuel Düzeltme', CouponFulfilled: 'Kupon Teslimi' }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/products">▦ Ürün Kodları</a><a href="/admin/loyalty-rules">★ Puan Kuralları</a><a className="active" href="/admin/transactions">◴ İşlem Geçmişi</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>İşlem Geçmişi</h1></div><b>{data?.rows.length ?? 0} işlem</b></header>{message && <p className="admin-message">{message}</p>}<div className="transaction-stats"><article><small>Kazanılan Puan</small><strong>+{numberFormatter.format(data?.summary.earnedPoints ?? 0)}</strong></article><article><small>Harcanan Puan</small><strong>-{numberFormatter.format(data?.summary.spentPoints ?? 0)}</strong></article><article><small>İadede Alınan</small><strong>-{numberFormatter.format(data?.summary.reversedPoints ?? 0)}</strong></article><article><small>Teslim Kupon</small><strong>{numberFormatter.format(data?.summary.fulfilledCoupons ?? 0)}</strong></article></div><div className="transaction-filter"><label>İşlem türü<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Tüm işlemler</option><option value="ProductCodeEarned">Ürün puanı</option><option value="RewardRedeemed">Ödül harcaması</option><option value="ReturnReversal">İade geri alımı</option><option value="ManualAdjustment">Manuel düzeltme</option><option value="CouponFulfilled">Kupon teslimi</option></select></label></div><section className="transaction-table"><div className="transaction-row heading"><span>İşlem</span><span>Usta</span><span>Referans</span><span>Tarih</span><span>Puan</span></div>{data?.rows.map((item) => <article className="transaction-row" key={`${item.category}-${item.id}`}><span><b>{typeNames[item.type] ?? item.type}</b><small>{item.description}{item.dealerEmployee ? ` · ${item.dealerEmployee}` : ''}</small></span><span><b>{item.craftsman}</b><small>{item.phoneNumber}</small></span><span><code>{item.referenceType}</code><small>{item.referenceValue.slice(0, 12)}</small></span><span>{dateFormatter.format(new Date(item.occurredAtUtc))}</span><strong className={item.amount < 0 ? 'negative' : ''}>{item.amount > 0 ? '+' : ''}{numberFormatter.format(item.amount)}</strong></article>)}</section></section></main>
}

function DealerLogin({ onAuthenticated }: { onAuthenticated: (profile: DealerLoginResult) => void }) {
  const [dealerCode, setDealerCode] = useState('YLV-001'), [pin, setPin] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await loginDealer(dealerCode, pin); sessionStorage.setItem('dealer-token', result.token); sessionStorage.setItem('dealer-profile', JSON.stringify(result)); onAuthenticated(result) } catch (error) { setMessage(error instanceof Error ? error.message : 'Giriş yapılamadı.') } finally { setBusy(false) } }
  return <main className="dealer-login"><div className="login-logo">▣</div><span>BAYİ BAĞLANTISI</span><h1>Çalışan Girişi</h1><p>Kupon teslimi ve iade işlemleri yetkili çalışan oturumuyla yapılır.</p><form onSubmit={submit}><label>Bayi kodu<input value={dealerCode} onChange={(event) => setDealerCode(event.target.value.toUpperCase())} minLength={3} maxLength={30} required /></label><label>6 haneli çalışan kodu<input className="dealer-pin" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label><small>Geliştirme girişi: YLV-001 / 123456</small>{message && <p>{message}</p>}<button disabled={busy} type="submit">{busy ? 'Doğrulanıyor…' : 'Güvenli Giriş'}</button></form></main>
}

function DealerPortal({ risk = false }: { risk?: boolean }) {
  const [profile, setProfile] = useState<DealerLoginResult | null>(() => { try { const saved = sessionStorage.getItem('dealer-profile'); const parsed = saved ? JSON.parse(saved) as DealerLoginResult : null; return parsed && new Date(parsed.expiresAtUtc) > new Date() && sessionStorage.getItem('dealer-token') ? parsed : null } catch { return null } })
  if (!profile) return <DealerLogin onAuthenticated={setProfile} />
  const exit = async () => { await logoutDealer(); setProfile(null) }
  return <>{risk ? <DealerRiskPage /> : <DealerApp />}<button className="dealer-logout" onClick={exit} type="button">Oturumu Kapat</button></>
}

function DealerPerformance({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<DealerDashboard | null>(null); const [error, setError] = useState('')
  useEffect(() => { const controller = new AbortController(); getDealerDashboard(controller.signal).then(setData).catch(() => setError('Bayi özeti yüklenemedi.')); return () => controller.abort() }, [refreshKey])
  if (error) return <p className="dealer-message">{error}</p>
  if (!data) return <section className="dealer-performance loading">Bayi katkısı hesaplanıyor…</section>
  return <section className="dealer-performance"><div className="dealer-performance-title"><div><small>BU AYKİ KULÜP KATKISI</small><strong>{data.dealer}</strong></div><b>{numberFormatter.format(data.month.amount)} TL</b></div><div className="dealer-performance-stats"><article><strong>{data.month.sales}</strong><span>Eşleşen satış</span></article><article><strong>{data.month.uniqueCraftsmen}</strong><span>Farklı usta</span></article><article><strong>{data.month.fulfilledRewards}</strong><span>Ödül teslimi</span></article><article><strong>{data.month.returns}</strong><span>İade işlemi</span></article></div>{data.recentSales.length > 0 && <details><summary>Son eşleşen satışlar</summary>{data.recentSales.map((sale) => <div key={sale.id}><span><b>{sale.saleReference}</b><small>{sale.craftsman}</small></span><strong>{numberFormatter.format(sale.totalAmount)} TL</strong></div>)}</details>}</section>
}

function DealerSalePanel({ onSaved }: { onSaved: () => void }) {
  const [membershipToken, setMembershipToken] = useState(''), [saleReference, setSaleReference] = useState(''), [totalAmount, setTotalAmount] = useState(0), [verifiedName, setVerifiedName] = useState(''), [result, setResult] = useState<DealerSaleResult | null>(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false); const memberVideoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => { if (!cameraOpen) return; let stopped = false; let stream: MediaStream | null = null; const start = async () => { const Detector = (window as typeof window & { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector; if (!Detector || !navigator.mediaDevices?.getUserMedia) { setMessage('Bu cihazda kamera taraması desteklenmiyor; kodu elle girebilirsiniz.'); setCameraOpen(false); return } try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); if (!memberVideoRef.current) return; memberVideoRef.current.srcObject = stream; await memberVideoRef.current.play(); const detector = new Detector({ formats: ['qr_code'] }); const scan = async () => { if (stopped || !memberVideoRef.current) return; const found = await detector.detect(memberVideoRef.current).catch(() => []); if (found[0]?.rawValue) { setMembershipToken(found[0].rawValue.toUpperCase()); setCameraOpen(false); return } window.setTimeout(scan, 300) }; void scan() } catch { setMessage('Kamera açılamadı; üyelik kodunu elle girin.'); setCameraOpen(false) } }; void start(); return () => { stopped = true; stream?.getTracks().forEach((track) => track.stop()) } }, [cameraOpen])
  const verify = async () => { setBusy(true); setMessage(''); try { const member = await verifyMembershipPass(membershipToken.trim().toUpperCase()); setVerifiedName(`${member.craftsman} · ${levelNames[member.level] ?? member.level}`) } catch (error) { setVerifiedName(''); setMessage(error instanceof Error ? error.message : 'Üyelik doğrulanamadı.') } finally { setBusy(false) } }
  const save = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(''); try { const sale = await createDealerSale(membershipToken.trim().toUpperCase(), saleReference.trim().toUpperCase(), totalAmount); setResult(sale); setVerifiedName(''); setMembershipToken(''); setSaleReference(''); setTotalAmount(0); onSaved() } catch (error) { setMessage(error instanceof Error ? error.message : 'Satış eşleştirilemedi.') } finally { setBusy(false) } }
  return <><form className="dealer-search dealer-sale" onSubmit={save}>{cameraOpen && <video className="dealer-member-camera" ref={memberVideoRef} playsInline muted />}<button onClick={() => setCameraOpen(!cameraOpen)} type="button">{cameraOpen ? 'Kamerayı Kapat' : 'Kamerayla QR Okut'}</button><label>Üyelik QR kodu<input value={membershipToken} onChange={(event) => { setMembershipToken(event.target.value.toUpperCase()); setVerifiedName('') }} minLength={8} placeholder="UKM-..." required /></label><button onClick={verify} disabled={busy || membershipToken.length < 8} type="button">Ustayı Doğrula</button>{verifiedName && <p className="verified-member">✓ {verifiedName}</p>}<label>Satış referansı<input value={saleReference} onChange={(event) => setSaleReference(event.target.value.toUpperCase())} minLength={3} maxLength={80} placeholder="FIS-2026-001" required /></label><label>Satış toplamı<input value={totalAmount} onChange={(event) => setTotalAmount(Number(event.target.value))} type="number" min="0" step="0.01" required /></label><button disabled={busy || !verifiedName} type="submit">Satışı Ustayla Eşleştir</button></form>{message && <p className="dealer-message">{message}</p>}{result && <section className="dealer-return-result"><span>✓</span><div><b>{result.craftsman}</b><p>{result.saleReference} numaralı satış eşleştirildi.</p><small>{numberFormatter.format(result.totalAmount)} TL</small></div></section>}</>
}

function DealerApp() {
  const [mode, setMode] = useState<'coupon' | 'return' | 'sale'>('coupon'); const [activityVersion, setActivityVersion] = useState(0); const [code, setCode] = useState(''); const [reason, setReason] = useState(''); const [coupon, setCoupon] = useState<DealerCoupon | null>(null); const [returnResult, setReturnResult] = useState<ProductReturnResult | null>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  function changeMode(next: 'coupon' | 'return' | 'sale') { setMode(next); setCode(''); setReason(''); setCoupon(null); setReturnResult(null); setMessage('') }
  async function verify(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); setCoupon(null); try { setCoupon(await verifyDealerCoupon(code.trim().toUpperCase())) } catch (error) { setMessage(error instanceof Error ? error.message : 'Kupon doğrulanamadı.') } finally { setBusy(false) } }
  async function fulfill() { setBusy(true); setMessage(''); try { const result = await fulfillDealerCoupon(code.trim().toUpperCase()); setCoupon(result); if (!result.alreadyProcessed) setActivityVersion((value) => value + 1); setMessage(result.alreadyProcessed ? 'Bu teslim daha önce onaylanmış.' : 'Ödül teslimi başarıyla onaylandı.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Teslim onaylanamadı.') } finally { setBusy(false) } }
  async function returnProduct(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); setReturnResult(null); try { const result = await returnDealerProduct(code.trim().toUpperCase(), reason.trim()); setReturnResult(result); if (!result.alreadyProcessed) setActivityVersion((value) => value + 1); setMessage(result.alreadyProcessed ? 'Bu ürün daha önce iade edilmiş.' : 'Ürün iadesi ve puan geri alma tamamlandı.') } catch (error) { setMessage(error instanceof Error ? error.message : 'İade tamamlanamadı.') } finally { setBusy(false) } }
  const expired = coupon?.expiresAtUtc ? new Date(coupon.expiresAtUtc) <= new Date() : false
  return <main className="dealer-shell"><header><div><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Bayi Paneli</strong></div></div><i>Yalova Merkez Bayi</i></header><DealerPerformance refreshKey={activityVersion} /><nav className="dealer-tabs"><button className={mode === 'coupon' ? 'active' : ''} onClick={() => changeMode('coupon')} type="button">Kupon Teslimi</button><button className={mode === 'return' ? 'active' : ''} onClick={() => changeMode('return')} type="button">Ürün İadesi</button><button className={mode === 'sale' ? 'active' : ''} onClick={() => changeMode('sale')} type="button">Satış Eşleştir</button></nav><section className="dealer-hero"><span>{mode === 'coupon' ? '▦' : mode === 'sale' ? '♧' : '↩'}</span><h1>{mode === 'coupon' ? 'Kupon Doğrula' : mode === 'sale' ? 'Satışı Ustayla Eşleştir' : 'Ürün İadesi'}</h1><p>{mode === 'coupon' ? 'Ustanın kupon kodunu kontrol edin. Doğrulama kuponu tüketmez.' : mode === 'sale' ? 'Ustanın iki dakikalık üyelik QR’ını doğrulayarak satışı güvenle eşleştirin.' : 'İade edilen ürünün kodunu ve iade nedenini girin. Kazanılan puan geri alınır.'}</p></section>{mode === 'sale' ? <DealerSalePanel onSaved={() => setActivityVersion((value) => value + 1)} /> : mode === 'coupon' ? <form className="dealer-search" onSubmit={verify}><label>Kupon kodu</label><div><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="UK-XXXXXXXXXXXX" minLength={6} required autoFocus /><button disabled={busy} type="submit">{busy ? 'Kontrol…' : 'Doğrula'}</button></div></form> : <form className="dealer-search dealer-return" onSubmit={returnProduct}><label>Ürün kodu<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="USTA-XXXX-XXXX" minLength={8} required autoFocus /></label><label>İade nedeni<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={200} placeholder="İade nedenini yazın" required /></label><button disabled={busy} type="submit">{busy ? 'İşleniyor…' : 'İadeyi Tamamla'}</button></form>}{message && <p className="dealer-message">{message}</p>}{coupon && <section className="dealer-coupon"><div className={`dealer-validity ${coupon.status === 'Created' && !expired ? 'valid' : ''}`}><span>{coupon.status === 'Created' && !expired ? '✓' : '!'}</span><div><b>{coupon.status === 'Created' && !expired ? 'Kupon geçerli' : coupon.status === 'Fulfilled' ? 'Kupon kullanılmış' : 'Kupon kullanılamaz'}</b><small>{coupon.fulfillmentCode}</small></div></div><dl><div><dt>Ödül</dt><dd>{coupon.reward}</dd></div><div><dt>Usta</dt><dd>{coupon.craftsman}</dd></div><div><dt>Son kullanım</dt><dd>{coupon.expiresAtUtc ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(coupon.expiresAtUtc)) : 'Süresiz'}</dd></div></dl><button className="dealer-fulfill" onClick={fulfill} disabled={busy || coupon.status !== 'Created' || expired} type="button">{coupon.status === 'Fulfilled' ? 'Teslim Edilmiş' : 'Teslimi Onayla'}</button><small className="dealer-warning">Teslim onayı geri alınamaz. Ödülü ustaya verdikten sonra onaylayın.</small></section>}{returnResult && <section className="dealer-return-result"><span>✓</span><div><b>{returnResult.product ?? 'Ürün'} iade edildi</b><p>{numberFormatter.format(returnResult.reversedPoints)} puan geri alındı.</p>{returnResult.balance !== undefined && <small>Yeni puan bakiyesi: {numberFormatter.format(returnResult.balance)}</small>}</div></section>}<footer><a href="/">Usta uygulamasına dön</a><span>Demo Bayi Görevlisi</span></footer></main>
}

function CraftsmanApp() {
  const [craftsmanId, setCraftsmanId] = useState(() => { const expires = localStorage.getItem('usta-session-expires'); return localStorage.getItem('usta-token') && expires && new Date(expires) > new Date() ? localStorage.getItem('usta-craftsman-id') ?? '' : '' })
  const [needsProfile, setNeedsProfile] = useState(() => localStorage.getItem('usta-needs-profile') === 'true')
  const [screen, setScreen] = useState<Screen>('home')
  const [dashboard, setDashboard] = useState(cachedDashboard)
  const [connected, setConnected] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    if (!craftsmanId) return
    const controller = new AbortController()
    getCraftsmanDashboard(craftsmanId, controller.signal)
      .then((data) => { setDashboard(data); localStorage.setItem('usta-dashboard-cache', JSON.stringify(data)); setConnected(true) })
      .catch(() => setConnected(false))
    return () => controller.abort()
  }, [craftsmanId])

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])

  async function refreshDashboard() {
    const data = await getCraftsmanDashboard(craftsmanId)
    setDashboard(data)
    localStorage.setItem('usta-dashboard-cache', JSON.stringify(data))
    setConnected(true)
  }

  function authenticated(result: { craftsmanId: string; needsProfile: boolean; token: string; expiresAtUtc: string }) { localStorage.setItem('usta-craftsman-id', result.craftsmanId); localStorage.setItem('usta-needs-profile', String(result.needsProfile)); localStorage.setItem('usta-token', result.token); localStorage.setItem('usta-session-expires', result.expiresAtUtc); setCraftsmanId(result.craftsmanId); setNeedsProfile(result.needsProfile) }
  function profileCompleted() { localStorage.removeItem('usta-needs-profile'); setNeedsProfile(false); void refreshDashboard() }
  function logout() { void logoutCraftsman(); localStorage.removeItem('usta-craftsman-id'); localStorage.removeItem('usta-needs-profile'); localStorage.removeItem('usta-dashboard-cache'); localStorage.removeItem('usta-token'); localStorage.removeItem('usta-session-expires'); clearPendingRedemptions(); setCraftsmanId(''); setNeedsProfile(false); setDashboard(fallbackDashboard); setScreen('home') }

  if (!craftsmanId) return <Login onAuthenticated={authenticated} />
  if (needsProfile) return <ProfileSetup craftsmanId={craftsmanId} onCompleted={profileCompleted} />

  return <main className="app-shell">
    <div className="status-bar"><strong>9:41</strong><span>▮▮ ◔ ▰</span></div>
    {!online && <div className="offline-banner">⌁ Çevrimdışısın — kayıtlı bakiye gösteriliyor. Son güncelleme: {dashboard.updatedAtUtc === fallbackDashboard.updatedAtUtc ? 'bilinmiyor' : dateFormatter.format(new Date(dashboard.updatedAtUtc))}</div>}
    {screen === 'home' && <Home go={setScreen} dashboard={dashboard} connected={connected} />}
    {screen === 'scan' && <Scanner back={() => setScreen('home')} craftsmanId={dashboard.craftsmanId} onRedeemed={refreshDashboard} />}
    {screen === 'rewards' && <Rewards availablePoints={dashboard.availablePoints} pointDebt={dashboard.pointDebt} craftsmanId={dashboard.craftsmanId} onBalanceChanged={refreshDashboard} />}
    {screen === 'wallet' && <Wallet dashboard={dashboard} go={setScreen} />}
    {screen === 'coupons' && <Coupons craftsmanId={dashboard.craftsmanId} back={() => setScreen('home')} />}
    {screen === 'campaigns' && <Campaigns back={() => setScreen('home')} />}
    {screen === 'notifications' && <Notifications craftsmanId={dashboard.craftsmanId} back={() => setScreen('home')} />}
    {screen === 'support' && <Support craftsmanId={dashboard.craftsmanId} back={() => setScreen('home')} />}
    {screen === 'profile' && <Profile craftsmanId={dashboard.craftsmanId} onUpdated={refreshDashboard} onLogout={logout} />}
    <BottomNav screen={screen} setScreen={setScreen} />
  </main>
}

function App() { const path = window.location.pathname; return path.startsWith('/admin') ? <AdminPortal /> : path.startsWith('/dealer/risk') ? <DealerPortal risk /> : path.startsWith('/dealer') ? <DealerPortal /> : <CraftsmanApp /> }

export default App
