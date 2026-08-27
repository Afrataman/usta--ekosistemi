import { useEffect, useRef, useState, type FormEvent } from 'react'
import { confirmCraftsmanPhoneChange, createAdminCampaign, createAdminPointAdjustment, createAdminProduct, createAdminReward, createDealerSale, createMembershipPass, createSupportRequest, exportAdminLoyaltyReport, fulfillDealerCoupon, generateAdminProductCodes, getAdminCampaigns, getAdminCraftsmen, getAdminDealers, getAdminLoyaltyReport, getAdminLoyaltyRules, getAdminOverview, getAdminProducts, getAdminRewards, getAdminRiskCases, getAdminSupportRequests, getAdminTransactions, getCampaigns, getCraftsmanDashboard, getCraftsmanProfile, getDealerDashboard, getNotifications, getReportExportAudits, getRewardRedemptions, getRewards, getSupportRequests, getWallet, loginAdmin, loginDealer, logoutAdmin, logoutCraftsman, logoutDealer, markAllNotificationsRead, markNotificationRead, redeemProductCode, redeemReward, replyAdminSupportRequest, replySupportRequest, reportDealerRisk, requestCraftsmanPhoneChange, requestOtpCode, returnDealerProduct, setAdminCampaignActive, setAdminEntityActive, setAdminProductActive, updateAdminLoyaltyRules, updateAdminReward, updateAdminRiskStatus, updateAdminSupportRequest, updateCraftsmanProfile, verifyDealerCoupon, verifyMembershipPass, verifyOtpCode, type AdminLoginResult, type AdminCampaign, type AdminCraftsman, type AdminDealer, type AdminLoyaltyReport, type AdminOverview, type AdminProduct, type AdminReward, type AdminRiskCase, type AdminSupportRequest, type AdminTransactionResponse, type Campaign, type CraftsmanNotification, type CraftsmanProfile, type Dashboard, type DealerCoupon, type DealerDashboard, type DealerLoginResult, type DealerSaleResult, type MembershipPassResult, type LoyaltyRules, type ProductReturnResult, type ReportExportAudit, type Reward, type RewardRedemption, type RewardRedemptionResult, type SupportItem, type Wallet as WalletData } from './api'
import { createAdminDealerEmployee, getAdminDealerEmployees, resetAdminDealerEmployeePin, setAdminDealerEmployeeActive, type AdminDealerEmployee } from './api'
import { getAdminNotificationAudience, getAdminNotificationHistory, sendAdminTargetedNotification, type AdminNotificationHistory } from './api'
import { getCraftsmanConsentHistory, type CraftsmanConsentHistoryItem } from './api'
import { importAdminProductCodes, validateAdminProductCodes, type ProductCodeValidationResult } from './api'
import { getDealerActivity, type DealerActivityResponse } from './api'
import { getAdminCoupons, type AdminCouponResponse } from './api'
import { onboardAdminDealer, type DealerOnboardingResult } from './api'
import { getAdminAudit, type AdminAuditResponse } from './api'
import { decideAdminCampaignApproval, getAdminCampaignApprovals, type CampaignApproval } from './api'
import { getAdminOutbox, retryAdminOutbox, type AdminOutboxResponse } from './api'
import { ApiRequestError } from './api'
import { authStore } from './authStore'
import './App.css'
import { clearPendingRedemptions, enqueueRedemption, getPendingRedemptions, removePendingRedemption } from './offlineQueue'
import QRCode from 'qrcode'

type Screen = 'home' | 'scan' | 'rewards' | 'wallet' | 'coupons' | 'campaigns' | 'notifications' | 'support' | 'profile'
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setInstallEvent(event as BeforeInstallPromptEvent); setVisible(true) }
    window.addEventListener('beforeinstallprompt', capture)
    return () => window.removeEventListener('beforeinstallprompt', capture)
  }, [])
  async function install() { if (!installEvent) return; await installEvent.prompt(); const choice = await installEvent.userChoice; setInstallEvent(null); if (choice.outcome === 'accepted') setVisible(false) }
  return visible && installEvent ? <div className="pwa-install"><span>⚒ Usta Kulübü’nü telefonuna ekle</span><button onClick={() => void install()} type="button">Yükle</button><button aria-label="Kapat" onClick={() => setVisible(false)} type="button">×</button></div> : null
}

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
function dashboardUpdatedLabel(updatedAtUtc: string) { return updatedAtUtc === fallbackDashboard.updatedAtUtc ? 'Henüz senkronize edilmedi' : dateFormatter.format(new Date(updatedAtUtc)) }
const shouldKeepPendingRedemption = (error: unknown) => error instanceof TypeError || (error instanceof ApiRequestError && (error.status === 401 || error.status === 403 || error.status === 429 || error.status >= 500))
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
        <div><strong>{numberFormatter.format(dashboard.availablePoints)} <small>puan</small></strong><p>Bu puanla alabileceğiniz ödüllerin<br />değeri: {numberFormatter.format(dashboard.rewardValueTry)} TL'ye kadar</p><small className="points-updated">Son güncelleme: {dashboardUpdatedLabel(dashboard.updatedAtUtc)}</small></div><span className="gift-art">♙</span>
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

      <div className="section-row"><h2>Son Puan Hareketleri</h2><button onClick={() => go('wallet')} type="button" aria-label="Tüm puan hareketlerini görüntüle">Tümü ›</button></div>
      <div className="movement-list">{dashboard.movements.map((movement, index) => <div key={`${movement.createdAtUtc}-${index}`}><span>{movement.description}</span><time>{dateFormatter.format(new Date(movement.createdAtUtc))}</time><b className={movement.amount < 0 ? 'minus' : ''}>{movement.amount > 0 ? '+' : ''}{numberFormatter.format(movement.amount)}</b></div>)}</div>
    </>
  )
}

function Scanner({ back, craftsmanId, onRedeemed }: { back: () => void; craftsmanId: string; onRedeemed: () => Promise<void> }) {
  const [manualEntryOpen, setManualEntryOpen] = useState(false)
  const [code, setCode] = useState('')
  const [codeInputError, setCodeInputError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [cameraState, setCameraState] = useState<'starting' | 'active' | 'unavailable' | 'denied'>('starting')
  const [cameraAttempt, setCameraAttempt] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  const [helpOpen, setHelpOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)

  useEffect(() => {
    const updateOnlineState = () => setOnline(navigator.onLine)
    window.addEventListener('online', updateOnlineState)
    window.addEventListener('offline', updateOnlineState)
    return () => { window.removeEventListener('online', updateOnlineState); window.removeEventListener('offline', updateOnlineState) }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function startCamera() {
      // BarcodeDetector API kontrolü (Modern tarayıcılar için)
      const Detector = (window as typeof window & { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector

      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
          setCameraState('unavailable')
          setManualEntryOpen(true) // Kamera yoksa doğrudan elle girişi aç
          return
      }

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
            if (found[0]?.rawValue) {
                scanningRef.current = true;
                setCode(found[0].rawValue.trim().toUpperCase());
                setManualEntryOpen(true);
                setResult({ kind: 'success', message: '✓ QR kod okundu. Kodu onaylayarak işlemi tamamlayın.' });
                return
            }
          } catch { /* Kamera bir sonraki karede yeniden denenir. */ }
          window.setTimeout(scan, 350)
        }
        void scan()
      } catch (error: unknown) {
          if (!cancelled) {
              // İzin reddedildiyse veya kamera başka bir uygulama tarafından kullanılıyorsa
              if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
                  setCameraState('denied')
              } else {
                  setCameraState('unavailable')
              }
              setManualEntryOpen(true) // Hata durumunda da elle girişi otomatik aç
          }
      }
    }
    void startCamera()
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((track) => track.stop()) }
  }, [cameraAttempt])

  function retryCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    scanningRef.current = false
    setManualEntryOpen(false)
    setResult(null)
    setCameraState('starting')
    setCameraAttempt((attempt) => attempt + 1)
  }

  useEffect(() => {
    let active = true
    const retryPending = async () => {
      const pending = await getPendingRedemptions(craftsmanId)
      if (active) setPendingCount(pending.length)
      if (!navigator.onLine) return
      for (const item of pending) {
        try { await redeemProductCode(item.craftsmanId, item.code, item.requestId); await removePendingRedemption(item.requestId); if (active) setPendingCount((count) => Math.max(0, count - 1)); await onRedeemed(); if (active) setResult({ kind: 'success', message: 'Bekleyen ürün kodu sunucuda güvenle işlendi.' }) }
        catch (error) { if (shouldKeepPendingRedemption(error)) { if (active) setResult({ kind: 'error', message: 'Bekleyen işlem henüz gönderilemedi; bağlantı veya oturum düzelince tekrar denenecek.' }); return } await removePendingRedemption(item.requestId); if (active) { setPendingCount((count) => Math.max(0, count - 1)); setResult({ kind: 'error', message: error instanceof Error ? error.message : 'Bekleyen kod işlenemedi.' }) } }
      }
    }
    void retryPending(); window.addEventListener('online', retryPending)
    return () => { active = false; window.removeEventListener('online', retryPending) }
  }, [craftsmanId, onRedeemed])

  // Elle girilen kodun formatını düzenleme (Sadece harf, rakam ve tire)
  const handleCodeInput = (value: string) => {
      const sanitized = value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
      setCode(sanitized)
      setCodeInputError(sanitized !== value.toUpperCase() ? 'Kod yalnızca harf, rakam ve tire içerebilir.' : '')
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!craftsmanId) {
      setResult({ kind: 'error', message: 'Bağlantı hatası: Kullanıcı oturumu bulunamadı.' })
      return
    }
    if (code.length < 8) {
      setResult({ kind: 'error', message: 'Ürün kodu en az 8 karakter olmalıdır.' })
      return
    }
    if (code.startsWith('-') || code.endsWith('-') || code.includes('--')) {
      setResult({ kind: 'error', message: 'Kod biçimi geçersiz. Tireler yalnızca bölümler arasında kullanılabilir.' })
      return
    }

    const normalizedCode = code.trim(), requestId = crypto.randomUUID()
    setSubmitting(true)
    setResult(null)

    if (!navigator.onLine) {
      const count = await enqueueRedemption({ requestId, craftsmanId, code: normalizedCode, createdAtUtc: new Date().toISOString() })
      setPendingCount(count); setResult({ kind: 'success', message: 'İnternet yok. İşlem şifreli kuyruğa alındı, bağlantı gelince otomatik yüklenecek.' }); setSubmitting(false); setCode(''); return
    }

    try {
      const response = await redeemProductCode(craftsmanId, normalizedCode, requestId)
      await onRedeemed()
      setResult({ kind: 'success', message: `✓ ${response.product}: +${numberFormatter.format(response.earnedPoints)} puan eklendi.` })
      setCode('')
      scanningRef.current = false // Kamerayı yeni okuma için serbest bırak
    } catch (error) {
      if (shouldKeepPendingRedemption(error)) { const count = await enqueueRedemption({ requestId, craftsmanId, code: normalizedCode, createdAtUtc: new Date().toISOString() }); setPendingCount(count); setResult({ kind: 'success', message: 'İşlem şu an tamamlanamadı; güvenli kuyruğa alındı ve tekrar denenecek.' }); setCode('') }
      else setResult({ kind: 'error', message: error instanceof Error ? error.message : 'Kod kullanılamadı.' })
      scanningRef.current = false
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="page-header"><button onClick={back} aria-label="Geri Dön" type="button">‹</button><h1>Ürün Kodunu Okut</h1><button onClick={() => setHelpOpen((open) => !open)} aria-expanded={helpOpen} aria-controls="scanner-help" type="button" aria-label="QR okutma yardımı">?</button></header>

      {helpOpen && <aside className="scanner-help" id="scanner-help" role="dialog" aria-label="QR okutma yardımı"><strong>QR nasıl okutulur?</strong><p>Kodu aydınlık bir ortamda çerçevenin içine hizalayın. Kamera izni verilmezse aşağıdaki “Kodu Elle Gir” seçeneğini kullanabilirsiniz.</p><button onClick={() => setHelpOpen(false)} type="button">Anladım</button></aside>}

      {cameraState === 'active' && <p className="scan-instruction">Kodu çerçevenin içine hizalayın</p>}

      <div className="camera-frame" aria-live="polite">
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <video className={cameraState === 'active' ? 'camera-preview active' : 'camera-preview'} ref={videoRef} playsInline muted aria-label="QR kod kamerası" />

        {cameraState === 'starting' && <span className="camera-status">Kamera hazırlanıyor…</span>}

        {cameraState === 'denied' && (
            <div className="camera-error-box">
                <span className="camera-error-icon">⊘</span>
                <strong>Kamera İzni Gerekli</strong>
                <small>Kameranızı kullanabilmemiz için tarayıcı ayarlarından izin vermelisiniz.</small>
                <button className="camera-retry" onClick={retryCamera} type="button">Tekrar Dene</button>
            </div>
        )}

        {cameraState === 'unavailable' && (
            <div className="camera-error-box">
                <span className="camera-error-icon">⚠</span>
                <strong>Kamera Bulunamadı</strong>
                <small>Cihazınızda desteklenen bir kamera bulunamadı veya şu an kullanılamıyor.</small>
                <button className="camera-retry" onClick={retryCamera} type="button">Tekrar Dene</button>
            </div>
        )}
      </div>

      {cameraState === 'active' && (
          <button className="secondary-action scanner-manual" onClick={() => setManualEntryOpen((open) => !open)} type="button" aria-expanded={manualEntryOpen}>
              <span>⌨</span>{manualEntryOpen ? 'Elle Girişi Gizle' : 'Kodu Elle Gir'}
          </button>
      )}

      {manualEntryOpen && (
          <form className="manual-code-form" onSubmit={submitCode}>
            <label htmlFor="product-code">Ürün Kodu</label>
            <div>
                <input
                    id="product-code"
                    value={code}
                    onChange={(event) => handleCodeInput(event.target.value)}
                    placeholder="Örn. USTA-DEMO-2026"
                    minLength={8}
                    maxLength={30}
                    required
                    autoComplete="off"
                />
                <button disabled={submitting || code.length < 8 || Boolean(codeInputError)} type="submit">
                    {submitting ? 'İşleniyor…' : 'Kodu Kullan'}
                </button>
            </div>
            {codeInputError && <small className="manual-code-error">{codeInputError}</small>}
            {/* Erişilebilirlik için durumu sesli okuyucuya aktarıyoruz */}
            <div aria-live="assertive">
                {result && <p className={`result-message ${result.kind}`}>{result.message}</p>}
            </div>
          </form>
      )}

      <section className="how-card">
          <h2>Nasıl Çalışır?</h2>
          <div className="steps">
              <div><span>▦</span><small>Kodu Okut</small></div><b>→</b>
              <div><span>♢</span><small>Doğrulansın</small></div><b>→</b>
              <div><span>★</span><small>Puan Eklensin</small></div>
          </div>
          <p>♢ Her ürün kodu yalnızca bir kez kullanılabilir.</p>
      </section>

      {(pendingCount > 0 || !online) && (
          <div className="connection-warning" role="alert">
              ⌁ <strong>{pendingCount > 0 ? `${pendingCount} işlem bekliyor — bağlantı gelince otomatik denenecek` : 'İnternet yok — yeni okutulan kodlar kuyruğa alınacak'}</strong>
          </div>
      )}
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

  // Yeni State'ler: Filtreleme ve Detay Modalı için
  const [filter, setFilter] = useState<'all' | 'earned' | 'spent' | 'returned' | 'adjustment'>('all')
  const [selectedMovement, setSelectedMovement] = useState<WalletData['movements'][number] | null>(null)

  useEffect(() => {
    if (!dashboard.craftsmanId) return
    const controller = new AbortController()
    getWallet(dashboard.craftsmanId, controller.signal).then(setWallet).catch(() => setError(true))
    return () => controller.abort()
  }, [dashboard.craftsmanId, dashboard.balance])

  const availablePoints = wallet?.availablePoints ?? dashboard.availablePoints
  const pointDebt = wallet?.pointDebt ?? dashboard.pointDebt
  const movements = wallet?.movements ?? dashboard.movements.map((movement, index) => ({ ...movement, id: String(index), transactionType: movement.amount > 0 ? 'ProductCodeEarned' : 'RewardRedeemed', referenceType: 'Demo', referenceId: String(index) }))

  // Hareketleri filtreleme mantığı
  const filteredMovements = movements.filter(m => {
      if (filter === 'earned') return m.transactionType === 'ProductCodeEarned' || (m.amount > 0 && m.transactionType !== 'ReturnReversal')
      if (filter === 'spent') return m.transactionType === 'RewardRedeemed'
      if (filter === 'returned') return m.transactionType === 'ReturnReversal'
      if (filter === 'adjustment') return m.transactionType === 'ManualAdjustment'
      return true
  })

  // İşlem türüne göre başlık/ikon eşleştirmesi (Varsayılan veya Backend'den gelen tipe göre)
  const getTransactionLabel = (movement: WalletData['movements'][number]) => ({ ProductCodeEarned: 'Ürün kodu kazanımı', RewardRedeemed: 'Ödül harcaması', ReturnReversal: 'İade puan geri alımı', ManualAdjustment: 'Yönetici düzeltmesi' }[movement.transactionType] ?? (movement.amount > 0 ? 'Puan kazanımı' : 'Puan hareketi'))

  return (
    <>
      <header className="wallet-header">
          <div>
              <span>PUAN CÜZDANI</span>
              <h1>{dashboard.fullName}</h1>
          </div>
          <b>{levelNames[dashboard.level] ?? dashboard.level}</b>
      </header>

      <section className="wallet-balance">
          <span>Kullanılabilir puanın</span>
          <strong>{numberFormatter.format(availablePoints)} <small>puan</small></strong>
          <p>Bu puanla alabileceğin ödüllerin değeri: <b>{numberFormatter.format(Math.floor(availablePoints / 20))} TL'ye kadar</b></p>
      </section>

      {pointDebt > 0 && (
          <div className="point-debt-warning" role="alert">
              <strong>{numberFormatter.format(pointDebt)} puan açığınız var</strong>
              <span>İade edilen üründen kazanılan puan geri alındı. Yeni puanlarınız önce bu açığı kapatacak.</span>
          </div>
      )}

      <div className="wallet-actions">
          <button onClick={() => go('scan')} type="button"><span>▦</span>Puan Kazan</button>
          <button onClick={() => go('rewards')} disabled={pointDebt > 0} type="button"><span>♙</span>{pointDebt > 0 ? 'Ödüller Kilitli' : 'Ödüllere Git'}</button>
      </div>

      <div className="wallet-title">
          <h2>Puan hareketleri</h2>
          {/* İşlevsel Filtreleme Seçeneği */}
          <select
              className="movement-filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'earned' | 'spent' | 'returned' | 'adjustment')}
              aria-label="Puan hareketlerini filtrele"
          >
              <option value="all">Tümü</option>
              <option value="earned">Kazanılanlar (+)</option>
              <option value="spent">Ödül harcamaları (-)</option>
              <option value="returned">İade geri alımları</option>
              <option value="adjustment">Yönetici düzeltmeleri</option>
          </select>
      </div>

      {error && <p className="wallet-error" role="alert">Bağlantı kurulamadı; son bilinen hareketler gösteriliyor.</p>}

      <section className="wallet-movements">
        {filteredMovements.length === 0 && <p className="empty-wallet">Bu kategoride henüz puan hareketi yok.</p>}
        {filteredMovements.map((movement) => (
          <article
              key={movement.id}
              onClick={() => setSelectedMovement(movement)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedMovement(movement) } }}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
          >
            <span className={movement.amount < 0 ? 'movement-badge spent' : 'movement-badge'}>
                {movement.amount < 0 ? '↙' : '↗'}
            </span>
            <div>
                <strong>{movement.description}</strong>
                <time>{dateFormatter.format(new Date(movement.createdAtUtc))}</time>
            </div>
            <b className={movement.amount < 0 ? 'negative' : ''}>
                {movement.amount > 0 ? '+' : ''}{numberFormatter.format(movement.amount)}
            </b>
          </article>
        ))}
      </section>

      {/* Puan Hareketi Detay Modalı */}
      {selectedMovement && (
          <div className="reward-dialog-backdrop">
              <section className="reward-dialog coupon-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="movement-dialog-title">
                  <button className="dialog-close" onClick={() => setSelectedMovement(null)} type="button" aria-label="Kapat">×</button>

                  <div className="dialog-art" style={{ fontSize: '3rem', margin: '0 auto 10px', display: 'block', textAlign: 'center' }}>
                      {selectedMovement.amount < 0 ? '📉' : '📈'}
                  </div>

                  <h2 id="movement-dialog-title" style={{ textAlign: 'center' }}>
                      {getTransactionLabel(selectedMovement)}
                  </h2>

                  <div className="coupon-code-display" style={{ padding: '15px', background: 'var(--bg-card)', borderRadius: '8px', margin: '15px 0' }}>
                      <code className={`large-code ${selectedMovement.amount < 0 ? 'negative' : ''}`} style={{ fontSize: '24px' }}>
                          {selectedMovement.amount > 0 ? '+' : ''}{numberFormatter.format(selectedMovement.amount)} Puan
                      </code>
                  </div>

                  <div className="coupon-meta-info">
                      <p><strong>Açıklama:</strong> {selectedMovement.description}</p>
                      <p><strong>Tarih:</strong> {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'medium' }).format(new Date(selectedMovement.createdAtUtc))}</p>
                      <p><strong>İşlem türü:</strong> {getTransactionLabel(selectedMovement)}</p>
                      <p><strong>Referans:</strong> {selectedMovement.referenceType} · <span style={{ fontSize: '11px', opacity: 0.8 }}>{selectedMovement.referenceId}</span></p>
                  </div>

                  <div className="dialog-actions">
                      <button className="dialog-cancel" onClick={() => setSelectedMovement(null)} type="button" style={{ width: '100%', marginTop: '10px' }}>Kapat</button>
                  </div>
              </section>
          </div>
      )}

      <div className="wallet-info">
          ⓘ <span>Puanlar nakit değildir ve banka hesabına çekilemez. Yalnızca Usta Kulübü ödüllerinde kullanılır. Detayını görmek istediğiniz işlemin üzerine tıklayabilirsiniz.</span>
      </div>
    </>
  )
}
function Coupons({ craftsmanId, back }: { craftsmanId: string; back: () => void }) {
  const [items, setItems] = useState<RewardRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  // Yeni State'ler: Sekme yönetimi ve Detay Modalı için
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'used' | 'cancelled'>('all')
  const [selectedCoupon, setSelectedCoupon] = useState<RewardRedemption | null>(null)
  const [qrImage, setQrImage] = useState('')

  useEffect(() => {
    if (!craftsmanId) { setLoading(false); setError('Bağlantı hatası: Oturum bulunamadı.'); return }
    const controller = new AbortController()
    getRewardRedemptions(craftsmanId, controller.signal)
      .then(setItems)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Kuponlar alınamadı.'))
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [craftsmanId])

  // Seçilen sekmeye göre listeyi filtreleme
  const isCouponExpired = (item: RewardRedemption) => item.status === 'Created' && !!item.expiresAtUtc && new Date(item.expiresAtUtc).getTime() <= Date.now()
  const couponStatusLabel = (item: RewardRedemption) => {
      if (isCouponExpired(item)) return 'Süresi Doldu'
      if (item.status === 'Created') return 'Aktif'
      if (item.status === 'Fulfilled') return item.deliveryType === 'Digital' ? 'Teslim Edildi' : 'Kullanıldı'
      return 'İptal'
  }
  const filteredItems = items.filter(item => {
      if (activeTab === 'active') return item.status === 'Created' && !isCouponExpired(item)
      if (activeTab === 'used') return item.status === 'Fulfilled'
      if (activeTab === 'cancelled') return item.status === 'Cancelled' || isCouponExpired(item)
      return true
  })

  // Kupona tıklandığında detay modülünü açma ve QR Kod üretme
  const openCouponDetail = async (item: RewardRedemption) => {
    setSelectedCoupon(item)
    if (item.deliveryType === 'DealerPickup' && item.status === 'Created' && !isCouponExpired(item)) {
        try {
            const qr = await QRCode.toDataURL(item.fulfillmentCode, { width: 240, margin: 1, color: { dark: '#041521', light: '#ffffff' } })
            setQrImage(qr)
        } catch {
            setQrImage('')
        }
    } else {
        setQrImage('')
    }
  }

  async function copyCode(code: string, id: string) {
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(''), 2000)
  }

  return (
    <>
      <header className="page-header coupons-header">
          <button onClick={back} type="button" aria-label="Geri Dön">‹</button>
          <h1>Kuponlarım</h1>
          <span aria-label="Toplam Kupon Sayısı">{items.length}</span>
      </header>

      {/* İşlevsel Filtreleme Sekmeleri */}
      <div className="coupon-tabs" role="tablist">
          <button role="tab" aria-selected={activeTab === 'all'} className={activeTab === 'all' ? 'selected' : ''} onClick={() => setActiveTab('all')} type="button">Tümü</button>
          <button role="tab" aria-selected={activeTab === 'active'} className={activeTab === 'active' ? 'selected' : ''} onClick={() => setActiveTab('active')} type="button">Aktif</button>
          <button role="tab" aria-selected={activeTab === 'used'} className={activeTab === 'used' ? 'selected' : ''} onClick={() => setActiveTab('used')} type="button">Kullanılmış</button>
          <button role="tab" aria-selected={activeTab === 'cancelled'} className={activeTab === 'cancelled' ? 'selected' : ''} onClick={() => setActiveTab('cancelled')} type="button">İptal / Süresi dolan</button>
      </div>

      {loading && <div className="coupon-state" aria-live="polite">Kuponlar yükleniyor…</div>}
      {error && <div className="coupon-state error" role="alert">{error}</div>}

      {!loading && !error && filteredItems.length === 0 && (
          <div className="coupon-empty">
              <span>▰</span>
              <h2>{activeTab === 'all' ? 'Henüz kuponun yok' : 'Bu kategoride kupon bulunamadı'}</h2>
              <p>Ödül kataloğundan bir ödül aldığında teslim kodun burada saklanır.</p>
          </div>
      )}

      <section className="coupon-list">
          {filteredItems.map((item) => (
              <article
                  className={item.status === 'Created' && !isCouponExpired(item) || item.deliveryType === 'Digital' && item.status === 'Fulfilled' ? 'coupon-card' : 'coupon-card inactive'}
                  key={item.id}
                  onClick={() => openCouponDetail(item)} // Tıklanabilirlik eklendi
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void openCouponDetail(item) } }}
              >
                  <div className="coupon-art">{rewardArt[item.imageKey] ?? '🎁'}</div>
                  <div className="coupon-main">
                      <div className="coupon-name">
                          <h2>{item.rewardName}</h2>
                          <span className={isCouponExpired(item) ? 'expired' : ''}>{couponStatusLabel(item)}</span>
                      </div>
                      <p>{item.deliveryType === 'Digital' ? 'Dijital Kod' : 'Bayiden Teslim'} · {numberFormatter.format(item.pointsSpent)} puan</p>
                      <code>{item.fulfillmentCode}</code>
                      <small>Tarih: {dateFormatter.format(new Date(item.createdAtUtc))}</small>
                  </div>
              </article>
          ))}
      </section>

      {/* Kupon Detay Modalı (Bayiye göstermek veya detaylı incelemek için) */}
      {selectedCoupon && (
          <div className="reward-dialog-backdrop">
              <section className="reward-dialog coupon-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="coupon-dialog-title">
                  <button className="dialog-close" onClick={() => setSelectedCoupon(null)} type="button" aria-label="Kapat">×</button>

                  <h2 id="coupon-dialog-title">{selectedCoupon.rewardName}</h2>
                  <p className="delivery-type-badge">
                      {selectedCoupon.deliveryType === 'Digital' ? 'Dijital Ödül' : 'Bayiden Teslim Edilecek'}
                  </p>

                  <div className="coupon-code-display">
                      {qrImage && (
                          <div className="qr-container">
                              <img src={qrImage} alt="Kupon QR Kodu" />
                          </div>
                      )}
                      <code className="large-code">{selectedCoupon.fulfillmentCode}</code>
                  </div>

                  <div className="coupon-meta-info">
                      <p><strong>Durum:</strong> {couponStatusLabel(selectedCoupon)}</p>
                      <p><strong>Puan Bedeli:</strong> {numberFormatter.format(selectedCoupon.pointsSpent)} Puan</p>
                      <p><strong>Alınma Tarihi:</strong> {dateFormatter.format(new Date(selectedCoupon.createdAtUtc))}</p>
                      {selectedCoupon.fulfilledAtUtc && (
                          <p><strong>Teslim Tarihi:</strong> {dateFormatter.format(new Date(selectedCoupon.fulfilledAtUtc))}</p>
                      )}
                      {selectedCoupon.expiresAtUtc && (
                          <p className={isCouponExpired(selectedCoupon) ? 'coupon-expired-note' : ''}><strong>Son Kullanım:</strong> {dateFormatter.format(new Date(selectedCoupon.expiresAtUtc))}{isCouponExpired(selectedCoupon) ? ' (Süresi doldu)' : ''}</p>
                      )}
                      {selectedCoupon.fulfilledByDealer && <p><strong>Teslim Eden Bayi:</strong> {selectedCoupon.fulfilledByDealer}</p>}
                      {selectedCoupon.fulfilledByDealerEmployee && <p><strong>Görevli:</strong> {selectedCoupon.fulfilledByDealerEmployee}</p>}
                  </div>

                  <div className="dialog-actions">
                      <button
                          className="dialog-confirm"
                          onClick={() => void copyCode(selectedCoupon.fulfillmentCode, selectedCoupon.id)}
                          type="button"
                      >
                          {copiedId === selectedCoupon.id ? 'Kopyalandı!' : 'Kodu Kopyala'}
                      </button>
                  </div>
              </section>
          </div>
      )}

      <div className="wallet-info">
          ⓘ <span>Bayiden teslim ödüllerinde kupona tıklayıp açılan büyük kodu bayi görevlisine göster.</span>
      </div>
    </>
  )
}

function Profile({ craftsmanId, onUpdated, onLogout }: { craftsmanId: string; onUpdated: () => Promise<void>; onLogout: () => void }) {
  const [profile, setProfile] = useState<CraftsmanProfile | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [consentHistory, setConsentHistory] = useState<CraftsmanConsentHistoryItem[]>([])
  const [consentHistoryLoading, setConsentHistoryLoading] = useState(true)
  const [consentHistoryError, setConsentHistoryError] = useState('')
  const [membershipPass, setMembershipPass] = useState<MembershipPassResult | null>(null), [membershipQr, setMembershipQr] = useState('')
  const [newPhone, setNewPhone] = useState(''), [phoneChallengeId, setPhoneChallengeId] = useState(''), [phoneCode, setPhoneCode] = useState(''), [developmentPhoneCode, setDevelopmentPhoneCode] = useState(''), [phoneBusy, setPhoneBusy] = useState(false)

  useEffect(() => {
    if (!craftsmanId) return
    const controller = new AbortController()
    getCraftsmanProfile(craftsmanId, controller.signal).then(setProfile).catch(() => setMessage({ kind: 'error', text: 'Profil yüklenemedi. Backend bağlantısını kontrol edin.' }))
    return () => controller.abort()
  }, [craftsmanId])

  useEffect(() => {
    if (!craftsmanId) { setConsentHistoryLoading(false); return }
    const controller = new AbortController()
    getCraftsmanConsentHistory(craftsmanId, controller.signal)
      .then(setConsentHistory)
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) setConsentHistoryError('Onay geçmişi yüklenemedi.') })
      .finally(() => setConsentHistoryLoading(false))
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

  async function showMembershipQr() {
      try {
          const pass = await createMembershipPass(craftsmanId);
          setMembershipPass(pass);
          setMembershipQr(await QRCode.toDataURL(pass.token, { width: 240, margin: 1, color: { dark: '#041521', light: '#ffffff' } }))
      } catch (error) {
          setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Üyelik QR’ı oluşturulamadı.' })
      }
  }

  async function requestPhoneChange() {
      setPhoneBusy(true); setMessage(null);
      try {
          const result = await requestCraftsmanPhoneChange(craftsmanId, newPhone);
          setPhoneChallengeId(result.id);
          setDevelopmentPhoneCode(result.developmentCode ?? '');
          setMessage({ kind: 'success', text: 'Yeni numarana doğrulama kodu gönderildi.' })
      } catch (error) {
          setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Kod gönderilemedi.' })
      } finally { setPhoneBusy(false) }
  }

  async function confirmPhoneChange() {
      setPhoneBusy(true); setMessage(null);
      try {
          await confirmCraftsmanPhoneChange(craftsmanId, phoneChallengeId, phoneCode);
          setMessage({ kind: 'success', text: 'Telefon numaran değiştirildi. Güvenlik için yeniden giriş yapıyorsun…' });
          window.setTimeout(onLogout, 1200)
      } catch (error) {
          setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Kod doğrulanamadı.' })
      } finally { setPhoneBusy(false) }
  }

  if (!profile) return <div className="profile-loading" aria-live="polite">{message?.text ?? 'Profil yükleniyor…'}</div>
  const maskedPhone = `${profile.phoneNumber.slice(0, 4)} *** ** ${profile.phoneNumber.slice(-2)}`
  const consentTypeNames: Record<CraftsmanConsentHistoryItem['type'], string> = { PrivacyNotice: 'Aydınlatma Metni (KVKK)', ExplicitConsent: 'Açık Rıza Beyanı', CommercialCommunication: 'Ticari Elektronik İleti' }

  return (
    <>
      <header className="profile-header">
          <div className="profile-avatar">AU</div>
          <div>
              <h1>{profile.fullName}</h1>
              <span>{levelNames[profile.level] ?? profile.level} Seviye</span>
          </div>
      </header>

      <form className="profile-form" onSubmit={save}>
        <section>
            <h2>Kişisel bilgiler</h2>
            <label>Ad soyad
                <input value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} minLength={3} maxLength={120} required />
            </label>
            <label>Şehir
                <input value={profile.city ?? ''} onChange={(event) => setProfile({ ...profile, city: event.target.value })} maxLength={80} placeholder="Şehir seçilmedi" />
            </label>
            <label>Telefon numarası
                <div className="locked-field"><span>{maskedPhone}</span><b>Doğrulandı</b></div>
                <small>Telefon değişikliği SMS doğrulaması gerektirir.</small>
            </label>

            {!phoneChallengeId ? (
                <div className="phone-change">
                    <label>Yeni telefon numarası
                        <input value={newPhone} onChange={(event) => setNewPhone(event.target.value)} inputMode="tel" placeholder="05xx xxx xx xx" />
                    </label>
                    <button disabled={phoneBusy || newPhone.length < 10} onClick={() => void requestPhoneChange()} type="button">
                        {phoneBusy ? 'Gönderiliyor…' : 'SMS kodu gönder'}
                    </button>
                </div>
            ) : (
                <div className="phone-change">
                    <label>6 haneli SMS kodu
                        <input value={phoneCode} onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="••••••" />
                    </label>
                    {developmentPhoneCode && <small>Geliştirme kodu: <button onClick={() => setPhoneCode(developmentPhoneCode)} type="button">{developmentPhoneCode}</button></small>}
                    <button disabled={phoneBusy || phoneCode.length !== 6} onClick={() => void confirmPhoneChange()} type="button">
                        {phoneBusy ? 'Doğrulanıyor…' : 'Numarayı doğrula'}
                    </button>
                </div>
            )}
        </section>

        <section>
            <h2>Bildirim tercihleri</h2>
            <label className="toggle-row">
                <div><strong>Kampanya bildirimleri</strong><small>Yeni kampanya ve fırsatları uygulamada göster.</small></div>
                <input type="checkbox" checked={profile.campaignNotificationsEnabled} onChange={(event) => setProfile({ ...profile, campaignNotificationsEnabled: event.target.checked })} /><i />
            </label>
            <label className="toggle-row">
                <div><strong>SMS bildirimleri</strong><small>Önemli puan ve kupon bilgilerini SMS ile al.</small></div>
                <input type="checkbox" checked={profile.smsNotificationsEnabled} onChange={(event) => setProfile({ ...profile, smsNotificationsEnabled: event.target.checked })} /><i />
            </label>
        </section>

        {/* YENİ EKLENEN BÖLÜM: Rıza ve İzin Geçmişi */}
        <section className="consent-history-section" style={{ backgroundColor: 'var(--bg-card)', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
            <h2>İzin ve Yasal Onay Geçmişi</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Aydınlatma Metni (KVKK)</span>
                <b style={{ color: profile.privacyNoticeAcknowledged ? 'var(--success)' : 'var(--danger)' }}>
                    {profile.privacyNoticeAcknowledged ? '✓ Onaylandı' : 'Onay Bekliyor'}
                </b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Açık Rıza Beyanı</span>
                <b style={{ color: profile.explicitConsent ? 'var(--success)' : 'var(--text-muted)' }}>
                    {profile.explicitConsent ? '✓ Onaylandı' : 'Verilmedi'}
                </b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Ticari Elektronik İleti</span>
                <b style={{ color: profile.commercialCommunicationConsent ? 'var(--success)' : 'var(--text-muted)' }}>
                    {profile.commercialCommunicationConsent ? '✓ İzin Verildi' : 'Verilmedi'}
                </b>
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                Onaylanan Metin Sürümü: <strong>{profile.consentVersion ?? 'Bilinmiyor'}</strong>
            </div>
            <details className="consent-history-details">
                <summary>Geçmiş kayıtlarını göster</summary>
                {consentHistoryLoading && <p aria-live="polite">Geçmiş yükleniyor…</p>}
                {consentHistoryError && <p className="consent-history-error" role="alert">{consentHistoryError}</p>}
                {!consentHistoryLoading && !consentHistoryError && consentHistory.length === 0 && <p>Henüz geçmiş onay kaydı bulunmuyor.</p>}
                {!consentHistoryLoading && consentHistory.map((item) => <div className="consent-history-item" key={item.id}><span><strong>{consentTypeNames[item.type] ?? item.type}</strong><small>{item.documentVersion} · {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.recordedAtUtc))}</small></span><b className={item.granted ? 'granted' : 'revoked'}>{item.granted ? 'Verildi' : 'Geri çekildi'}</b></div>)}
            </details>
        </section>

        <section className="membership-card">
            <h2>Bayi Üyelik QR’ı</h2>
            <p>Satışın hesabınla eşleştirilmesi için bu geçici kodu bayi görevlisine göster.</p>
            {membershipQr && membershipPass ? (
                <>
                    <img src={membershipQr} alt="Geçici usta üyelik QR kodu" />
                    <code style={{ fontSize: '20px', letterSpacing: '2px', padding: '10px' }}>{membershipPass.token}</code>
                    <small>{new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(membershipPass.expiresAtUtc))} saatine kadar geçerli ve tek kullanımlık.</small>
                </>
            ) : (
                <button onClick={showMembershipQr} type="button">Üyelik QR’ımı Oluştur</button>
            )}
        </section>

        <div className="profile-meta">
            Üyelik tarihi: {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(profile.createdAtUtc))}
        </div>

        <div aria-live="polite">
            {message && <p className={`profile-message ${message.kind}`}>{message.text}</p>}
        </div>

        <button className="profile-save" disabled={saving} type="submit">
            {saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
        </button>
        <button className="profile-logout" onClick={onLogout} type="button">
            Güvenli Çıkış Yap
        </button>
      </form>
    </>
  )
}
function Campaigns({ back }: { back: () => void }) {
  const [items, setItems] = useState<Campaign[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); getCampaigns(controller.signal).then(setItems).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Kampanyalar yüklenemedi.') }).finally(() => { if (!controller.signal.aborted) setLoading(false) }); return () => controller.abort() }, [reloadKey])
  return <><header className="page-header simple-header"><button onClick={back} type="button">‹</button><h1>Kampanyalar</h1><span>◇</span></header>{loading && <div className="coupon-state" aria-live="polite">Kampanyalar yükleniyor…</div>}{error && !loading && <div className="screen-error" role="alert"><span>{error}</span><button onClick={() => setReloadKey((value) => value + 1)} type="button">Tekrar dene</button></div>}{!loading && !error && <section className="campaign-list">{items.map((item) => <article key={item.id}><div className="campaign-badge">{item.pointMultiplier > 1 ? `${item.pointMultiplier}X` : '★'}</div><div><span>AKTİF KAMPANYA · {item.productName ?? 'TÜM ÜRÜNLER'}</span><h2>{item.title}</h2><p>{item.summary}</p><small>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.endsAtUtc))} tarihine kadar</small></div></article>)}</section>}{!loading && !error && items.length === 0 && <div className="coupon-state">Aktif kampanya bulunmuyor.</div>}</>
}

function Notifications({ craftsmanId, back }: { craftsmanId: string; back: () => void }) {
  const [items, setItems] = useState<CraftsmanNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!craftsmanId) { setLoading(false); return }
    const controller = new AbortController()
    setLoading(true); setError('')
    getNotifications(craftsmanId, controller.signal)
      .then((inbox) => { setItems(inbox.items); setUnreadCount(inbox.unreadCount) })
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError('Bildirimler yüklenemedi.') })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [craftsmanId])
  const visibleItems = filter === 'unread' ? items.filter((item) => !item.readAtUtc) : items
  async function read(item: CraftsmanNotification) {
    if (item.readAtUtc || busyId) return
    setBusyId(item.id); setError('')
    try {
      await markNotificationRead(craftsmanId, item.id)
      setItems((current) => current.map((x) => x.id === item.id ? { ...x, readAtUtc: new Date().toISOString() } : x))
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch { setError('Bildirim okundu olarak işaretlenemedi.') } finally { setBusyId('') }
  }
  async function readAll() {
    if (unreadCount === 0 || busyId) return
    setBusyId('all'); setError('')
    try {
      await markAllNotificationsRead(craftsmanId)
      const now = new Date().toISOString()
      setItems((current) => current.map((x) => ({ ...x, readAtUtc: x.readAtUtc ?? now })))
      setUnreadCount(0)
    } catch { setError('Bildirimler okundu olarak işaretlenemedi.') } finally { setBusyId('') }
  }
  const icons: Record<string, string> = { Welcome: '★', Campaign: '◇', PointsEarned: '+', Reward: '🎁', Delivery: '✓', Return: '↩', Support: '♧' }
  return <>
    <header className="page-header simple-header"><button onClick={back} type="button" aria-label="Geri dön">‹</button><h1>Bildirimler {unreadCount > 0 && <small>({unreadCount} yeni)</small>}</h1><button disabled={unreadCount === 0 || busyId !== ''} onClick={() => void readAll()} type="button">{busyId === 'all' ? 'İşleniyor…' : 'Tümünü oku'}</button></header>
    <div className="notification-filters" role="group" aria-label="Bildirim filtresi"><button className={filter === 'all' ? 'selected' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')} type="button">Tümü ({items.length})</button><button className={filter === 'unread' ? 'selected' : ''} aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')} type="button">Okunmamış ({unreadCount})</button></div>
    {error && <p className="screen-error" role="alert">{error}</p>}
    {loading && <div className="coupon-state" aria-live="polite">Bildirimler yükleniyor…</div>}
    {!loading && <section className="notification-list">{visibleItems.map((item) => <article className={item.readAtUtc ? 'read' : 'unread'} key={item.id} onClick={() => void read(item)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void read(item) } }} role="button" tabIndex={0} aria-label={`${item.title}, ${item.readAtUtc ? 'okundu' : 'okunmadı'}`}><span>{icons[item.type] ?? '◇'}</span><div><b>{item.title}</b><p>{item.message}</p><small>{dateFormatter.format(new Date(item.createdAtUtc))}{!item.readAtUtc && ' · Yeni'}{item.readAtUtc && ' · Okundu'}</small></div></article>)}</section>}
    {!loading && !error && visibleItems.length === 0 && <div className="coupon-state">{filter === 'unread' ? 'Okunmamış bildirimin yok.' : 'Henüz işlem bildirimi bulunmuyor.'}</div>}
  </>
}

function SupportRequestCard({ item, craftsmanId, onChanged }: { item: SupportItem; craftsmanId: string; onChanged: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(item.responses.length > 0); const [reply, setReply] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  const status = item.status === 'Open' ? 'Açık' : item.status === 'Resolved' ? 'Çözüldü' : item.status === 'Closed' ? 'Kapalı' : 'İşlemde'
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { await replySupportRequest(craftsmanId, item.id, reply); setReply(''); setMessage('Yanıtınız destek ekibine gönderildi.'); await onChanged() } catch (error) { setMessage(error instanceof Error ? error.message : 'Yanıt gönderilemedi.') } finally { setBusy(false) } }
  return <article className="craftsman-support-card"><button className="support-card-summary" onClick={() => setExpanded(!expanded)} type="button" aria-expanded={expanded}><span>{item.category}</span><div><h3>{item.subject}</h3><small>{dateFormatter.format(new Date(item.createdAtUtc))} · {item.responses.length} yanıt</small></div><b>{status}</b></button>{expanded && <div className="craftsman-support-thread">{item.referenceValue && <code className="support-reference">İşlem: {item.referenceValue}</code>}<div className="support-original"><b>Siz</b><p>{item.description}</p></div>{item.responses.map((response) => <div className={response.author === 'Usta' ? 'from-craftsman' : 'from-support'} key={response.id}><b>{response.author === 'Usta' ? 'Siz' : response.author}</b><p>{response.message}</p><small>{dateFormatter.format(new Date(response.createdAtUtc))}</small></div>)}{item.status !== 'Closed' && <form onSubmit={send}><label className="support-reply-label">Yanıtınız<textarea value={reply} onChange={(event) => setReply(event.target.value)} minLength={3} maxLength={1500} placeholder="Destek ekibine yanıt yazın…" required /></label><button disabled={busy} type="submit">{busy ? 'Gönderiliyor…' : 'Yanıtla'}</button></form>}{message && <p className="support-reply-message">{message}</p>}</div>}</article>
}

function Support({ craftsmanId, back }: { craftsmanId: string; back: () => void }) {
  const [items, setItems] = useState<SupportItem[]>([]); const [subject, setSubject] = useState(''); const [description, setDescription] = useState(''); const [referenceValue, setReferenceValue] = useState(''); const [category, setCategory] = useState('Puan'); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(''); const [reloadKey, setReloadKey] = useState(0)
  async function load() { if (craftsmanId) setItems(await getSupportRequests(craftsmanId)) }
  useEffect(() => { if (!craftsmanId) { setLoading(false); return }; const controller = new AbortController(); setLoading(true); setLoadError(''); getSupportRequests(craftsmanId, controller.signal).then(setItems).catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) setLoadError('Destek talepleri yüklenemedi.') }).finally(() => setLoading(false)); return () => controller.abort() }, [craftsmanId, reloadKey])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setMessage(''); try { await createSupportRequest(craftsmanId, { category, subject, description, referenceValue: referenceValue.trim() || null }); setSubject(''); setDescription(''); setReferenceValue(''); setMessage(category === 'İtiraz' ? 'İtirazın işlem referansıyla kaydedildi.' : 'Destek talebin oluşturuldu.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Talep oluşturulamadı.') } finally { setSaving(false) } }
  return <><header className="page-header simple-header"><button onClick={back} type="button" aria-label="Geri dön">‹</button><h1>Destek</h1><span>♧</span></header><form className="support-form" onSubmit={submit}><h2>Yeni destek talebi</h2><label>Kategori<select value={category} onChange={(event) => { setCategory(event.target.value); if (event.target.value !== 'İtiraz') setReferenceValue('') }}><option>Puan</option><option>Ürün Kodu</option><option>Ödül / Kupon</option><option>Hesap</option><option>İtiraz</option><option>Diğer</option></select></label>{category === 'İtiraz' && <label>İşlem referansı<input value={referenceValue} onChange={(event) => setReferenceValue(event.target.value.toUpperCase())} minLength={4} maxLength={120} placeholder="Ürün kodu, kupon veya satış numarası" required /><small>İtiraz ettiğiniz işlemin ekranda görünen kodunu yazın.</small></label>}<label>Konu<input value={subject} onChange={(event) => setSubject(event.target.value)} minLength={5} maxLength={140} required /></label><label>Açıklama<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={1500} required /></label>{message && <p>{message}</p>}<button disabled={saving} type="submit">{saving ? 'Gönderiliyor…' : category === 'İtiraz' ? 'İtirazı Gönder' : 'Talebi Gönder'}</button></form><h2 className="request-title">Geçmiş talepler</h2>{loadError && <div className="support-load-error" role="alert"><span>{loadError}</span><button onClick={() => setReloadKey((value) => value + 1)} type="button">Tekrar dene</button></div>}{loading && <div className="support-state" aria-live="polite">Destek talepleri yükleniyor…</div>}{!loading && <section className="request-list">{items.length === 0 && <p>Henüz destek talebiniz yok.</p>}{items.map((item) => <SupportRequestCard item={item} craftsmanId={craftsmanId} onChanged={load} key={item.id} />)}</section>}</>
}

function Login({ onAuthenticated }: { onAuthenticated: (result: { craftsmanId: string; needsProfile: boolean; token: string; expiresAtUtc: string }) => void }) {
  const [phone, setPhone] = useState('05550000000'); const [challengeId, setChallengeId] = useState(''); const [code, setCode] = useState(''); const [developmentCode, setDevelopmentCode] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function requestCode(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await requestOtpCode(phone); setChallengeId(result.id); setDevelopmentCode(result.developmentCode ?? ''); setMessage('6 haneli doğrulama kodu gönderildi.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Kod gönderilemedi.') } finally { setBusy(false) } }
  async function verify(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await verifyOtpCode(challengeId, code); onAuthenticated(result) } catch (error) { setMessage(error instanceof Error ? error.message : 'Kod doğrulanamadı.') } finally { setBusy(false) } }
  return <main className="login-shell"><div className="login-logo">⚒</div><span className="login-eyebrow">USTA KULÜBÜ</span><h1>Puanın, ödülün,<br />emeğinin karşılığı.</h1><p>Telefon numaranla güvenli ve kolayca giriş yap.</p>{!challengeId ? <form onSubmit={requestCode}><label>Telefon numarası<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="05xx xxx xx xx" required /></label><button disabled={busy} type="submit">{busy ? 'Gönderiliyor…' : 'SMS Kodu Gönder'}</button></form> : <form onSubmit={verify}><label>6 haneli kod<input className="otp-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" placeholder="••••••" required autoFocus /></label>{developmentCode && <small>Geliştirme kodu: <button onClick={() => setCode(developmentCode)} type="button">{developmentCode}</button></small>}<button disabled={busy || code.length !== 6} type="submit">{busy ? 'Kontrol ediliyor…' : 'Giriş Yap'}</button><button className="login-back" onClick={() => { setChallengeId(''); setCode(''); setMessage('') }} type="button">Numarayı değiştir</button></form>}{message && <div className="login-message">{message}</div>}<small className="login-legal">Devam ederek üyelik ve kişisel veri koşullarını kabul etmiş olursun.</small></main>
}

function ProfileSetup({ craftsmanId, onCompleted }: { craftsmanId: string; onCompleted: () => void }) {
  const [fullName, setFullName] = useState(''); const [city, setCity] = useState(''); const [privacy, setPrivacy] = useState(false); const [explicitConsent, setExplicitConsent] = useState(false); const [commercialConsent, setCommercialConsent] = useState(false); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage('')
    try { await updateCraftsmanProfile(craftsmanId, { fullName, city, campaignNotificationsEnabled: commercialConsent, smsNotificationsEnabled: commercialConsent, privacyNoticeAcknowledged: privacy, explicitConsent, commercialCommunicationConsent: commercialConsent, consentVersion: '2026-08-dev' }); onCompleted() }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Profil kaydedilemedi.') }
    finally { setSaving(false) }
  }
  return <main className="login-shell setup-shell"><div className="login-logo">✓</div><span className="login-eyebrow">SON BİR ADIM</span><h1>Seni tanıyalım,<br />kulübe hoş geldin.</h1><p>Ödül ve kampanyaları sana uygun gösterebilmemiz için kısa profilini tamamla.</p><form onSubmit={submit}><label>Ad soyad<input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={3} maxLength={120} placeholder="Adınız ve soyadınız" required autoFocus /></label><label>Şehir<input value={city} onChange={(event) => setCity(event.target.value)} maxLength={80} placeholder="Örn. Yalova" /></label><label className="adjustment-confirm"><input checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} type="checkbox" required /><span>Aydınlatma metnini okudum. <small>Sürüm: 2026-08-dev</small></span></label><label className="adjustment-confirm"><input checked={explicitConsent} onChange={(event) => setExplicitConsent(event.target.checked)} type="checkbox" /><span>Açık rıza veriyorum. Bu tercih isteğe bağlıdır.</span></label><label className="adjustment-confirm"><input checked={commercialConsent} onChange={(event) => setCommercialConsent(event.target.checked)} type="checkbox" /><span>Kampanya ve ticari ileti almak istiyorum. Bu tercih isteğe bağlıdır.</span></label>{message && <div className="login-message">{message}</div>}<button disabled={saving || !privacy} type="submit">{saving ? 'Kaydediliyor…' : 'Kulübe Katıl'}</button></form><small className="login-legal">Tercihlerini daha sonra Profil ekranından değiştirebilirsin.</small></main>
}

function DealerRiskForm() {
  const [referenceType, setReferenceType] = useState('ProductCode'); const [referenceValue, setReferenceValue] = useState(''); const [reason, setReason] = useState(''); const [description, setDescription] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await reportDealerRisk({ referenceType, referenceValue, reason, description }); setMessage(`Bildirim oluşturuldu · ${result.id.slice(0, 8).toUpperCase()}`); setReferenceValue(''); setReason(''); setDescription('') } catch (error) { setMessage(error instanceof Error ? error.message : 'Bildirim oluşturulamadı.') } finally { setBusy(false) } }
  return <><form className="dealer-search dealer-return" onSubmit={submit}><label>İşlem türü<select value={referenceType} onChange={(event) => setReferenceType(event.target.value)}><option value="ProductCode">Ürün kodu</option><option value="Coupon">Kupon</option><option value="Sale">Satış</option></select></label><label>İşlem referansı<input value={referenceValue} onChange={(event) => setReferenceValue(event.target.value.toUpperCase())} minLength={4} maxLength={120} required /></label><label>Şüphe nedeni<input value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={80} required /></label><label>Açıklama<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={1000} required /></label><button disabled={busy} type="submit">{busy ? 'Gönderiliyor…' : 'İncelemeye Gönder'}</button></form>{message && <p className="dealer-message">{message}</p>}</>
}

function DealerRiskPage() { return <main className="dealer-shell"><header><div><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Bayi Paneli</strong></div></div><i>Yalova Merkez Bayi</i></header><section className="dealer-hero"><span>⚑</span><h1>Şüpheli İşlem Bildir</h1><p>Şüpheli ürün kodu, kupon veya satış işlemini yönetici incelemesine gönderin.</p></section><DealerRiskForm /><footer><a href="/dealer">Bayi işlemlerine dön</a><span>Demo Bayi Görevlisi</span></footer></main> }

function AdminLogin({ onAuthenticated }: { onAuthenticated: (profile: AdminLoginResult) => void }) {
  const [userName, setUserName] = useState('admin'), [password, setPassword] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await loginAdmin(userName, password); authStore.setAdminToken(result.token); onAuthenticated(result) } catch (error) { setMessage(error instanceof Error ? error.message : 'Giriş yapılamadı.') } finally { setBusy(false) } }
  return <main className="admin-login"><div className="login-logo">⚒</div><span>USTA KULÜBÜ YÖNETİMİ</span><h1>Yönetici Girişi</h1><p>Kampanya, puan ve raporlama araçlarına yalnızca yetkili hesaplar erişebilir.</p><form onSubmit={submit}><label>Kullanıcı adı<input value={userName} onChange={(event) => setUserName(event.target.value)} autoComplete="username" required /></label><label>Parola<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" minLength={8} required /></label><small>Geliştirme hesabı: admin / Usta2026!</small>{message && <p>{message}</p>}<button disabled={busy} type="submit">{busy ? 'Doğrulanıyor…' : 'Yönetim Paneline Gir'}</button></form></main>
}

function AdminRouter() {
  const path = window.location.pathname
  if (path.startsWith('/admin/campaign-approvals')) return <AdminCampaignApprovalsPage />
  return path.startsWith('/admin/outbox') ? <AdminOutboxPage /> : path.startsWith('/admin/audit') ? <AdminAuditPage /> : path.startsWith('/admin/dealer-onboarding') ? <AdminDealerOnboardingPage /> : path.startsWith('/admin/coupons') ? <AdminCouponsPage /> : path.startsWith('/admin/notifications') ? <AdminNotificationsPage /> : path.startsWith('/admin/dealer-employees') ? <AdminDealerEmployeesPage /> : path.startsWith('/admin/adjustments') ? <AdminPointAdjustmentsPage /> : path.startsWith('/admin/support') ? <AdminSupportPage /> : path.startsWith('/admin/reports') ? <AdminReportsPage /> : path.startsWith('/admin/transactions') ? <AdminTransactionsPage /> : path.startsWith('/admin/loyalty-rules') ? <AdminLoyaltyRulesPage /> : path.startsWith('/admin/products') ? <><AdminProductsPage /><ProductCodeImportPanel /></> : path.startsWith('/admin/rewards') ? <AdminRewardsPage /> : path.startsWith('/admin/campaigns') ? <AdminCampaignsPage /> : path.startsWith('/admin/craftsmen') ? <AdminManagementPage kind="craftsmen" /> : path.startsWith('/admin/dealers') ? <AdminManagementPage kind="dealers" /> : <AdminApp />
}

function AdminPortal() {
  const [profile, setProfile] = useState<AdminLoginResult | null>(null)
  if (!profile) return <AdminLogin onAuthenticated={setProfile} />
  const exit = async () => { await logoutAdmin(); setProfile(null) }
  return <><AdminRouter /><div className="admin-shortcuts"><a href="/admin/outbox">Teslim Kuyruğu</a><a href="/admin/audit">Denetim Kaydı</a><a href="/admin/dealer-onboarding">Yeni Bayi</a><a href="/admin/coupons">Kupon Takibi</a><a href="/admin/notifications">Bildirim Gönder</a><a href="/admin/dealer-employees">Bayi Çalışanları</a><a href="/admin/adjustments">± Puan Düzelt</a></div><button className="admin-logout" onClick={exit} type="button">{profile.user} · Çıkış</button></>
}

function AdminApp() {
  const [overview, setOverview] = useState<AdminOverview | null>(null); const [items, setItems] = useState<AdminRiskCase[]>([]); const [notes, setNotes] = useState<Record<string, string>>({}); const [message, setMessage] = useState(''); const [busyId, setBusyId] = useState('')
  async function load() { const [summary, risks] = await Promise.all([getAdminOverview(), getAdminRiskCases()]); setOverview(summary); setItems(risks) }
  useEffect(() => { load().catch(() => setMessage('Yönetici verileri yüklenemedi.')) }, [])
  async function changeStatus(id: string, status: 'InReview' | 'Resolved' | 'Rejected') { const note = notes[id]?.trim() ?? ''; if (note.length < 5) { setMessage('Karar vermeden önce en az 5 karakterlik inceleme notu yazın.'); return } setBusyId(id); setMessage(''); try { await updateAdminRiskStatus(id, status, note); setNotes((current) => ({ ...current, [id]: '' })); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Durum güncellenemedi.') } finally { setBusyId('') } }
  useEffect(() => {
    const destinations = ['/admin', '/admin/craftsmen', '/admin/dealers', '/admin/campaigns', '/admin/rewards', '/admin']
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.admin-shell aside nav > button'))
    const handlers = buttons.map((button, index) => {
      const handler = () => window.location.assign(destinations[index])
      button.addEventListener('click', handler)
      return { button, handler }
    })
    return () => handlers.forEach(({ button, handler }) => button.removeEventListener('click', handler))
  }, [])

  const labels: Record<AdminRiskCase['status'], string> = { Open: 'Açık', InReview: 'İncelemede', Resolved: 'Çözüldü', Rejected: 'Reddedildi' }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a className="active" href="/admin">⌂ Genel Bakış</a><a href="/admin/craftsmen">♧ Ustalar</a><a href="/admin/dealers">▣ Bayiler</a><a href="/admin/campaigns">◇ Kampanyalar</a><a href="/admin/rewards">♙ Ödüller</a><a href="/admin">⚑ Risk Kontrolü</a></nav><a href="/">Usta uygulaması</a><a href="/dealer">Bayi paneli</a></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Genel Bakış</h1></div><b>Demo Yönetici</b></header>{message && <p className="admin-message">{message}</p>}<div className="admin-stats"><article><span>♧</span><div><small>Aktif Usta</small><strong>{overview?.craftsmen ?? '—'}</strong></div></article><article><span>▣</span><div><small>Aktif Bayi</small><strong>{overview?.dealers ?? '—'}</strong></div></article><article><span>♙</span><div><small>Aktif Kupon</small><strong>{overview?.activeCoupons ?? '—'}</strong></div></article><article className="risk"><span>⚑</span><div><small>Açık Risk Kaydı</small><strong>{overview?.openRiskCases ?? '—'}</strong></div></article></div><div className="admin-section-title"><div><h2>Şüpheli İşlemler</h2><p>Bayi çalışanlarından gelen son bildirimler</p></div><span>{items.length} kayıt</span></div><section className="admin-risk-list">{items.length === 0 && <p>Henüz şüpheli işlem bildirimi bulunmuyor.</p>}{items.map((item) => <article key={item.id}><div className="risk-head"><span>{item.referenceType === 'ProductCode' ? 'ÜRÜN KODU' : item.referenceType === 'Coupon' ? 'KUPON' : 'SATIŞ'}</span><b className={item.status}>{labels[item.status]}</b></div><h3>{item.reason}</h3><code>{item.referenceValue}</code><p>{item.description}</p><small>{item.dealer} · {item.dealerEmployee} · {dateFormatter.format(new Date(item.createdAtUtc))}</small>{item.actions.length > 0 && <div className="risk-history"><strong>İnceleme geçmişi</strong>{item.actions.map((action) => <div key={action.id}><b>{labels[action.status]}</b><p>{action.decisionNote}</p><small>{action.reviewer} · {dateFormatter.format(new Date(action.createdAtUtc))}</small></div>)}</div>}<label className="risk-note">İnceleme / karar notu<textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} minLength={5} maxLength={1000} placeholder="Kanıtı ve karar gerekçesini yazın…" /></label><div className="risk-actions"><button onClick={() => changeStatus(item.id, 'InReview')} disabled={busyId === item.id || item.status !== 'Open' || (notes[item.id]?.trim().length ?? 0) < 5} type="button">İncelemeye Al</button><button onClick={() => changeStatus(item.id, 'Resolved')} disabled={busyId === item.id || item.status === 'Resolved' || (notes[item.id]?.trim().length ?? 0) < 5} type="button">Çözüldü</button><button onClick={() => changeStatus(item.id, 'Rejected')} disabled={busyId === item.id || item.status === 'Rejected' || (notes[item.id]?.trim().length ?? 0) < 5} type="button">Reddet</button></div></article>)}</section></section></main>
}

function AdminManagementPage({ kind }: { kind: 'craftsmen' | 'dealers' }) {
  const [craftsmen, setCraftsmen] = useState<AdminCraftsman[]>([])
  const [dealers, setDealers] = useState<AdminDealer[]>([])
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')

  // YENİ EKLENEN: Arama State'i
  const [searchTerm, setSearchTerm] = useState('')

  async function load() {
      if (kind === 'craftsmen') setCraftsmen(await getAdminCraftsmen())
      else setDealers(await getAdminDealers())
  }

  useEffect(() => {
      // Sayfa değiştiğinde aramayı temizle
      setSearchTerm('')
      const request = kind === 'craftsmen' ? getAdminCraftsmen().then(setCraftsmen) : getAdminDealers().then(setDealers)
      request.catch(() => setMessage('Kayıtlar yüklenemedi.'))
  }, [kind])

  async function toggle(id: string, active: boolean) {
      setBusyId(id); setMessage('');
      try {
          await setAdminEntityActive(kind, id, !active)
          await load()
      } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Durum güncellenemedi.')
      } finally {
          setBusyId('')
      }
  }

  // YENİ EKLENEN: Arama Filtreleme Mantığı
  const filteredCraftsmen = craftsmen.filter(c =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phoneNumber.includes(searchTerm) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredDealers = dealers.filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="admin-shell">
        <aside>
            <div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div>
            <nav>
                <a href="/admin">⌂ Genel Bakış</a>
                <a className={kind === 'craftsmen' ? 'active' : ''} href="/admin/craftsmen">♧ Ustalar</a>
                <a className={kind === 'dealers' ? 'active' : ''} href="/admin/dealers">▣ Bayiler</a>
            </nav>
        </aside>
        <section className="admin-main">
            <header>
                <div>
                    <span>YÖNETİCİ PANELİ</span>
                    <h1>{kind === 'craftsmen' ? 'Usta Yönetimi' : 'Bayi Yönetimi'}</h1>
                </div>
                <b>{kind === 'craftsmen' ? filteredCraftsmen.length : filteredDealers.length} kayıt listeleniyor</b>
            </header>

            {/* YENİ EKLENEN: Arama Kutusu Arayüzü */}
            <div className="admin-toolbar" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder={kind === 'craftsmen' ? "Usta adı, telefon veya şehir ara..." : "Bayi adı veya kodu ara..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '15px' }}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} type="button" style={{ padding: '0 15px' }}>Temizle</button>
                )}
            </div>

            {message && <p className="admin-message">{message}</p>}

            <section className="management-list">
                {kind === 'craftsmen' ? filteredCraftsmen.map((item) => (
                    <article key={item.id}>
                        <div className="management-avatar">{item.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
                        <div className="management-info">
                            <h2>{item.fullName}</h2>
                            <p>{item.phoneNumber} · {item.city ?? 'Şehir belirtilmemiş'}</p>
                            <small>{levelNames[item.level] ?? item.level} · {numberFormatter.format(item.balance)} puan · {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.createdAtUtc))}</small>
                        </div>
                        <span className={item.isActive ? 'entity-active' : 'entity-passive'}>{item.isActive ? 'Aktif' : 'Pasif'}</span>
                        <button onClick={() => toggle(item.id, item.isActive)} disabled={busyId === item.id} type="button">{item.isActive ? 'Pasife Al' : 'Aktifleştir'}</button>
                    </article>
                )) : filteredDealers.map((item) => (
                    <article key={item.id}>
                        <div className="management-avatar">▣</div>
                        <div className="management-info">
                            <h2>{item.name}</h2>
                            <p>Bayi kodu: {item.code}</p>
                            <small>{item.activeEmployees}/{item.totalEmployees} aktif çalışan</small>
                        </div>
                        <span className={item.isActive ? 'entity-active' : 'entity-passive'}>{item.isActive ? 'Aktif' : 'Pasif'}</span>
                        <button onClick={() => toggle(item.id, item.isActive)} disabled={busyId === item.id} type="button">{item.isActive ? 'Pasife Al' : 'Aktifleştir'}</button>
                    </article>
                ))}

                {/* Arama sonucu bulunamazsa gösterilecek mesaj */}
                {(kind === 'craftsmen' ? filteredCraftsmen.length : filteredDealers.length) === 0 && (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', width: '100%' }}>
                        <span style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}>🔍</span>
                        <p>"{searchTerm}" aramasına uygun {kind === 'craftsmen' ? 'usta' : 'bayi'} bulunamadı.</p>
                    </div>
                )}
            </section>
        </section>
    </main>
  )
}

function AdminDealerOnboardingPage() {
  const [code, setCode] = useState(''), [name, setName] = useState(''), [employeeName, setEmployeeName] = useState(''), [pin, setPin] = useState('')
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [result, setResult] = useState<DealerOnboardingResult | null>(null)
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(''); setResult(null); try { const created = await onboardAdminDealer(code.trim().toUpperCase(), name.trim(), employeeName.trim(), pin); setResult(created); setCode(''); setName(''); setEmployeeName(''); setPin(''); setConfirmed(false) } catch (error) { setMessage(error instanceof Error ? error.message : 'Bayi oluşturulamadı.') } finally { setBusy(false) } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/dealers">▣ Bayiler</a><a className="active" href="/admin/dealer-onboarding">＋ Yeni Bayi</a><a href="/admin/dealer-employees">♧ Bayi Çalışanları</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Yeni Bayi Kurulumu</h1></div><b>Bayi + ilk çalışan</b></header><div className="onboarding-layout"><form className="onboarding-form" onSubmit={submit}><h2>Bayi bilgileri</h2><p>Bayi ve ilk yetkili çalışan tek işlemde oluşturulur. Herhangi bir hata olursa yarım kayıt bırakılmaz.</p><label>Bayi kodu<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30))} minLength={3} maxLength={30} placeholder="YLV-002" required /><small>Bayi çalışanı giriş yaparken bu kodu kullanacak.</small></label><label>Bayi adı<input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={160} placeholder="Yalova Sanayi Bayi" required /></label><h2>İlk yetkili çalışan</h2><label>Ad soyad<input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} minLength={3} maxLength={120} required /></label><label>6 haneli erişim kodu<input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" required /><small>Kod yalnızca güvenli hash olarak saklanır ve sonradan görüntülenemez.</small></label><label className="adjustment-confirm"><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span>Bayi kodunu ve çalışan bilgilerini kontrol ettim; erişim kodunu yalnızca ilgili kişiye ileteceğim.</span></label>{message && <p className="admin-message">{message}</p>}<button disabled={busy || !confirmed || pin.length !== 6} type="submit">{busy ? 'Kurulum yapılıyor…' : 'Bayiyi ve Çalışanı Oluştur'}</button></form><section className="onboarding-guide"><h2>Kurulumdan sonra</h2><ol><li>Çalışan bayi kodu ve kişisel erişim koduyla giriş yapar.</li><li>İlk girişten sonra satış, kupon ve iade işlemleri çalışanın adına kaydedilir.</li><li>Yeni çalışanlar Bayi Çalışanları ekranından eklenir.</li><li>Bayi pasife alınırsa tüm erişim anında durur.</li></ol>{result && <div className="onboarding-success"><span>✓</span><h3>{result.name} hazır</h3><p>Bayi kodu: <strong>{result.code}</strong></p><p>İlk çalışan: <strong>{result.employee}</strong></p><a href="/admin/dealer-employees">Çalışan yönetimine git</a></div>}</section></div></section></main>
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

function AdminCampaignApprovalsPage() {
  const [items, setItems] = useState<CampaignApproval[]>([]), [notes, setNotes] = useState<Record<string, string>>({}), [message, setMessage] = useState(''), [busyId, setBusyId] = useState('')
  const load = async () => { try { setItems(await getAdminCampaignApprovals()); setMessage('') } catch (error) { setMessage(error instanceof Error ? error.message : 'Kampanya onayları yüklenemedi.') } }
  useEffect(() => { void load() }, [])
  const decide = async (item: CampaignApproval, decision: 'approve' | 'reject') => { const note = notes[item.id]?.trim() ?? ''; if (note.length < 5) { setMessage('Onay veya ret gerekçesi en az 5 karakter olmalıdır.'); return } setBusyId(item.id); try { await decideAdminCampaignApproval(item.id, decision, note); await load(); setMessage(decision === 'approve' ? 'Kampanya onaylandı ve etkinleştirildi.' : 'Kampanya reddedildi.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Karar kaydedilemedi.') } finally { setBusyId('') } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/campaigns">◇ Kampanyalar</a><a className="active" href="/admin/campaign-approvals">✓ Kampanya Onayları</a><a href="/admin/audit">⌁ Denetim Kaydı</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Yüksek Etkili Kampanya Onayları</h1></div><b>{items.filter((item) => item.status === 'Pending').length} bekleyen</b></header>{message && <p className="admin-info-message">{message}</p>}<section className="outbox-list">{items.map((item) => <article key={item.id}><span className={`outbox-state ${item.status === 'Pending' ? 'pending' : item.status === 'Approved' ? 'delivered' : 'failed'}`}>{item.status === 'Pending' ? 'Onay Bekliyor' : item.status === 'Approved' ? 'Onaylandı' : 'Reddedildi'}</span><div><strong>{item.campaign} · {item.pointMultiplier}X puan</strong><small>Talep eden: {item.requestedBy} · {dateFormatter.format(new Date(item.requestedAtUtc))}</small>{item.status === 'Pending' ? <textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} placeholder="Bütçe, tarih ve hedef kitle kontrolü gerekçesi" minLength={5} maxLength={400} /> : <p>{item.decisionNote} · {item.decidedBy}</p>}</div>{item.status === 'Pending' && <span><button onClick={() => void decide(item, 'approve')} disabled={busyId === item.id} type="button">Onayla</button><button onClick={() => void decide(item, 'reject')} disabled={busyId === item.id} type="button">Reddet</button></span>}</article>)}{items.length === 0 && <p className="audit-empty">Onay bekleyen yüksek etkili kampanya yok.</p>}</section><aside className="audit-note">2X ve üzeri puan kampanyaları, oluşturan yönetici dışındaki bir yetkilinin gerekçeli onayı olmadan etkinleşmez.</aside></section></main>
}

function AdminCampaignsPage() {
  const initialStart = new Date().toISOString().slice(0, 16); const initialEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16)
  const [items, setItems] = useState<AdminCampaign[]>([]); const [products, setProducts] = useState<AdminProduct[]>([]); const [productId, setProductId] = useState(''); const [title, setTitle] = useState(''); const [summary, setSummary] = useState(''); const [multiplier, setMultiplier] = useState(2); const [startsAt, setStartsAt] = useState(initialStart); const [endsAt, setEndsAt] = useState(initialEnd); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { setItems(await getAdminCampaigns()) }
  useEffect(() => { Promise.all([getAdminCampaigns(), getAdminProducts()]).then(([campaigns, productItems]) => { setItems(campaigns); setProducts(productItems.filter((x) => x.isActive)) }).catch(() => setMessage('Kampanya verileri yüklenemedi.')) }, [])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { const created = await createAdminCampaign({ title, summary, pointMultiplier: multiplier, startsAtUtc: new Date(startsAt).toISOString(), endsAtUtc: new Date(endsAt).toISOString(), isActive: true, displayOrder: 1, productId: productId || null }); setTitle(''); setSummary(''); setProductId(''); setMessage(created.requiresApproval ? 'Yüksek etkili kampanya ikinci yönetici onayına gönderildi; onaydan sonra etkinleşecek.' : 'Ürün ve tarih kuralı kod değişmeden yayınlandı.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Kampanya oluşturulamadı.') } finally { setBusy(false) } }
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

function ProductCodeImportPanel() {
  const [products, setProducts] = useState<AdminProduct[]>([]), [productId, setProductId] = useState(''), [codes, setCodes] = useState<string[]>([]), [fileName, setFileName] = useState('')
  const [validation, setValidation] = useState<ProductCodeValidationResult | null>(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { getAdminProducts().then((items) => { const active = items.filter((item) => item.isActive); setProducts(active); setProductId(active[0]?.id ?? '') }).catch(() => setMessage('Ürün listesi alınamadı.')) }, [])
  const readFile = async (file?: File) => { setValidation(null); setMessage(''); setCodes([]); if (!file) return; if (file.size > 1024 * 1024) { setMessage('Dosya en fazla 1 MB olabilir.'); return } const text = await file.text(); const values = text.split(/[\r\n,;]+/).map((value) => value.trim()).filter(Boolean); if (values[0] && ['code', 'kod', 'product_code', 'urun_kodu'].includes(values[0].toLowerCase())) values.shift(); if (values.length > 5000) { setMessage('Tek dosyada en fazla 5.000 kod yüklenebilir.'); return } setFileName(file.name); setCodes(values); setMessage(`${values.length} kod yerel olarak okundu. Henüz veritabanına yazılmadı.`) }
  const validate = async () => { setBusy(true); setMessage(''); try { const result = await validateAdminProductCodes(productId, codes); setValidation(result); setMessage(result.rejected === 0 ? 'Dosya geçerli. Yükleme için hazır.' : `${result.rejected} hata bulundu. Dosyayı düzeltip yeniden seçin.`) } catch (error) { setMessage(error instanceof Error ? error.message : 'Dosya doğrulanamadı.') } finally { setBusy(false) } }
  const upload = async () => { setBusy(true); setMessage(''); try { const result = await importAdminProductCodes(productId, codes); setMessage(`${result.imported} kod güvenle yüklendi. Açık kod değerleri veritabanında tutulmadı.`); setCodes([]); setValidation(null); setFileName('') } catch (error) { setMessage(error instanceof Error ? error.message : 'Kodlar yüklenemedi.') } finally { setBusy(false) } }
  return <details className="product-import-panel"><summary>⇧ Kod Dosyası Yükle</summary><section><h2>Toplu ürün kodu yükleme</h2><p>TXT veya CSV dosyasında her satıra bir kod yazın. Virgül ve noktalı virgül de desteklenir.</p><label>Ürün<select value={productId} onChange={(event) => { setProductId(event.target.value); setValidation(null) }}>{products.map((product) => <option value={product.id} key={product.id}>{product.sku} · {product.name}</option>)}</select></label><label>Dosya<input onChange={(event) => void readFile(event.target.files?.[0])} type="file" accept=".txt,.csv,text/plain,text/csv" /></label>{fileName && <small>{fileName} · {codes.length} kod</small>}<div className="import-actions"><button onClick={validate} disabled={busy || !productId || codes.length === 0} type="button">Önce Doğrula</button><button className="import-confirm" onClick={upload} disabled={busy || !validation || validation.rejected > 0 || validation.valid === 0} type="button">{busy ? 'İşleniyor…' : `${validation?.valid ?? 0} Kodu Yükle`}</button></div>{message && <p className="import-message">{message}</p>}{validation && <div className="import-result"><div><span>Toplam<strong>{validation.total}</strong></span><span>Geçerli<strong>{validation.valid}</strong></span><span>Hatalı<strong>{validation.rejected}</strong></span></div>{validation.rejectedItems.length > 0 && <ul>{validation.rejectedItems.slice(0, 8).map((item) => <li key={`${item.line}-${item.maskedCode}`}>Satır {item.line} · {item.maskedCode}: {item.reason}</li>)}</ul>}</div>}<aside>Ham kodlar yalnızca doğrulama ve yükleme sırasında bellekte kullanılır. SQL Server'a yalnızca SHA-256 özeti kaydedilir.</aside></section></details>
}

function AdminProductsPage() {
  const [items, setItems] = useState<AdminProduct[]>([])
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [basePoints, setBasePoints] = useState(500)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [generated, setGenerated] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState('')

  async function load() {
      setItems(await getAdminProducts())
  }

  useEffect(() => {
      getAdminProducts().then(setItems).catch(() => setMessage('Ürünler yüklenemedi.'))
  }, [])

  async function create(event: FormEvent<HTMLFormElement>) {
      event.preventDefault(); setBusy(true); setMessage('')
      try {
          await createAdminProduct({ sku, name, basePoints })
          setSku(''); setName('')
          setMessage('Yeni ürün başarıyla tanımlandı.')
          await load()
      } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Ürün eklenemedi.')
      } finally {
          setBusy(false)
      }
  }

  async function generate(item: AdminProduct) {
      setBusyId(item.id); setMessage(''); setGenerated([])
      try {
          const result = await generateAdminProductCodes(item.id, counts[item.id] ?? 10)
          setGenerated(result.codes)
          setMessage(result.warning)
          await load()
      } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Kod üretilemedi.')
      } finally {
          setBusyId('')
      }
  }

  // YENİ EKLENEN: Ürünü / Kod Partisini Durdurma İşlemi
  async function toggleActive(item: AdminProduct) {
      const action = item.isActive ? 'DURDURMAK' : 'YENİDEN AKTİFLEŞTİRMEK'
      if (!window.confirm(`Bu ürünün tüm kodlarını ${action} istediğinize emin misiniz? Durdurulan ürünlerin barkodları sahada okutulamaz.`)) {
          return
      }

      setBusyId(item.id); setMessage('')
      try {
          await setAdminProductActive(item.id, !item.isActive)
          await load()
          setMessage(`Ürün durumu başarıyla ${item.isActive ? 'pasif (durduruldu)' : 'aktif'} olarak güncellendi.`)
      } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Ürün durumu değiştirilemedi.')
      } finally {
          setBusyId('')
      }
  }

  async function copyCodes() {
      await navigator.clipboard.writeText(generated.join('\n'))
      setMessage('Kodlar panoya kopyalandı. Güvenli bir dosyaya kaydedin.')
  }

  return (
    <main className="admin-shell">
        <aside>
            <div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div>
            <nav>
                <a href="/admin">⌂ Genel Bakış</a>
                <a href="/admin/craftsmen">♧ Ustalar</a>
                <a href="/admin/dealers">▣ Bayiler</a>
                <a className="active" href="/admin/products">▦ Ürün Kodları</a>
                <a href="/admin/campaigns">◇ Kampanyalar</a>
                <a href="/admin/rewards">♙ Ödüller</a>
            </nav>
        </aside>
        <section className="admin-main">
            <header>
                <div><span>YÖNETİCİ PANELİ</span><h1>Ürün ve Kod Yönetimi</h1></div>
                <b>{items.length} tanımlı ürün</b>
            </header>

            <form className="product-create" onSubmit={create}>
                <label>SKU (Stok Kodu)
                    <input value={sku} onChange={(event) => setSku(event.target.value.toUpperCase())} minLength={2} maxLength={50} placeholder="URUN-001" required />
                </label>
                <label>Ürün Adı
                    <input value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={160} placeholder="Örn: 25kg Granit Yapıştırıcı" required />
                </label>
                <label>Temel Puan
                    <input value={basePoints} onChange={(event) => setBasePoints(Number(event.target.value))} type="number" min="1" required />
                </label>
                <button disabled={busy} type="submit">{busy ? 'Ekleniyor...' : 'Ürünü Sisteme Ekle'}</button>
            </form>

            <div aria-live="polite">
                {message && <p className="admin-info-message" style={{ margin: '15px 0' }}>{message}</p>}
            </div>

            {generated.length > 0 && (
                <section className="generated-codes" style={{ border: '2px dashed var(--success)', background: 'var(--bg-card)' }}>
                    <div>
                        <h2 style={{ color: 'var(--success)' }}>Yeni Üretilen Kod Partisi</h2>
                        <button onClick={copyCodes} type="button">Tümünü Kopyala</button>
                    </div>
                    <textarea readOnly value={generated.join('\n')} style={{ minHeight: '150px' }} />
                    <small style={{ color: 'var(--danger)', fontWeight: 'bold' }}>⚠ Ham kodlar veritabanında tutulmaz. Bu ekranı kapatmadan önce kodları güvenli bir XLS/TXT dosyasına kaydedin.</small>
                </section>
            )}

            <section className="product-admin-list">
                {items.map((item) => (
                    <article key={item.id} style={{ border: item.isActive ? '1px solid var(--border)' : '1px solid var(--danger)', opacity: item.isActive ? 1 : 0.8 }}>
                        <div className="product-admin-head">
                            <div>
                                <span style={{ color: item.isActive ? 'var(--text)' : 'var(--danger)' }}>{item.sku}</span>
                                <h2>{item.name}</h2>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <b style={{ display: 'block', fontSize: '1.2em' }}>{numberFormatter.format(item.basePoints)} Puan</b>
                                <span className={item.isActive ? 'entity-active' : 'entity-passive'} style={{ display: 'inline-block', marginTop: '5px' }}>
                                    {item.isActive ? 'Aktif (Kullanımda)' : 'Pasif (Durduruldu)'}
                                </span>
                            </div>
                        </div>

                        <div className="product-code-stats">
                            <span>Toplam Üretim <b>{numberFormatter.format(item.totalCodes)}</b></span>
                            <span>Kullanılabilir <b>{numberFormatter.format(item.availableCodes)}</b></span>
                            <span>Okutulan <b>{numberFormatter.format(item.redeemedCodes)}</b></span>
                            <span>İade / Hatalı <b>{numberFormatter.format(item.returnedCodes)}</b></span>
                        </div>

                        <div className="code-generate" style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                                <label style={{ flex: 1 }}>Yeni Üretilecek Kod Sayısı
                                    <input value={counts[item.id] ?? 10} onChange={(event) => setCounts({ ...counts, [item.id]: Number(event.target.value) })} type="number" min="1" max="1000" disabled={!item.isActive} />
                                </label>
                                <button onClick={() => generate(item)} disabled={busyId === item.id || !item.isActive} type="button" style={{ alignSelf: 'flex-end', padding: '0 20px', height: '42px' }}>
                                    {busyId === item.id ? 'Üretiliyor…' : 'Kod Üret'}
                                </button>
                            </div>

                            {/* DURDURMA / GERİ ÇAĞIRMA BUTONU */}
                            <button
                                onClick={() => toggleActive(item)}
                                disabled={busyId === item.id}
                                type="button"
                                className={item.isActive ? 'danger-action' : 'primary-action'}
                                style={{ alignSelf: 'flex-end', height: '42px', padding: '0 20px', backgroundColor: item.isActive ? 'var(--danger)' : 'var(--success)', color: 'white' }}
                                title={item.isActive ? "Bu ürünün tüm piyasadaki kodlarını okutmaya kapatır." : "Ürünü tekrar okutmaya açar."}
                            >
                                {item.isActive ? 'Ürünü / Kodları Durdur' : 'Yeniden Aktifleştir'}
                            </button>
                        </div>
                    </article>
                ))}
                {items.length === 0 && <p style={{ textAlign: 'center', width: '100%', padding: '20px' }}>Henüz ürün tanımlanmamış.</p>}
            </section>
        </section>
    </main>
  )
}
function AdminLoyaltyRulesPage() {
  const [rules, setRules] = useState<LoyaltyRules | null>(null); const [silver, setSilver] = useState(5000); const [gold, setGold] = useState(12500); const [rate, setRate] = useState(20); const [note, setNote] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { const data = await getAdminLoyaltyRules(); setRules(data); setSilver(data.silverThreshold); setGold(data.goldThreshold); setRate(data.pointsPerRewardTry) }
  useEffect(() => { getAdminLoyaltyRules().then((data) => { setRules(data); setSilver(data.silverThreshold); setGold(data.goldThreshold); setRate(data.pointsPerRewardTry) }).catch(() => setMessage('Puan kuralları yüklenemedi.')) }, [])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { await updateAdminLoyaltyRules({ silverThreshold: silver, goldThreshold: gold, pointsPerRewardTry: rate, changeNote: note }); setNote(''); setMessage('Puan ve seviye kuralları yayınlandı.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Kurallar güncellenemedi.') } finally { setBusy(false) } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/products">▦ Ürün Kodları</a><a className="active" href="/admin/loyalty-rules">★ Puan Kuralları</a><a href="/admin/campaigns">◇ Kampanyalar</a><a href="/admin/rewards">♙ Ödüller</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Puan ve Seviye Kuralları</h1></div><b>{rules ? `Son güncelleme ${dateFormatter.format(new Date(rules.updatedAtUtc))}` : 'Yükleniyor'}</b></header><div className="loyalty-rule-grid"><form className="campaign-create" onSubmit={submit}><h2>Aktif Kurallar</h2><label>Gümüş seviye eşiği<input value={silver} onChange={(event) => setSilver(Number(event.target.value))} type="number" min="1" required /></label><label>Altın seviye eşiği<input value={gold} onChange={(event) => setGold(Number(event.target.value))} type="number" min={silver + 1} required /></label><label>1 TL ödül değeri için puan<input value={rate} onChange={(event) => setRate(Number(event.target.value))} type="number" min="1" required /></label><div className="rule-preview"><span>10.000 puanın ödül değeri</span><b>{numberFormatter.format(Math.floor(10000 / Math.max(rate, 1)))} TL'ye kadar</b></div><label>Değişiklik gerekçesi<textarea value={note} onChange={(event) => setNote(event.target.value)} minLength={5} maxLength={300} placeholder="Neden değiştirdiğinizi yazın" required /></label>{message && <p>{message}</p>}<button disabled={busy} type="submit">{busy ? 'Yayınlanıyor…' : 'Kuralları Yayınla'}</button></form><section className="rule-history"><h2>Değişiklik Geçmişi</h2>{rules?.history.length === 0 && <p>Henüz kural değişikliği yapılmadı.</p>}{rules?.history.map((item) => <article key={item.id}><div><b>Gümüş {numberFormatter.format(item.silverThreshold)}</b><b>Altın {numberFormatter.format(item.goldThreshold)}</b><b>{item.pointsPerRewardTry} puan / TL</b></div><p>{item.changeNote}</p><small>{dateFormatter.format(new Date(item.createdAtUtc))}</small></article>)}</section></div></section></main>
}

function AdminSupportCard({ item, onChanged }: { item: AdminSupportRequest; onChanged: () => Promise<void> }) {
  const [status, setStatus] = useState(item.status)
  const [priority, setPriority] = useState(item.priority)
  const [assignedTo, setAssignedTo] = useState(item.assignedTo ?? '')
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  // Açık ve işlemdeki talepleri otomatik olarak genişletik göster
  const [expanded, setExpanded] = useState(item.status === 'Open' || item.status === 'InProgress')

  const save = async () => { setBusy(true); try { await updateAdminSupportRequest(item.id, { status, priority, assignedTo: assignedTo || null }); await onChanged() } finally { setBusy(false) } }
  const send = async (event: FormEvent) => { event.preventDefault(); if (reply.trim().length < 3) return; setBusy(true); try { await replyAdminSupportRequest(item.id, reply); setReply(''); setExpanded(true); await onChanged() } finally { setBusy(false) } }

  const statusNames = { Open: 'Açık (Yeni)', InProgress: 'İşlemde', Resolved: 'Çözüldü', Closed: 'Kapalı' }
  const priorityNames = { Low: 'Düşük', Normal: 'Normal', High: 'Yüksek', Urgent: 'Acil (SLA)' }

  // Gelişmiş renk kodları
  const priorityColors = { Low: 'var(--text-muted)', Normal: 'var(--text)', High: 'var(--warning)', Urgent: 'var(--danger)' }
  const statusColors = { Open: 'var(--danger)', InProgress: 'var(--warning)', Resolved: 'var(--success)', Closed: 'var(--text-muted)' }

  return (
    <article className="support-admin-card" style={{ borderLeft: `4px solid ${priorityColors[item.priority]}`, marginBottom: '20px' }}>
        <div className="support-admin-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <span style={{ backgroundColor: 'var(--bg-body)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 'bold' }}>{item.category}</span>
                <h2 style={{ display: 'inline-block', marginLeft: '10px', fontSize: '1.2em' }}>{item.subject}</h2>
            </div>
            <b style={{ color: statusColors[item.status], border: `1px solid ${statusColors[item.status]}`, padding: '4px 8px', borderRadius: '4px', fontSize: '0.9em' }}>
                {statusNames[item.status]}
            </b>
        </div>

        <div className="support-craftsman" style={{ marginTop: '15px', padding: '10px 15px', backgroundColor: 'var(--bg-body)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <strong>👤 {item.craftsman}</strong>
            <span style={{ opacity: 0.7 }}>|</span>
            <small>📞 {item.phoneNumber}</small>
            <span style={{ opacity: 0.7 }}>|</span>
            <small>🕒 Açılış: {dateFormatter.format(new Date(item.createdAtUtc))}</small>
        </div>

        <p style={{ margin: '15px 0', fontSize: '1.05em', lineHeight: '1.6' }}>{item.description}</p>

        {item.referenceValue && (
            <div className="support-admin-reference" style={{ display: 'inline-block', background: 'rgba(255, 193, 7, 0.1)', color: 'var(--warning)', padding: '8px 12px', borderRadius: '4px', marginBottom: '15px' }}>
                <span>🔍 İncelenecek Referans (Ürün Kodu/Satış): </span>
                <code style={{ fontWeight: 'bold', fontSize: '1.1em', marginLeft: '5px' }}>{item.referenceValue}</code>
            </div>
        )}

        <div className="support-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', alignItems: 'end' }}>
            <label>Durum
                <select value={status} onChange={(event) => setStatus(event.target.value as AdminSupportRequest['status'])}>
                    {Object.entries(statusNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
            </label>
            <label>Öncelik
                <select value={priority} onChange={(event) => setPriority(event.target.value as AdminSupportRequest['priority'])} style={{ color: priorityColors[priority as keyof typeof priorityColors], fontWeight: 'bold' }}>
                    {Object.entries(priorityNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
            </label>
            <label>Atanan Görevli
                <input value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="Örn: Destek Ekibi 1" />
            </label>
            <button
                onClick={save}
                disabled={busy || (status === item.status && priority === item.priority && assignedTo === (item.assignedTo ?? ''))}
                type="button"
                style={{ height: '42px' }}
            >
                {busy ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
        </div>

        <button
            className="support-history-toggle"
            onClick={() => setExpanded(!expanded)}
            type="button"
            style={{ width: '100%', marginTop: '15px', padding: '10px', background: 'transparent', border: '1px dashed var(--border)', cursor: 'pointer', borderRadius: '6px' }}
        >
            {expanded ? '▲ Mesajlaşma Geçmişini Gizle' : `▼ Mesajlaşma Geçmişini Göster (${item.responses.length} Yanıt)`}
        </button>

        {expanded && (
            <div className="support-thread" style={{ marginTop: '15px', padding: '15px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-body)' }}>
                {item.responses.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '20px 0' }}>Henüz bu talebe yanıt verilmedi.</p>}

                {/* Sohbet (Chat) tarzı mesaj listeleme */}
                {item.responses.map((response) => (
                    <div key={response.id} style={{
                        marginBottom: '15px',
                        padding: '12px 15px',
                        borderRadius: '8px',
                        background: response.author === 'Usta' ? 'var(--bg-card)' : 'rgba(0, 123, 255, 0.05)',
                        borderLeft: response.author === 'Usta' ? '4px solid var(--border)' : '4px solid var(--primary)',
                        marginLeft: response.author === 'Usta' ? '0' : '30px',
                        marginRight: response.author === 'Usta' ? '30px' : '0'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <b style={{ color: response.author === 'Usta' ? 'var(--text)' : 'var(--primary)' }}>
                                {response.author === 'Usta' ? '👤 Usta' : `🎧 Destek (${response.author})`}
                            </b>
                            <time style={{ fontSize: '0.85em', opacity: 0.7 }}>{dateFormatter.format(new Date(response.createdAtUtc))}</time>
                        </div>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{response.message}</p>
                    </div>
                ))}

                {item.status !== 'Closed' ? (
                    <form onSubmit={send} style={{ display: 'flex', gap: '10px', marginTop: '20px', alignItems: 'flex-start' }}>
                        <textarea
                            value={reply}
                            onChange={(event) => setReply(event.target.value)}
                            minLength={3}
                            maxLength={1500}
                            placeholder="Ustaya iletilecek yanıtı buraya yazın…"
                            required
                            style={{ flex: 1, minHeight: '80px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', resize: 'vertical' }}
                        />
                        <button disabled={busy} type="submit" className="primary-action" style={{ padding: '0 20px', height: '80px', whiteSpace: 'nowrap' }}>
                            {busy ? '...' : 'Yanıt Gönder'}
                        </button>
                    </form>
                ) : (
                    <p style={{ textAlign: 'center', color: 'var(--danger)', marginTop: '20px', fontWeight: 'bold' }}>Bu talep kapatıldığı için yeni yanıt eklenemez.</p>
                )}
            </div>
        )}
    </article>
  )
}

function AdminSupportPage() {
  const [items, setItems] = useState<AdminSupportRequest[]>([])
  const [filter, setFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => { try { setItems(await getAdminSupportRequests(filter || undefined)); setMessage('') } catch { setMessage('Destek talepleri yüklenemedi.') } }

  useEffect(() => { getAdminSupportRequests(filter || undefined).then(setItems).catch(() => setMessage('Destek talepleri yüklenemedi.')) }, [filter])

  const openCount = items.filter((item) => item.status === 'Open').length
  const urgentCount = items.filter((item) => item.priority === 'Urgent' && item.status !== 'Closed').length

  // Arama filtreleme (Konu, açıklama, usta adı, referans kodu)
  const filteredItems = items.filter(item =>
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.craftsman.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.referenceValue && item.referenceValue.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <main className="admin-shell">
        <aside>
            <div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div>
            <nav>
                <a href="/admin">⌂ Genel Bakış</a>
                <a href="/admin/transactions">◴ İşlem Geçmişi</a>
                <a href="/admin/reports">▥ Raporlar</a>
                <a className="active" href="/admin/support">☏ Destek Merkezi</a>
            </nav>
        </aside>
        <section className="admin-main">
            <header>
                <div><span>YÖNETİCİ PANELİ</span><h1>Destek Merkezi</h1></div>
                <b>{filteredItems.length} talep listeleniyor</b>
            </header>

            {message && <p className="admin-message" role="alert">{message}</p>}

            <div className="support-admin-summary" style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
                <article style={{ flex: 1, background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--danger)' }}>
                    <small style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Yeni Açılan Talepler</small>
                    <strong style={{ fontSize: '28px' }}>{openCount}</strong>
                </article>
                <article style={{ flex: 1, background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--warning)' }}>
                    <small style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Acil (SLA) Talepleri</small>
                    <strong style={{ fontSize: '28px', color: urgentCount > 0 ? 'var(--danger)' : 'inherit' }}>{urgentCount}</strong>
                </article>

                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <select value={filter} onChange={(event) => setFilter(event.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <option value="">Tüm Talepler (Durum Filtresi Yok)</option>
                        <option value="Open">Yeni Açılanlar (Açık)</option>
                        <option value="InProgress">İşlemde Olanlar</option>
                        <option value="Resolved">Çözüldü Olarak İşaretlenenler</option>
                        <option value="Closed">Kapatılanlar</option>
                    </select>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder="Usta adı, konu veya işlem referans kodu (Örn: USTA-...) ara"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} type="button" style={{ padding: '0 15px' }}>Temizle</button>
                        )}
                    </div>
                </div>
            </div>

            <section className="support-admin-list">
                {filteredItems.length === 0 && (
                    <div style={{ padding: '50px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '40px', display: 'block', marginBottom: '15px' }}>🔍</span>
                        <p style={{ fontSize: '1.1em' }}>Seçtiğiniz filtreye veya aramaya uygun destek talebi bulunamadı.</p>
                    </div>
                )}
                {filteredItems.map((item) => (
                    <AdminSupportCard item={item} key={`${item.id}-${item.updatedAtUtc}`} onChanged={load} />
                ))}
            </section>
        </section>
    </main>
  )
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

function AdminOutboxPage() {
  const [data, setData] = useState<AdminOutboxResponse | null>(null), [message, setMessage] = useState(''), [busyId, setBusyId] = useState('')
  const load = async () => { try { setData(await getAdminOutbox()); setMessage('') } catch (error) { setMessage(error instanceof Error ? error.message : 'Teslim kuyruğu yüklenemedi.') } }
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 10000); return () => window.clearInterval(timer) }, [])
  const retry = async (id: string) => { setBusyId(id); try { await retryAdminOutbox(id); await load(); setMessage('Kayıt yeniden kuyruğa alındı.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Tekrar başlatılamadı.') } finally { setBusyId('') } }
  const statusNames: Record<string, string> = { Pending: 'Bekliyor', Delivered: 'Teslim Edildi', Failed: 'Başarısız' }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a className="active" href="/admin/outbox">↻ Teslim Kuyruğu</a><a href="/admin/audit">⌁ Denetim Kaydı</a><a href="/admin/notifications">♧ Bildirimler</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Güvenilir Teslim Kuyruğu</h1></div><b>10 saniyede yenilenir</b></header>{message && <p className="admin-info-message">{message}</p>}<div className="outbox-summary"><article><small>Bekleyen</small><strong>{data?.summary.pending ?? 0}</strong></article><article><small>Teslim Edilen</small><strong>{data?.summary.delivered ?? 0}</strong></article><article className={(data?.summary.failed ?? 0) > 0 ? 'danger' : ''}><small>Başarısız</small><strong>{data?.summary.failed ?? 0}</strong></article></div><section className="outbox-list">{data?.rows.map((item) => <article key={item.id}><span className={`outbox-state ${item.status.toLowerCase()}`}>{statusNames[item.status]}</span><div><strong>{item.type === 'CraftsmanNotification' ? 'Usta uygulama bildirimi' : item.type}</strong><small>{item.id.slice(0, 8)} · {dateFormatter.format(new Date(item.createdAtUtc))}</small>{item.lastError && <p>{item.lastError}</p>}</div><span>{item.attemptCount} deneme</span>{item.status === 'Failed' && <button onClick={() => void retry(item.id)} disabled={busyId === item.id} type="button">{busyId === item.id ? 'Ekleniyor…' : 'Tekrar Dene'}</button>}</article>)}{data && data.rows.length === 0 && <p className="audit-empty">Kuyruk henüz boş. Puan, iade veya ödül işlemlerinden sonra güvenilir bildirim kayıtları burada görünecek.</p>}</section><aside className="audit-note">İşlem ve bildirim aynı SQL Server kaydında güvenceye alınır. Sunucu kapanırsa bekleyen kayıt kaybolmaz; sistem açıldığında otomatik devam eder.</aside></section></main>
}

function AdminAuditPage() {
  const [data, setData] = useState<AdminAuditResponse | null>(null)
  const [filter, setFilter] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
      getAdminAudit(filter || undefined).then(setData).catch(() => setMessage('Denetim kaydı yüklenemedi.'))
  }, [filter])

  const actionNames: Record<string, string> = {
      ActiveStatusChanged: 'Durum Değiştirildi',
      DealerOnboarded: 'Yeni Bayi Kuruldu',
      EmployeeCreated: 'Çalışan Oluşturuldu',
      AccessCodeReset: 'Erişim Kodu Yenilendi',
      NotificationSent: 'Bildirim Gönderildi',
      ProductCodesImported: 'Ürün Kodları Yüklendi',
      PointAdjustment: 'Manuel Puan Düzeltildi',
      CampaignApproved: 'Kampanya Onaylandı',
      CampaignRejected: 'Kampanya Reddedildi',
      CampaignCreated: 'Kampanya Oluşturuldu'
  }

  // İşlem türüne göre simgeler
  const icons: Record<string, string> = {
      Craftsman: '👤',
      Dealer: '🏢',
      DealerEmployee: '👨‍💼',
      AdminBroadcast: '📢',
      Product: '📦',
      Campaign: '🎯',
      OutboxMessage: '🔄'
  }

  // İşlem türüne göre sol kenar vurgu renkleri (Güvenlik / Denetim için)
  const actionColors: Record<string, string> = {
      PointAdjustment: 'var(--danger)',     // Finansal müdahale - Kırmızı vurgu
      DealerOnboarded: 'var(--success)',    // Yeni bayi - Yeşil vurgu
      CampaignApproved: 'var(--success)',   // Onay - Yeşil vurgu
      CampaignRejected: 'var(--danger)',    // Ret - Kırmızı vurgu
      ProductCodesImported: 'var(--warning)',// Stok/Kod yükleme - Sarı vurgu
      ActiveStatusChanged: 'var(--info)'    // Durum değişimi - Mavi/Nötr
  }

  return (
    <main className="admin-shell">
        <aside>
            <div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div>
            <nav>
                <a href="/admin">⌂ Genel Bakış</a>
                <a href="/admin/transactions">◴ İşlem Geçmişi</a>
                <a className="active" href="/admin/audit">⌁ Denetim Kaydı</a>
                <a href="/admin/reports">▥ Raporlar</a>
            </nav>
        </aside>
        <section className="admin-main">
            <header>
                <div><span>YÖNETİCİ PANELİ</span><h1>Yönetici Denetim Kaydı (Audit Log)</h1></div>
                <b>Değiştirilemez merkezi loglar</b>
            </header>

            {message && <p className="admin-message" role="alert">{message}</p>}

            <div className="audit-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '400px' }}>Varlık Türüne Göre Filtrele:
                    <select value={filter} onChange={(event) => setFilter(event.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <option value="">Tüm Kritik İşlemler</option>
                        {data?.entityTypes.map((item) => <option value={item} key={item}>{item}</option>)}
                    </select>
                </label>
                <span style={{ fontWeight: 'bold' }}>{data?.rows.length ?? 0} kayıt gösteriliyor</span>
            </div>

            <section className="audit-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data?.rows.map((item) => {
                    const borderColor = actionColors[item.action] || 'var(--border)'
                    return (
                        <article key={item.id} style={{ display: 'flex', gap: '15px', background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', borderLeft: `5px solid ${borderColor}`, alignItems: 'flex-start' }}>
                            <span className="audit-icon" style={{ fontSize: '24px', background: 'var(--bg-body)', padding: '8px', borderRadius: '6px' }}>
                                {icons[item.entityType] ?? '⌁'}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div className="audit-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <strong style={{ fontSize: '1.05em', color: borderColor }}>
                                        {actionNames[item.action] ?? item.action}
                                    </strong>
                                    <time style={{ fontSize: '0.85em', opacity: 0.7 }}>
                                        {dateFormatter.format(new Date(item.createdAtUtc))}
                                    </time>
                                </div>
                                <p style={{ margin: '8px 0', lineHeight: '1.4' }}>{item.details}</p>
                                <small style={{ display: 'block', opacity: 0.8, fontSize: '0.9em' }}>
                                    İşlemi Yapan Yönetici: <b style={{ color: 'var(--text)' }}>{item.actor}</b> · Varlık: {item.entityType} {item.entityId ? `(ID: ${item.entityId.slice(0, 8)})` : ''}
                                </small>
                            </div>
                        </article>
                    )
                })}

                {data && data.rows.length === 0 && (
                    <div style={{ padding: '50px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '40px', display: 'block', marginBottom: '15px' }}>🛡️</span>
                        <p style={{ fontSize: '1.1em' }}>Henüz merkezi denetim kaydı bulunmuyor. Yeni kritik yönetici işlemleri burada listelenecektir.</p>
                    </div>
                )}
            </section>

            <aside className="audit-note" style={{ marginTop: '25px', padding: '15px', background: 'rgba(0,123,255,0.05)', borderRadius: '8px', fontSize: '0.9em', borderLeft: '3px solid var(--primary)' }}>
                ℹ️ Bu ekran iş verisini doğrudan değiştirmez. Kayıtlar; güvenlik incelemesi, kullanıcı itirazları ve yasal operasyon denetimi amacıyla değiştirilemez şekilde saklanır.
            </aside>
        </section>
    </main>
  )
}

function AdminCouponsPage() {
  const [data, setData] = useState<AdminCouponResponse | null>(null), [status, setStatus] = useState(''), [search, setSearch] = useState(''), [message, setMessage] = useState('')
  const load = async (nextStatus = status, nextSearch = search) => { try { setData(await getAdminCoupons(nextStatus || undefined, nextSearch.trim() || undefined)); setMessage('') } catch (error) { setMessage(error instanceof Error ? error.message : 'Kupon takibi yüklenemedi.') } }
  useEffect(() => { getAdminCoupons().then(setData).catch(() => setMessage('Kupon takibi yüklenemedi.')) }, [])
  const selectStatus = (value: string) => { setStatus(value); void load(value, search) }
  const statusNames: Record<string, string> = { Created: 'Bekliyor', Fulfilled: 'Teslim Edildi', Expired: 'Süresi Doldu', Cancelled: 'İptal' }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/rewards">♙ Ödüller</a><a className="active" href="/admin/coupons">▦ Kupon Takibi</a><a href="/admin/transactions">◴ İşlem Geçmişi</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Kupon ve Teslimat Takibi</h1></div><b>{data?.rows.length ?? 0} kayıt</b></header>{message && <p className="admin-message">{message}</p>}<div className="coupon-admin-stats"><button className={status === 'active' ? 'active' : ''} onClick={() => selectStatus('active')} type="button"><small>Aktif</small><strong>{data?.summary.active ?? 0}</strong></button><button className={status === 'expiring' ? 'active warning' : 'warning'} onClick={() => selectStatus('expiring')} type="button"><small>7 Gün İçinde</small><strong>{data?.summary.expiring ?? 0}</strong></button><button className={status === 'expired' ? 'active danger' : 'danger'} onClick={() => selectStatus('expired')} type="button"><small>Süresi Dolan</small><strong>{data?.summary.expired ?? 0}</strong></button><button className={status === 'fulfilled' ? 'active' : ''} onClick={() => selectStatus('fulfilled')} type="button"><small>Teslim Edilen</small><strong>{data?.summary.fulfilled ?? 0}</strong></button><button className={status === 'cancelled' ? 'active' : ''} onClick={() => selectStatus('cancelled')} type="button"><small>İptal</small><strong>{data?.summary.cancelled ?? 0}</strong></button></div><form className="coupon-admin-toolbar" onSubmit={(event) => { event.preventDefault(); void load() }}><button onClick={() => selectStatus('')} type="button">Tümünü Göster</button><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kupon kodu, usta veya ödül ara" /><button type="submit">Ara</button></form><section className="coupon-admin-table"><div className="coupon-admin-row heading"><span>Kupon / Ödül</span><span>Usta</span><span>Durum</span><span>Geçerlilik</span><span>Teslimat</span></div>{data?.rows.map((item) => <article className="coupon-admin-row" key={item.id}><span><code>{item.fulfillmentCode}</code><b>{item.reward}</b><small>{item.deliveryType === 'Digital' ? 'Dijital' : `${numberFormatter.format(item.pointsSpent)} puan`}</small></span><span><b>{item.craftsman}</b><small>{item.phoneNumber}</small></span><span><b className={`coupon-status ${item.displayStatus.toLowerCase()}`}>{statusNames[item.displayStatus] ?? item.displayStatus}</b><small>{dateFormatter.format(new Date(item.createdAtUtc))}</small></span><span>{item.expiresAtUtc ? <><b>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.expiresAtUtc))}</b><small>{new Date(item.expiresAtUtc) <= new Date() && item.displayStatus === 'Expired' ? 'Kullanılamaz' : 'Son kullanım'}</small></> : <b>Süresiz</b>}</span><span>{item.fulfilledAtUtc ? <><b>{item.dealer ?? 'Dijital teslim'}</b><small>{item.dealerEmployee ?? dateFormatter.format(new Date(item.fulfilledAtUtc))}</small></> : <b>Henüz teslim edilmedi</b>}</span></article>)}</section>{data && data.rows.length === 0 && <p className="coupon-admin-empty">Bu filtrede kupon bulunmuyor.</p>}</section></main>
}

function AdminNotificationsPage() {
  const [title, setTitle] = useState(''), [body, setBody] = useState(''), [level, setLevel] = useState(''), [city, setCity] = useState('')
  const [recipientCount, setRecipientCount] = useState(0), [cities, setCities] = useState<string[]>([]), [history, setHistory] = useState<AdminNotificationHistory[]>([])
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  const loadHistory = async () => setHistory(await getAdminNotificationHistory())
  useEffect(() => { getAdminNotificationAudience(level || undefined, city || undefined).then((data) => { setRecipientCount(data.recipientCount); setCities(data.cities) }).catch(() => setMessage('Hedef kitle hesaplanamadı.')) }, [level, city])
  useEffect(() => { loadHistory().catch(() => setMessage('Bildirim geçmişi yüklenemedi.')) }, [])
  const send = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await sendAdminTargetedNotification(title.trim(), body.trim(), level || undefined, city || undefined); setMessage(`Bildirim ${result.recipientCount} ustaya gönderildi.`); setTitle(''); setBody(''); setConfirmed(false); await loadHistory() } catch (error) { setMessage(error instanceof Error ? error.message : 'Bildirim gönderilemedi.') } finally { setBusy(false) } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/campaigns">◇ Kampanyalar</a><a className="active" href="/admin/notifications">♧ Bildirimler</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Hedefli Bildirim</h1></div><b>Kullanıcı tercihleri korunur</b></header><div className="notification-admin-layout"><form className="notification-compose" onSubmit={send}><h2>Yeni uygulama içi bildirim</h2><p>Yalnızca kampanya bildirimlerine izin vermiş aktif ustalar hedefe dahil edilir.</p><div className="notification-targets"><label>Seviye<select value={level} onChange={(event) => setLevel(event.target.value)}><option value="">Tüm seviyeler</option><option value="Bronze">Bronz</option><option value="Silver">Gümüş</option><option value="Gold">Altın</option></select></label><label>Şehir<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">Tüm şehirler</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="audience-preview"><span>Hedeflenen uygun usta</span><strong>{recipientCount}</strong></div><label>Başlık<input value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} maxLength={140} required /></label><label>Mesaj<textarea value={body} onChange={(event) => setBody(event.target.value)} minLength={10} maxLength={500} required /></label><label className="adjustment-confirm"><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span>Hedef kitleyi ve mesajı kontrol ettim. Gönderimden sonra bildirimlerin kullanıcı hesaplarına kaydedileceğini biliyorum.</span></label><button disabled={busy || !confirmed || recipientCount === 0} type="submit">{busy ? 'Gönderiliyor…' : `${recipientCount} Ustaya Gönder`}</button>{message && <p className="admin-info-message">{message}</p>}</form><section className="notification-history"><h2>Gönderim geçmişi</h2>{history.length === 0 && <p>Henüz yönetici bildirimi gönderilmedi.</p>}{history.map((item) => <article key={item.id}><div><strong>{item.title}</strong><time>{dateFormatter.format(new Date(item.createdAtUtc))}</time></div><p>{item.message}</p><span>{item.recipientCount} alıcı · {item.readCount} okundu</span><progress value={item.readCount} max={item.recipientCount} /></article>)}</section></div></section></main>
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

function DealerActivityPage() {
  const [data, setData] = useState<DealerActivityResponse | null>(null), [filter, setFilter] = useState(''), [message, setMessage] = useState(''), [loading, setLoading] = useState(true), [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setMessage('')
    getDealerActivity(filter || undefined, controller.signal)
      .then(setData)
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === 'AbortError')) setMessage(error instanceof Error ? error.message : 'Geçmiş yüklenemedi.') })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [filter, refreshKey])
  const labels: Record<string, string> = { Sale: 'Satış', Coupon: 'Kupon', Return: 'İade', Risk: 'Risk' }
  const statuses: Record<string, string> = { Completed: 'Tamamlandı', Fulfilled: 'Teslim Edildi', Open: 'Açık', InReview: 'İncelemede', Resolved: 'Çözüldü', Rejected: 'Reddedildi' }
  return <main className="dealer-history-shell"><header><div><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Bayi İşlem Geçmişi</strong></div></div><div className="dealer-history-header-actions"><button onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} type="button">{loading ? 'Yükleniyor…' : 'Yenile'}</button><a href="/dealer">İşlemlere dön</a></div></header>{message && <div className="dealer-history-error" role="alert"><span>{message}</span><button onClick={() => setRefreshKey((value) => value + 1)} type="button">Tekrar dene</button></div>}{loading && !data && <div className="dealer-history-state" aria-live="polite">İşlem geçmişi yükleniyor…</div>}<div className="dealer-history-stats"><article><strong>{data?.summary.sales ?? 0}</strong><span>Satış</span></article><article><strong>{data?.summary.coupons ?? 0}</strong><span>Kupon</span></article><article><strong>{data?.summary.returns ?? 0}</strong><span>İade</span></article><article><strong>{data?.summary.risks ?? 0}</strong><span>Risk</span></article></div><nav className="dealer-history-filters" aria-label="İşlem türü filtresi">{[['', 'Tümü'], ['Sale', 'Satış'], ['Coupon', 'Kupon'], ['Return', 'İade'], ['Risk', 'Risk']].map(([value, label]) => <button className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)} type="button" key={value}>{label}</button>)}</nav><section className="dealer-activity-list">{data?.rows.map((item) => <article key={`${item.type}-${item.id}`}><span className={`activity-icon ${item.type.toLowerCase()}`}>{item.type === 'Sale' ? '₺' : item.type === 'Coupon' ? '▦' : item.type === 'Return' ? '↩' : '⚑'}</span><div><div className="activity-title"><strong>{item.title}</strong><b>{statuses[item.status] ?? item.status}</b></div><p>{item.detail}</p><dl><div><dt>Tür</dt><dd>{labels[item.type]}</dd></div><div><dt>Usta</dt><dd>{item.craftsman}</dd></div><div><dt>Çalışan</dt><dd>{item.employee}</dd></div><div><dt>Referans</dt><dd>{item.reference}</dd></div></dl><time>{dateFormatter.format(new Date(item.occurredAtUtc))}</time></div></article>)}{!loading && data && data.rows.length === 0 && <p className="dealer-history-empty">Bu filtrede işlem bulunmuyor.</p>}</section><aside className="dealer-history-note">Yalnızca giriş yaptığınız bayiye bağlı işlemler gösterilir. Referans numarasını destek veya şüpheli işlem bildiriminde kullanabilirsiniz.</aside></main>
}

function DealerLogin({ onAuthenticated }: { onAuthenticated: (profile: DealerLoginResult) => void }) {
  const [dealerCode, setDealerCode] = useState('YLV-001'), [pin, setPin] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await loginDealer(dealerCode, pin); authStore.setDealerToken(result.token); onAuthenticated(result) } catch (error) { setMessage(error instanceof Error ? error.message : 'Giriş yapılamadı.') } finally { setBusy(false) } }
  return <main className="dealer-login"><div className="login-logo">▣</div><span>BAYİ BAĞLANTISI</span><h1>Çalışan Girişi</h1><p>Kupon teslimi ve iade işlemleri yetkili çalışan oturumuyla yapılır.</p><form onSubmit={submit}><label>Bayi kodu<input value={dealerCode} onChange={(event) => setDealerCode(event.target.value.toUpperCase())} minLength={3} maxLength={30} required /></label><label>6 haneli çalışan kodu<input className="dealer-pin" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label><small>Geliştirme girişi: YLV-001 / 123456</small>{message && <p>{message}</p>}<button disabled={busy} type="submit">{busy ? 'Doğrulanıyor…' : 'Güvenli Giriş'}</button></form></main>
}

function DealerPortal({ risk = false, history = false }: { risk?: boolean; history?: boolean }) {
  const [profile, setProfile] = useState<DealerLoginResult | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) } }, [])
  if (!profile) return <>{!online && <div className="dealer-offline-banner" role="alert">⌁ İnternet bağlantısı yok — bayi işlemleri sunucu bağlantısı gelince kullanılabilir.</div>}<DealerLogin onAuthenticated={setProfile} /></>
  const exit = async () => { await logoutDealer(); setProfile(null) }
  return <>{!online && <div className="dealer-offline-banner" role="alert">⌁ İnternet bağlantısı yok — teslim, iade ve satış işlemleri sunucu onayı bekler.</div>}{risk ? <DealerRiskPage /> : history ? <DealerActivityPage /> : <DealerApp />}<div className="dealer-shortcuts"><a href="/dealer">İşlemler</a><a href="/dealer/history">Geçmiş</a><a href="/dealer/risk">Şüpheli İşlem</a></div><button className="dealer-logout" onClick={exit} type="button">Oturumu Kapat</button></>
}

function DealerPerformance({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<DealerDashboard | null>(null); const [error, setError] = useState(''); const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => { const controller = new AbortController(); setError(''); getDealerDashboard(controller.signal).then(setData).catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError(reason instanceof Error ? reason.message : 'Bayi özeti yüklenemedi.') }); return () => controller.abort() }, [refreshKey, reloadKey])
  if (error) return <div className="dealer-message dealer-performance-error" role="alert"><span>{error}</span><button onClick={() => setReloadKey((value) => value + 1)} type="button">Tekrar dene</button></div>
  if (!data) return <section className="dealer-performance loading">Bayi katkısı hesaplanıyor…</section>
  return <section className="dealer-performance"><div className="dealer-performance-title"><div><small>BU AYKİ KULÜP KATKISI</small><strong>{data.dealer}</strong></div><b>{numberFormatter.format(data.month.amount)} TL</b></div><div className="dealer-today-summary"><div><small>BUGÜN</small><strong>{numberFormatter.format(data.today.sales)} eşleşen satış</strong></div><b>{numberFormatter.format(data.today.amount)} TL</b></div><div className="dealer-performance-stats"><article><strong>{data.month.sales}</strong><span>Eşleşen satış</span></article><article><strong>{data.month.uniqueCraftsmen}</strong><span>Farklı usta</span></article><article><strong>{data.month.fulfilledRewards}</strong><span>Ödül teslimi</span></article><article><strong>{data.month.returns}</strong><span>İade işlemi</span></article></div>{data.recentSales.length > 0 && <details><summary>Son eşleşen satışlar</summary>{data.recentSales.map((sale) => <div key={sale.id}><span><b>{sale.saleReference}</b><small>{sale.craftsman}</small></span><strong>{numberFormatter.format(sale.totalAmount)} TL</strong></div>)}</details>}</section>
}

function DealerSalePanel({ onSaved }: { onSaved: () => void }) {
  const [membershipToken, setMembershipToken] = useState('')
  const [saleReference, setSaleReference] = useState('')
  const [totalAmount, setTotalAmount] = useState<number | ''>('')
  const [verifiedName, setVerifiedName] = useState('')
  const [result, setResult] = useState<DealerSaleResult | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  // Geliştirilmiş Kamera State'leri
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraState, setCameraState] = useState<'starting' | 'active' | 'unavailable' | 'denied'>('starting')
  const memberVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!cameraOpen) return
    let stopped = false
    let stream: MediaStream | null = null

    const start = async () => {
      setCameraState('starting')
      const Detector = (window as typeof window & { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector

      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
        setCameraState('unavailable')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (stopped) { stream.getTracks().forEach((track) => track.stop()); return }

        if (memberVideoRef.current) {
            memberVideoRef.current.srcObject = stream
            await memberVideoRef.current.play()
        }
        setCameraState('active')

        const detector = new Detector({ formats: ['qr_code'] })
        const scan = async () => {
          if (stopped || !memberVideoRef.current) return
          try {
            const found = await detector.detect(memberVideoRef.current).catch(() => [])
            if (found[0]?.rawValue) {
              setMembershipToken(found[0].rawValue.toUpperCase())
              setCameraOpen(false)
              // Kodu okur okumaz direkt doğrulamaya geçebiliriz (opsiyonel ama iyi bir UX)
              setMessage('QR okundu, doğrulayabilirsiniz.')
              return
            }
          } catch { /* Kare atla */ }
          window.setTimeout(scan, 300)
        }
        void scan()
      } catch (error: unknown) {
        if (!stopped) {
            if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
                setCameraState('denied')
            } else {
                setCameraState('unavailable')
            }
        }
      }
    }

    void start()
    return () => { stopped = true; stream?.getTracks().forEach((track) => track.stop()) }
  }, [cameraOpen])

  const verify = async () => {
    setBusy(true); setMessage(''); setResult(null)
    try {
      const member = await verifyMembershipPass(membershipToken.trim().toUpperCase())
      setVerifiedName(`${member.craftsman} · ${levelNames[member.level] ?? member.level}`)
      setMessage('') // Başarılıysa hata mesajını temizle
    } catch (error) {
      setVerifiedName('')
      setMessage(error instanceof Error ? error.message : 'Üyelik doğrulanamadı.')
    } finally {
      setBusy(false)
    }
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!totalAmount) return
    setBusy(true); setMessage(''); setResult(null)
    try {
      const sale = await createDealerSale(membershipToken.trim().toUpperCase(), saleReference.trim().toUpperCase(), Number(totalAmount))
      setResult(sale)
      setVerifiedName(''); setMembershipToken(''); setSaleReference(''); setTotalAmount('')
      onSaved()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Satış eşleştirilemedi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <form className="dealer-search dealer-sale" onSubmit={save}>

        {/* Gelişmiş Kamera Arayüzü */}
        {cameraOpen && (
            <div className="camera-frame" style={{ marginBottom: '15px' }} aria-live="polite">
                <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
                <video className={cameraState === 'active' ? 'camera-preview active' : 'camera-preview'} ref={memberVideoRef} playsInline muted />

                {cameraState === 'starting' && <span className="camera-status">Kamera hazırlanıyor…</span>}
                {cameraState === 'denied' && (
                    <div className="camera-error-box">
                        <span className="camera-error-icon">⊘</span>
                        <strong>Kamera İzni Gerekli</strong>
                        <small>Ustanın kodunu okutmak için tarayıcı ayarlarından kameraya izin verin.</small>
                    </div>
                )}
                {cameraState === 'unavailable' && (
                    <div className="camera-error-box">
                        <span className="camera-error-icon">⚠</span>
                        <strong>Kamera Bulunamadı</strong>
                        <small>Cihazınızda kamera desteklenmiyor. Kodu elle girebilirsiniz.</small>
                    </div>
                )}
            </div>
        )}

        <button
            className={`secondary-action ${cameraOpen ? 'active' : ''}`}
            onClick={() => setCameraOpen(!cameraOpen)}
            type="button"
            style={{ marginBottom: '20px' }}
        >
            <span>{cameraOpen ? '✕' : '📷'}</span> {cameraOpen ? 'Kamerayı Kapat' : 'Kamerayla QR Okut'}
        </button>

        <label>Üyelik kodu (QR)
            <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    value={membershipToken}
                    onChange={(event) => { setMembershipToken(event.target.value.toUpperCase()); setVerifiedName(''); setResult(null) }}
                    minLength={8}
                    placeholder="UKM-..."
                    required
                    style={{ flex: 1 }}
                />
                <button
                    onClick={verify}
                    disabled={busy || membershipToken.length < 8}
                    type="button"
                    style={{ padding: '0 15px', whiteSpace: 'nowrap' }}
                >
                    Doğrula
                </button>
            </div>
        </label>

        {verifiedName && <p className="verified-member" style={{ color: 'var(--success)', fontWeight: 'bold', margin: '-5px 0 15px' }}>✓ Doğrulandı: {verifiedName}</p>}

        <label>Fatura / Satış Referansı
            <input
                value={saleReference}
                onChange={(event) => setSaleReference(event.target.value.toUpperCase())}
                minLength={3}
                maxLength={80}
                placeholder="Örn: FIS-2026-001"
                required
            />
        </label>

        <label>Satış Toplamı (TL)
            <input
                value={totalAmount}
                onChange={(event) => setTotalAmount(event.target.value ? Number(event.target.value) : '')}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
            />
        </label>

        <button disabled={busy || !verifiedName || !totalAmount} type="submit" className="primary-action">
            {busy ? 'İşleniyor…' : 'Satışı Ustayla Eşleştir'}
        </button>
      </form>

      {message && <p className="dealer-message" role="alert">{message}</p>}

      {result && (
        <section className="dealer-return-result" style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--success)' }}>
            <span style={{ color: 'var(--success)', fontSize: '24px', marginRight: '10px' }}>✓</span>
            <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
                <b style={{ display: 'block', fontSize: '1.1em' }}>{result.craftsman}</b>
                <p style={{ margin: '5px 0' }}>{result.saleReference} numaralı satış başarıyla eşleştirildi.</p>
                <small style={{ fontWeight: 'bold' }}>Tutar: {numberFormatter.format(result.totalAmount)} TL</small>
            </div>
        </section>
      )}
    </>
  )
}

function DealerApp() {
  const [mode, setMode] = useState<'coupon' | 'return' | 'sale'>('coupon')
  const [activityVersion, setActivityVersion] = useState(0)

  const [code, setCode] = useState('')
  const [reason, setReason] = useState('')
  const [coupon, setCoupon] = useState<DealerCoupon | null>(null)
  const [returnResult, setReturnResult] = useState<ProductReturnResult | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function changeMode(next: 'coupon' | 'return' | 'sale') {
    setMode(next); setCode(''); setReason(''); setCoupon(null); setReturnResult(null); setMessage('')
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setMessage(''); setCoupon(null)
    try {
        setCoupon(await verifyDealerCoupon(code.trim().toUpperCase()))
    } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Kupon doğrulanamadı.')
    } finally {
        setBusy(false)
    }
  }

  async function fulfill() {
    // GÜVENLİK KORUMASI: Yanlış tıklamayı önlemek için onay soruyoruz
    if (!window.confirm("Ödülü ustaya fiziki olarak teslim ettiğinizi onaylıyor musunuz? Bu işlem geri alınamaz.")) {
        return
    }

    setBusy(true); setMessage('')
    try {
        const result = await fulfillDealerCoupon(code.trim().toUpperCase())
        setCoupon(result)
        if (!result.alreadyProcessed) setActivityVersion((value) => value + 1)
        setMessage(result.alreadyProcessed ? 'Bu teslim işlemi daha önce onaylanmış.' : '✓ Ödül teslimi başarıyla onaylandı.')
    } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Teslim onaylanamadı.')
    } finally {
        setBusy(false)
    }
  }

  async function returnProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // GÜVENLİK KORUMASI: İade işlemi ustanın puanını düşüreceği için onay soruyoruz
    if (!window.confirm("Bu ürünün iadesini onaylıyor musunuz? Ustanın bu koddan kazandığı puan hesabından otomatik olarak düşülecektir.")) {
        return
    }

    setBusy(true); setMessage(''); setReturnResult(null)
    try {
        const result = await returnDealerProduct(code.trim().toUpperCase(), reason.trim())
        setReturnResult(result)
        if (!result.alreadyProcessed) setActivityVersion((value) => value + 1)
        setMessage(result.alreadyProcessed ? 'Bu ürün daha önce iade edilmiş.' : '✓ Ürün iadesi ve puan geri alma tamamlandı.')
    } catch (error) {
        setMessage(error instanceof Error ? error.message : 'İade tamamlanamadı.')
    } finally {
        setBusy(false)
    }
  }

  const expired = coupon?.expiresAtUtc ? new Date(coupon.expiresAtUtc) <= new Date() : false
  const isValid = coupon?.status === 'Created' && !expired

  return (
    <main className="dealer-shell">
        <header>
            <div><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Bayi Paneli</strong></div></div>
            <i>Yalova Merkez Bayi</i>
        </header>

        <DealerPerformance refreshKey={activityVersion} />

        <nav className="dealer-tabs" role="tablist">
            <button role="tab" aria-selected={mode === 'coupon'} className={mode === 'coupon' ? 'active' : ''} onClick={() => changeMode('coupon')} type="button">Kupon Teslimi</button>
            <button role="tab" aria-selected={mode === 'return'} className={mode === 'return' ? 'active' : ''} onClick={() => changeMode('return')} type="button">Ürün İadesi</button>
            <button role="tab" aria-selected={mode === 'sale'} className={mode === 'sale' ? 'active' : ''} onClick={() => changeMode('sale')} type="button">Satış Eşleştir</button>
        </nav>

        <section className="dealer-hero">
            <span>{mode === 'coupon' ? '▦' : mode === 'sale' ? '♧' : '↩'}</span>
            <h1>{mode === 'coupon' ? 'Kupon Doğrula ve Teslim Et' : mode === 'sale' ? 'Satışı Ustayla Eşleştir' : 'Ürün İadesi'}</h1>
            <p>{mode === 'coupon' ? 'Ustanın uygulamasından gösterdiği kodu girerek ödül teslimini onaylayın.' : mode === 'sale' ? 'Ustanın uygulamasındaki üyelik QR kodunu okutarak satışı eşleştirin.' : 'İade edilen ürünün kodunu ve nedenini girin. Ustanın kazandığı puan sistemden otomatik geri alınır.'}</p>
        </section>

        {mode === 'sale' ? (
            <DealerSalePanel onSaved={() => setActivityVersion((value) => value + 1)} />
        ) : mode === 'coupon' ? (
            <>
                <form className="dealer-search" onSubmit={verify}>
                    <label>Kupon kodu (UK- İle Başlar)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            value={code}
                            onChange={(event) => {setCode(event.target.value.toUpperCase()); setCoupon(null); setMessage('')}}
                            placeholder="Örn: UK-1A2B3C..."
                            minLength={6}
                            required
                            autoFocus
                            style={{ flex: 1 }}
                        />
                        <button disabled={busy || code.length < 6} type="submit" style={{ padding: '0 15px' }}>
                            {busy ? 'Kontrol…' : 'Doğrula'}
                        </button>
                    </div>
                </form>

                {message && !coupon && <p className="dealer-message" role="alert">{message}</p>}

                {coupon && (
                    <section className="dealer-coupon" style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: 'var(--bg-card)', border: isValid ? '1px solid var(--success)' : '1px solid var(--danger)' }}>
                        <div className={`dealer-validity ${isValid ? 'valid' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <span style={{ fontSize: '24px', color: isValid ? 'var(--success)' : 'var(--danger)' }}>{isValid ? '✓' : '!'}</span>
                            <div>
                                <b style={{ display: 'block', fontSize: '1.2em', color: isValid ? 'var(--success)' : 'var(--danger)' }}>
                                    {isValid ? 'Kupon Geçerli' : coupon.status === 'Fulfilled' ? 'Kupon Zaten Kullanılmış' : 'Kupon Süresi Dolmuş veya İptal'}
                                </b>
                                <small style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>{coupon.fulfillmentCode}</small>
                            </div>
                        </div>

                        <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '6px' }}>
                            <div><dt style={{ opacity: 0.7, fontSize: '0.9em' }}>Ödül</dt><dd style={{ fontWeight: 'bold' }}>{coupon.reward}</dd></div>
                            <div><dt style={{ opacity: 0.7, fontSize: '0.9em' }}>Usta</dt><dd style={{ fontWeight: 'bold' }}>{coupon.craftsman}</dd></div>
                            <div style={{ gridColumn: '1 / -1' }}><dt style={{ opacity: 0.7, fontSize: '0.9em' }}>Son Kullanım</dt><dd>{coupon.expiresAtUtc ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(coupon.expiresAtUtc)) : 'Süresiz'}</dd></div>
                        </dl>

                        {message && <p className="dealer-message" style={{ margin: '15px 0' }} role="alert">{message}</p>}

                        {isValid && (
                            <div style={{ marginTop: '15px' }}>
                                <button className="dealer-fulfill primary-action" onClick={fulfill} disabled={busy} type="button" style={{ width: '100%', padding: '12px' }}>
                                    {busy ? 'İşleniyor...' : 'Ödülü Teslim Et ve Onayla'}
                                </button>
                                <small className="dealer-warning" style={{ display: 'block', textAlign: 'center', marginTop: '10px', color: 'var(--text-muted)' }}>
                                    Teslim onayı geri alınamaz. Lütfen ödülü ustaya verdikten sonra onaylayın.
                                </small>
                            </div>
                        )}
                    </section>
                )}
            </>
        ) : (
            <>
                <form className="dealer-search dealer-return" onSubmit={returnProduct}>
                    <label>İade Edilen Ürün Kodu
                        <input
                            value={code}
                            onChange={(event) => {setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')); setReturnResult(null); setMessage('')}}
                            placeholder="USTA-XXXX-XXXX"
                            minLength={8}
                            required
                            autoFocus
                        />
                    </label>
                    <label>İade Nedeni
                        <textarea
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            minLength={3}
                            maxLength={200}
                            placeholder="Ürünün iade edilme nedenini detaylıca yazın (Zorunlu)"
                            required
                            rows={3}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', resize: 'vertical' }}
                        />
                    </label>
                    <button disabled={busy || code.length < 8 || reason.length < 3} type="submit" className="danger-action" style={{ backgroundColor: 'var(--danger)', color: 'white', marginTop: '10px' }}>
                        {busy ? 'İşleniyor…' : 'İadeyi Tamamla ve Puanı Geri Al'}
                    </button>
                </form>

                {message && !returnResult && <p className="dealer-message" role="alert">{message}</p>}

                {returnResult && (
                    <section className="dealer-return-result" style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--success)' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ color: 'var(--success)', fontSize: '24px' }}>✓</span>
                            <div>
                                <b style={{ display: 'block', fontSize: '1.1em' }}>{returnResult.product ?? 'Ürün'} başarıyla iade edildi</b>
                                <p style={{ margin: '5px 0', color: 'var(--danger)', fontWeight: 'bold' }}>-{numberFormatter.format(returnResult.reversedPoints)} puan ustanın hesabından geri alındı.</p>
                                {returnResult.balance !== undefined && (
                                    <small style={{ color: 'var(--text-muted)' }}>Güncel usta bakiyesi: {numberFormatter.format(returnResult.balance)} puan</small>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </>
        )}

        <footer>
            <a href="/">Usta uygulamasına dön</a>
            <span>Bayi Görevlisi Paneli</span>
        </footer>
    </main>
  )
}

function CraftsmanApp() {
  const [craftsmanId, setCraftsmanId] = useState(() => authStore.getCraftsmanToken() ? localStorage.getItem('usta-craftsman-id') ?? '' : '')
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

  function authenticated(result: { craftsmanId: string; needsProfile: boolean; token: string; expiresAtUtc: string }) { authStore.setCraftsmanToken(result.token); localStorage.setItem('usta-craftsman-id', result.craftsmanId); localStorage.setItem('usta-needs-profile', String(result.needsProfile)); setCraftsmanId(result.craftsmanId); setNeedsProfile(result.needsProfile) }
  function profileCompleted() { localStorage.removeItem('usta-needs-profile'); setNeedsProfile(false); void refreshDashboard() }
  function logout() { void logoutCraftsman(); authStore.clearCraftsmanToken(); localStorage.removeItem('usta-craftsman-id'); localStorage.removeItem('usta-needs-profile'); localStorage.removeItem('usta-dashboard-cache'); localStorage.removeItem('usta-token'); localStorage.removeItem('usta-session-expires'); clearPendingRedemptions(); setCraftsmanId(''); setNeedsProfile(false); setDashboard(fallbackDashboard); setScreen('home') }

  if (!craftsmanId) return <Login onAuthenticated={authenticated} />
  if (needsProfile) return <ProfileSetup craftsmanId={craftsmanId} onCompleted={profileCompleted} />

  return <main className="app-shell">
    <div className="status-bar"><strong>9:41</strong><span>▮▮ ◔ ▰</span></div>
    <InstallPrompt />
    {!online && <div className="offline-banner">⌁ Çevrimdışısın — kayıtlı bakiye gösteriliyor.</div>}
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

function App() { const path = window.location.pathname; return path.startsWith('/admin') ? <AdminPortal /> : path.startsWith('/dealer/risk') ? <DealerPortal risk /> : path.startsWith('/dealer/history') ? <DealerPortal history /> : path.startsWith('/dealer') ? <DealerPortal /> : <CraftsmanApp /> }

export default App
