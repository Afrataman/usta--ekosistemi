import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createAdminCampaign, createAdminProduct, createAdminReward, createSupportRequest, fulfillDealerCoupon, generateAdminProductCodes, getAdminCampaigns, getAdminCraftsmen, getAdminDealers, getAdminLoyaltyRules, getAdminOverview, getAdminProducts, getAdminRewards, getAdminRiskCases, getCampaigns, getCraftsmanDashboard, getCraftsmanProfile, getRewardRedemptions, getRewards, getSupportRequests, getWallet, redeemProductCode, redeemReward, reportDealerRisk, requestOtpCode, returnDealerProduct, setAdminCampaignActive, setAdminEntityActive, updateAdminLoyaltyRules, updateAdminReward, updateAdminRiskStatus, updateCraftsmanProfile, verifyDealerCoupon, verifyOtpCode, type AdminCampaign, type AdminCraftsman, type AdminDealer, type AdminOverview, type AdminProduct, type AdminReward, type AdminRiskCase, type Campaign, type CraftsmanProfile, type Dashboard, type DealerCoupon, type LoyaltyRules, type ProductReturnResult, type Reward, type RewardRedemption, type RewardRedemptionResult, type SupportItem, type Wallet as WalletData } from './api'
import './App.css'

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
  rewardValueTry: 500,
  pointsToNextLevel: 2_500,
  movements: [
    { description: 'Ürün kodu okuma', createdAtUtc: new Date().toISOString(), amount: 250 },
    { description: 'Kampanya bonusu', createdAtUtc: new Date().toISOString(), amount: 150 },
    { description: 'Kupon kullanımı', createdAtUtc: new Date().toISOString(), amount: -50 },
  ],
}

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
        <div><strong>{numberFormatter.format(dashboard.balance)} <small>puan</small></strong><p>Bu puanla alabileceğiniz ödüllerin<br />değeri: {numberFormatter.format(dashboard.rewardValueTry)} TL'ye kadar</p></div><span className="gift-art">♙</span>
      </section>

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

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!craftsmanId) {
      setResult({ kind: 'error', message: 'Backend bağlantısı kurulamadı. İkinci terminalde API’yi çalıştırın.' })
      return
    }

    setSubmitting(true)
    setResult(null)
    try {
      const response = await redeemProductCode(craftsmanId, code)
      await onRedeemed()
      setResult({ kind: 'success', message: `${response.product}: +${numberFormatter.format(response.earnedPoints)} puan eklendi.` })
      setCode('')
    } catch (error) {
      setResult({ kind: 'error', message: error instanceof Error ? error.message : 'Kod kullanılamadı.' })
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
      <div className="connection-warning">⌁ <strong>Bağlantı zayıf — işlem güvenle tekrar denenecek</strong></div>
    </>
  )
}

function Rewards({ balance, craftsmanId, onBalanceChanged }: { balance: number; craftsmanId: string; onBalanceChanged: () => Promise<void> }) {
  const [filter, setFilter] = useState<'all' | Reward['deliveryType']>('all')
  const [catalog, setCatalog] = useState(fallbackRewards)
  const [connected, setConnected] = useState(false)
  const [catalogVersion, setCatalogVersion] = useState(0)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
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
      const response = await redeemReward(selectedReward.id, craftsmanId)
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
      <header className="rewards-header"><h1>Ödüller</h1><strong>{numberFormatter.format(balance)} <small>puan</small></strong></header>
      <div className="filters"><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')} type="button">Tümü</button><button className={filter === 'Digital' ? 'selected' : ''} onClick={() => setFilter('Digital')} type="button">Dijital</button><button className={filter === 'DealerPickup' ? 'selected' : ''} onClick={() => setFilter('DealerPickup')} type="button">Bayiden Teslim</button></div>
      <div className={connected ? 'catalog-source connected' : 'catalog-source'}>{connected ? 'Canlı katalog' : 'Örnek katalog'}</div>
      <div className="rewards-grid">
        {catalog.map((reward) => <article className="reward-product" key={reward.id} title={reward.description}>
          {reward.deliveryType === 'DealerPickup' && <span className="delivery">Bayiden Teslim</span>}<div className="product-art">{rewardArt[reward.imageKey] ?? '🎁'}</div><h2>{reward.name}</h2><p>{numberFormatter.format(reward.pointCost)} puan</p><button onClick={() => { setSelectedReward(reward); setRedemption(null); setRedemptionError('') }} disabled={!reward.isAvailable || balance < reward.pointCost || !craftsmanId} type="button">{!reward.isAvailable ? 'Stokta Yok' : balance < reward.pointCost ? 'Puan Yetersiz' : reward.deliveryType === 'Digital' ? 'İncele' : 'Ödülü Al'}</button>
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

  const balance = wallet?.balance ?? dashboard.balance
  const movements = wallet?.movements ?? dashboard.movements.map((movement, index) => ({ ...movement, id: String(index), transactionType: 0 }))

  return <>
    <header className="wallet-header"><div><span>PUAN CÜZDANI</span><h1>{dashboard.fullName}</h1></div><b>{levelNames[dashboard.level] ?? dashboard.level}</b></header>
    <section className="wallet-balance"><span>Toplam puanın</span><strong>{numberFormatter.format(balance)} <small>puan</small></strong><p>Bu puanla alabileceğin ödüllerin değeri: <b>{numberFormatter.format(Math.floor(balance / 20))} TL'ye kadar</b></p></section>
    <div className="wallet-actions"><button onClick={() => go('scan')} type="button"><span>▦</span>Puan Kazan</button><button onClick={() => go('rewards')} type="button"><span>♙</span>Ödüllere Git</button></div>
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
    <section className="coupon-list">{items.map((item) => <article className={item.status === 'Created' ? 'coupon-card' : 'coupon-card inactive'} key={item.id}>
      <div className="coupon-art">{rewardArt[item.imageKey] ?? '🎁'}</div><div className="coupon-main"><div className="coupon-name"><h2>{item.rewardName}</h2><span>{item.status === 'Created' ? 'Aktif' : item.status === 'Fulfilled' ? 'Kullanıldı' : 'İptal'}</span></div><p>{item.deliveryType === 'Digital' ? 'Dijital ödül kodu' : 'Bayiden teslim kodu'} · {numberFormatter.format(item.pointsSpent)} puan</p><code>{item.fulfillmentCode}</code><small>Oluşturulma: {dateFormatter.format(new Date(item.createdAtUtc))}</small></div>
      <button onClick={() => copyCode(item)} disabled={item.status !== 'Created'} type="button">{copiedId === item.id ? 'Kopyalandı' : 'Kopyala'}</button>
    </article>)}</section>
    <div className="wallet-info">ⓘ <span>Bayiden teslim ödüllerinde bu kodu bayi görevlisine göster. Kodu tanımadığın kişilerle paylaşma.</span></div>
  </>
}

function Profile({ craftsmanId, onUpdated, onLogout }: { craftsmanId: string; onUpdated: () => Promise<void>; onLogout: () => void }) {
  const [profile, setProfile] = useState<CraftsmanProfile | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

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

  if (!profile) return <div className="profile-loading">{message?.text ?? 'Profil yükleniyor…'}</div>
  const maskedPhone = `${profile.phoneNumber.slice(0, 4)} *** ** ${profile.phoneNumber.slice(-2)}`
  return <><header className="profile-header"><div className="profile-avatar">AU</div><div><h1>{profile.fullName}</h1><span>{levelNames[profile.level] ?? profile.level} Seviye</span></div></header>
    <form className="profile-form" onSubmit={save}><section><h2>Kişisel bilgiler</h2><label>Ad soyad<input value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} minLength={3} maxLength={120} required /></label><label>Şehir<input value={profile.city ?? ''} onChange={(event) => setProfile({ ...profile, city: event.target.value })} maxLength={80} placeholder="Şehir seçilmedi" /></label><label>Telefon numarası<div className="locked-field"><span>{maskedPhone}</span><b>Doğrulandı</b></div><small>Telefon değişikliği SMS doğrulaması gerektirir.</small></label></section>
      <section><h2>Bildirim tercihleri</h2><label className="toggle-row"><div><strong>Kampanya bildirimleri</strong><small>Yeni kampanya ve fırsatları uygulamada göster.</small></div><input type="checkbox" checked={profile.campaignNotificationsEnabled} onChange={(event) => setProfile({ ...profile, campaignNotificationsEnabled: event.target.checked })} /><i /></label><label className="toggle-row"><div><strong>SMS bildirimleri</strong><small>Önemli puan ve kupon bilgilerini SMS ile al.</small></div><input type="checkbox" checked={profile.smsNotificationsEnabled} onChange={(event) => setProfile({ ...profile, smsNotificationsEnabled: event.target.checked })} /><i /></label></section>
      <div className="profile-meta">Üyelik tarihi: {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(profile.createdAtUtc))}</div>{message && <p className={`profile-message ${message.kind}`}>{message.text}</p>}<button className="profile-save" disabled={saving} type="submit">{saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}</button><button className="profile-logout" onClick={onLogout} type="button">Güvenli Çıkış Yap</button></form></>
}

function Campaigns({ back }: { back: () => void }) {
  const [items, setItems] = useState<Campaign[]>([]); const [error, setError] = useState('')
  useEffect(() => { const controller = new AbortController(); getCampaigns(controller.signal).then(setItems).catch(() => setError('Kampanyalar yüklenemedi.')); return () => controller.abort() }, [])
  return <><header className="page-header simple-header"><button onClick={back} type="button">‹</button><h1>Kampanyalar</h1><span>◇</span></header>{error && <p className="screen-error">{error}</p>}<section className="campaign-list">{items.map((item) => <article key={item.id}><div className="campaign-badge">{item.pointMultiplier > 1 ? `${item.pointMultiplier}X` : '★'}</div><div><span>AKTİF KAMPANYA</span><h2>{item.title}</h2><p>{item.summary}</p><small>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.endsAtUtc))} tarihine kadar</small></div></article>)}</section>{!error && items.length === 0 && <div className="coupon-state">Aktif kampanya bulunmuyor.</div>}</>
}

function Notifications({ back }: { back: () => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]); const [error, setError] = useState('')
  useEffect(() => { const controller = new AbortController(); getCampaigns(controller.signal).then(setCampaigns).catch(() => setError('Bildirimler yüklenemedi.')); return () => controller.abort() }, [])
  return <><header className="page-header simple-header"><button onClick={back} type="button">‹</button><h1>Bildirimler</h1><span>♧</span></header>{error && <p className="screen-error">{error}</p>}<section className="notification-list"><article><span>★</span><div><b>Usta Kulübü'ne hoş geldin</b><p>Ürün kodlarını okutarak puan kazanabilir, puanlarını ödüllerde kullanabilirsin.</p><small>Üyelik bildirimi</small></div></article>{campaigns.map((item) => <article key={item.id}><span>{item.pointMultiplier > 1 ? `${item.pointMultiplier}X` : '◇'}</span><div><b>{item.title}</b><p>{item.summary}</p><small>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.endsAtUtc))} tarihine kadar</small></div></article>)}</section>{!error && campaigns.length === 0 && <div className="coupon-state">Yeni kampanya bildirimi bulunmuyor.</div>}</>
}

function Support({ craftsmanId, back }: { craftsmanId: string; back: () => void }) {
  const [items, setItems] = useState<SupportItem[]>([]); const [subject, setSubject] = useState(''); const [description, setDescription] = useState(''); const [category, setCategory] = useState('Puan'); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false)
  async function load() { if (craftsmanId) setItems(await getSupportRequests(craftsmanId)) }
  useEffect(() => { if (!craftsmanId) return; const controller = new AbortController(); getSupportRequests(craftsmanId, controller.signal).then(setItems).catch(() => setMessage('Talepler yüklenemedi.')); return () => controller.abort() }, [craftsmanId])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setMessage(''); try { await createSupportRequest(craftsmanId, { category, subject, description }); setSubject(''); setDescription(''); setMessage('Destek talebin oluşturuldu.'); await load() } catch { setMessage('Talep oluşturulamadı.') } finally { setSaving(false) } }
  return <><header className="page-header simple-header"><button onClick={back} type="button">‹</button><h1>Destek</h1><span>♧</span></header><form className="support-form" onSubmit={submit}><h2>Yeni destek talebi</h2><label>Kategori<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Puan</option><option>Ürün Kodu</option><option>Ödül / Kupon</option><option>Hesap</option><option>Diğer</option></select></label><label>Konu<input value={subject} onChange={(event) => setSubject(event.target.value)} minLength={5} maxLength={140} required /></label><label>Açıklama<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={1500} required /></label>{message && <p>{message}</p>}<button disabled={saving} type="submit">{saving ? 'Gönderiliyor…' : 'Talebi Gönder'}</button></form><h2 className="request-title">Geçmiş talepler</h2><section className="request-list">{items.map((item) => <article key={item.id}><span>{item.category}</span><div><h3>{item.subject}</h3><small>{dateFormatter.format(new Date(item.createdAtUtc))}</small></div><b>{item.status === 'Open' ? 'Açık' : item.status === 'Resolved' ? 'Çözüldü' : 'İşlemde'}</b></article>)}</section></>
}

function Login({ onAuthenticated }: { onAuthenticated: (craftsmanId: string, needsProfile: boolean) => void }) {
  const [phone, setPhone] = useState('05550000000'); const [challengeId, setChallengeId] = useState(''); const [code, setCode] = useState(''); const [developmentCode, setDevelopmentCode] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function requestCode(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await requestOtpCode(phone); setChallengeId(result.id); setDevelopmentCode(result.developmentCode ?? ''); setMessage('6 haneli doğrulama kodu gönderildi.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Kod gönderilemedi.') } finally { setBusy(false) } }
  async function verify(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { const result = await verifyOtpCode(challengeId, code); onAuthenticated(result.craftsmanId, result.needsProfile) } catch (error) { setMessage(error instanceof Error ? error.message : 'Kod doğrulanamadı.') } finally { setBusy(false) } }
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

function AdminApp() {
  const [overview, setOverview] = useState<AdminOverview | null>(null); const [items, setItems] = useState<AdminRiskCase[]>([]); const [message, setMessage] = useState(''); const [busyId, setBusyId] = useState('')
  async function load() { const [summary, risks] = await Promise.all([getAdminOverview(), getAdminRiskCases()]); setOverview(summary); setItems(risks) }
  useEffect(() => { load().catch(() => setMessage('Yönetici verileri yüklenemedi.')) }, [])
  async function changeStatus(id: string, status: 'InReview' | 'Resolved' | 'Rejected') { setBusyId(id); setMessage(''); try { await updateAdminRiskStatus(id, status); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Durum güncellenemedi.') } finally { setBusyId('') } }
  const labels: Record<AdminRiskCase['status'], string> = { Open: 'Açık', InReview: 'İncelemede', Resolved: 'Çözüldü', Rejected: 'Reddedildi' }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><button className="active" type="button">⌂ Genel Bakış</button><button type="button">♧ Ustalar</button><button type="button">▣ Bayiler</button><button type="button">◇ Kampanyalar</button><button type="button">♙ Ödüller</button><button type="button">⚑ Risk Kontrolü</button></nav><a href="/">Usta uygulaması</a><a href="/dealer">Bayi paneli</a></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Genel Bakış</h1></div><b>Demo Yönetici</b></header>{message && <p className="admin-message">{message}</p>}<div className="admin-stats"><article><span>♧</span><div><small>Aktif Usta</small><strong>{overview?.craftsmen ?? '—'}</strong></div></article><article><span>▣</span><div><small>Aktif Bayi</small><strong>{overview?.dealers ?? '—'}</strong></div></article><article><span>♙</span><div><small>Aktif Kupon</small><strong>{overview?.activeCoupons ?? '—'}</strong></div></article><article className="risk"><span>⚑</span><div><small>Açık Risk Kaydı</small><strong>{overview?.openRiskCases ?? '—'}</strong></div></article></div><div className="admin-section-title"><div><h2>Şüpheli İşlemler</h2><p>Bayi çalışanlarından gelen son bildirimler</p></div><span>{items.length} kayıt</span></div><section className="admin-risk-list">{items.length === 0 && <p>Henüz şüpheli işlem bildirimi bulunmuyor.</p>}{items.map((item) => <article key={item.id}><div className="risk-head"><span>{item.referenceType === 'ProductCode' ? 'ÜRÜN KODU' : item.referenceType === 'Coupon' ? 'KUPON' : 'SATIŞ'}</span><b className={item.status}>{labels[item.status]}</b></div><h3>{item.reason}</h3><code>{item.referenceValue}</code><p>{item.description}</p><small>{item.dealer} · {item.dealerEmployee} · {dateFormatter.format(new Date(item.createdAtUtc))}</small><div className="risk-actions"><button onClick={() => changeStatus(item.id, 'InReview')} disabled={busyId === item.id || item.status !== 'Open'} type="button">İncelemeye Al</button><button onClick={() => changeStatus(item.id, 'Resolved')} disabled={busyId === item.id || item.status === 'Resolved'} type="button">Çözüldü</button><button onClick={() => changeStatus(item.id, 'Rejected')} disabled={busyId === item.id || item.status === 'Rejected'} type="button">Reddet</button></div></article>)}</section></section></main>
}

function AdminManagementPage({ kind }: { kind: 'craftsmen' | 'dealers' }) {
  const [craftsmen, setCraftsmen] = useState<AdminCraftsman[]>([]); const [dealers, setDealers] = useState<AdminDealer[]>([]); const [message, setMessage] = useState(''); const [busyId, setBusyId] = useState('')
  async function load() { if (kind === 'craftsmen') setCraftsmen(await getAdminCraftsmen()); else setDealers(await getAdminDealers()) }
  useEffect(() => { const request = kind === 'craftsmen' ? getAdminCraftsmen().then(setCraftsmen) : getAdminDealers().then(setDealers); request.catch(() => setMessage('Kayıtlar yüklenemedi.')) }, [kind])
  async function toggle(id: string, active: boolean) { setBusyId(id); setMessage(''); try { await setAdminEntityActive(kind, id, !active); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Durum güncellenemedi.') } finally { setBusyId('') } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a className={kind === 'craftsmen' ? 'active' : ''} href="/admin/craftsmen">♧ Ustalar</a><a className={kind === 'dealers' ? 'active' : ''} href="/admin/dealers">▣ Bayiler</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>{kind === 'craftsmen' ? 'Usta Yönetimi' : 'Bayi Yönetimi'}</h1></div><b>{kind === 'craftsmen' ? craftsmen.length : dealers.length} kayıt</b></header>{message && <p className="admin-message">{message}</p>}<section className="management-list">{kind === 'craftsmen' ? craftsmen.map((item) => <article key={item.id}><div className="management-avatar">{item.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div className="management-info"><h2>{item.fullName}</h2><p>{item.phoneNumber} · {item.city ?? 'Şehir belirtilmemiş'}</p><small>{levelNames[item.level] ?? item.level} · {numberFormatter.format(item.balance)} puan · {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.createdAtUtc))}</small></div><span className={item.isActive ? 'entity-active' : 'entity-passive'}>{item.isActive ? 'Aktif' : 'Pasif'}</span><button onClick={() => toggle(item.id, item.isActive)} disabled={busyId === item.id} type="button">{item.isActive ? 'Pasife Al' : 'Aktifleştir'}</button></article>) : dealers.map((item) => <article key={item.id}><div className="management-avatar">▣</div><div className="management-info"><h2>{item.name}</h2><p>Bayi kodu: {item.code}</p><small>{item.activeEmployees}/{item.totalEmployees} aktif çalışan</small></div><span className={item.isActive ? 'entity-active' : 'entity-passive'}>{item.isActive ? 'Aktif' : 'Pasif'}</span><button onClick={() => toggle(item.id, item.isActive)} disabled={busyId === item.id} type="button">{item.isActive ? 'Pasife Al' : 'Aktifleştir'}</button></article>)}</section></section></main>
}

function AdminCampaignsPage() {
  const initialStart = new Date().toISOString().slice(0, 16); const initialEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16)
  const [items, setItems] = useState<AdminCampaign[]>([]); const [title, setTitle] = useState(''); const [summary, setSummary] = useState(''); const [multiplier, setMultiplier] = useState(2); const [startsAt, setStartsAt] = useState(initialStart); const [endsAt, setEndsAt] = useState(initialEnd); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { setItems(await getAdminCampaigns()) }
  useEffect(() => { getAdminCampaigns().then(setItems).catch(() => setMessage('Kampanyalar yüklenemedi.')) }, [])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { await createAdminCampaign({ title, summary, pointMultiplier: multiplier, startsAtUtc: new Date(startsAt).toISOString(), endsAtUtc: new Date(endsAt).toISOString(), isActive: true, displayOrder: 1 }); setTitle(''); setSummary(''); setMessage('Kampanya oluşturuldu ve kurala eklendi.'); await load() } catch (error) { setMessage(error instanceof Error ? error.message : 'Kampanya oluşturulamadı.') } finally { setBusy(false) } }
  async function toggle(item: AdminCampaign) { setBusy(true); try { await setAdminCampaignActive(item.id, !item.isActive); await load() } finally { setBusy(false) } }
  return <main className="admin-shell"><aside><div className="admin-brand"><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Yönetim</strong></div></div><nav><a href="/admin">⌂ Genel Bakış</a><a href="/admin/craftsmen">♧ Ustalar</a><a href="/admin/dealers">▣ Bayiler</a><a className="active" href="/admin/campaigns">◇ Kampanyalar</a></nav></aside><section className="admin-main"><header><div><span>YÖNETİCİ PANELİ</span><h1>Kampanya Yönetimi</h1></div><b>{items.length} kampanya</b></header><div className="campaign-admin-grid"><form className="campaign-create" onSubmit={submit}><h2>Yeni Kampanya</h2><label>Başlık<input value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} maxLength={140} placeholder="Ağustos Çifte Puan" required /></label><label>Açıklama<textarea value={summary} onChange={(event) => setSummary(event.target.value)} minLength={10} maxLength={500} required /></label><label>Puan çarpanı<input value={multiplier} onChange={(event) => setMultiplier(Number(event.target.value))} type="number" min="1" max="10" step="0.1" required /></label><div><label>Başlangıç<input value={startsAt} onChange={(event) => setStartsAt(event.target.value)} type="datetime-local" required /></label><label>Bitiş<input value={endsAt} onChange={(event) => setEndsAt(event.target.value)} type="datetime-local" required /></label></div>{message && <p>{message}</p>}<button disabled={busy} type="submit">{busy ? 'Kaydediliyor…' : 'Kampanyayı Yayınla'}</button></form><section className="admin-campaign-list">{items.map((item) => <article key={item.id}><div><span>{item.pointMultiplier}X</span><b className={item.isActive ? 'entity-active' : 'entity-passive'}>{item.isActive ? 'Aktif' : 'Pasif'}</b></div><h2>{item.title}</h2><p>{item.summary}</p><small>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.startsAtUtc))} – {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(item.endsAtUtc))}</small><button onClick={() => toggle(item)} disabled={busy} type="button">{item.isActive ? 'Durdur' : 'Etkinleştir'}</button></article>)}</section></div></section></main>
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

function DealerApp() {
  const [mode, setMode] = useState<'coupon' | 'return' | 'risk'>('coupon'); const [code, setCode] = useState(''); const [reason, setReason] = useState(''); const [coupon, setCoupon] = useState<DealerCoupon | null>(null); const [returnResult, setReturnResult] = useState<ProductReturnResult | null>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  function changeMode(next: 'coupon' | 'return' | 'risk') { setMode(next); setCode(''); setReason(''); setCoupon(null); setReturnResult(null); setMessage('') }
  async function verify(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); setCoupon(null); try { setCoupon(await verifyDealerCoupon(code.trim().toUpperCase())) } catch (error) { setMessage(error instanceof Error ? error.message : 'Kupon doğrulanamadı.') } finally { setBusy(false) } }
  async function fulfill() { setBusy(true); setMessage(''); try { const result = await fulfillDealerCoupon(code.trim().toUpperCase()); setCoupon(result); setMessage(result.alreadyProcessed ? 'Bu teslim daha önce onaylanmış.' : 'Ödül teslimi başarıyla onaylandı.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Teslim onaylanamadı.') } finally { setBusy(false) } }
  async function returnProduct(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); setReturnResult(null); try { const result = await returnDealerProduct(code.trim().toUpperCase(), reason.trim()); setReturnResult(result); setMessage(result.alreadyProcessed ? 'Bu ürün daha önce iade edilmiş.' : 'Ürün iadesi ve puan geri alma tamamlandı.') } catch (error) { setMessage(error instanceof Error ? error.message : 'İade tamamlanamadı.') } finally { setBusy(false) } }
  const expired = coupon?.expiresAtUtc ? new Date(coupon.expiresAtUtc) <= new Date() : false
  return <main className="dealer-shell"><header><div><span>⚒</span><div><small>USTA KULÜBÜ</small><strong>Bayi Paneli</strong></div></div><i>Yalova Merkez Bayi</i></header><nav className="dealer-tabs"><button className={mode === 'coupon' ? 'active' : ''} onClick={() => changeMode('coupon')} type="button">Kupon Teslimi</button><button className={mode === 'return' ? 'active' : ''} onClick={() => changeMode('return')} type="button">Ürün İadesi</button></nav><section className="dealer-hero"><span>{mode === 'coupon' ? '▦' : '↩'}</span><h1>{mode === 'coupon' ? 'Kupon Doğrula' : 'Ürün İadesi'}</h1><p>{mode === 'coupon' ? 'Ustanın kupon kodunu kontrol edin. Doğrulama kuponu tüketmez.' : 'İade edilen ürünün kodunu ve iade nedenini girin. Kazanılan puan geri alınır.'}</p></section>{mode === 'coupon' ? <form className="dealer-search" onSubmit={verify}><label>Kupon kodu</label><div><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="UK-XXXXXXXXXXXX" minLength={6} required autoFocus /><button disabled={busy} type="submit">{busy ? 'Kontrol…' : 'Doğrula'}</button></div></form> : <form className="dealer-search dealer-return" onSubmit={returnProduct}><label>Ürün kodu<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="USTA-XXXX-XXXX" minLength={8} required autoFocus /></label><label>İade nedeni<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} maxLength={200} placeholder="İade nedenini yazın" required /></label><button disabled={busy} type="submit">{busy ? 'İşleniyor…' : 'İadeyi Tamamla'}</button></form>}{message && <p className="dealer-message">{message}</p>}{coupon && <section className="dealer-coupon"><div className={`dealer-validity ${coupon.status === 'Created' && !expired ? 'valid' : ''}`}><span>{coupon.status === 'Created' && !expired ? '✓' : '!'}</span><div><b>{coupon.status === 'Created' && !expired ? 'Kupon geçerli' : coupon.status === 'Fulfilled' ? 'Kupon kullanılmış' : 'Kupon kullanılamaz'}</b><small>{coupon.fulfillmentCode}</small></div></div><dl><div><dt>Ödül</dt><dd>{coupon.reward}</dd></div><div><dt>Usta</dt><dd>{coupon.craftsman}</dd></div><div><dt>Son kullanım</dt><dd>{coupon.expiresAtUtc ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(coupon.expiresAtUtc)) : 'Süresiz'}</dd></div></dl><button className="dealer-fulfill" onClick={fulfill} disabled={busy || coupon.status !== 'Created' || expired} type="button">{coupon.status === 'Fulfilled' ? 'Teslim Edilmiş' : 'Teslimi Onayla'}</button><small className="dealer-warning">Teslim onayı geri alınamaz. Ödülü ustaya verdikten sonra onaylayın.</small></section>}{returnResult && <section className="dealer-return-result"><span>✓</span><div><b>{returnResult.product ?? 'Ürün'} iade edildi</b><p>{numberFormatter.format(returnResult.reversedPoints)} puan geri alındı.</p>{returnResult.balance !== undefined && <small>Yeni puan bakiyesi: {numberFormatter.format(returnResult.balance)}</small>}</div></section>}<footer><a href="/">Usta uygulamasına dön</a><span>Demo Bayi Görevlisi</span></footer></main>
}

function CraftsmanApp() {
  const [craftsmanId, setCraftsmanId] = useState(() => localStorage.getItem('usta-craftsman-id') ?? '')
  const [needsProfile, setNeedsProfile] = useState(() => localStorage.getItem('usta-needs-profile') === 'true')
  const [screen, setScreen] = useState<Screen>('home')
  const [dashboard, setDashboard] = useState(fallbackDashboard)
  const [connected, setConnected] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    if (!craftsmanId) return
    const controller = new AbortController()
    getCraftsmanDashboard(craftsmanId, controller.signal)
      .then((data) => { setDashboard(data); setConnected(true) })
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
    setConnected(true)
  }

  function authenticated(id: string, profileRequired: boolean) { localStorage.setItem('usta-craftsman-id', id); localStorage.setItem('usta-needs-profile', String(profileRequired)); setCraftsmanId(id); setNeedsProfile(profileRequired) }
  function profileCompleted() { localStorage.removeItem('usta-needs-profile'); setNeedsProfile(false); void refreshDashboard() }
  function logout() { localStorage.removeItem('usta-craftsman-id'); localStorage.removeItem('usta-needs-profile'); setCraftsmanId(''); setNeedsProfile(false); setDashboard(fallbackDashboard); setScreen('home') }

  if (!craftsmanId) return <Login onAuthenticated={authenticated} />
  if (needsProfile) return <ProfileSetup craftsmanId={craftsmanId} onCompleted={profileCompleted} />

  return <main className="app-shell">
    <div className="status-bar"><strong>9:41</strong><span>▮▮ ◔ ▰</span></div>
    {!online && <div className="offline-banner">⌁ Çevrimdışısın — kayıtlı ekranlar açılabilir, puan işlemleri bağlantı gelince yapılır.</div>}
    {screen === 'home' && <Home go={setScreen} dashboard={dashboard} connected={connected} />}
    {screen === 'scan' && <Scanner back={() => setScreen('home')} craftsmanId={dashboard.craftsmanId} onRedeemed={refreshDashboard} />}
    {screen === 'rewards' && <Rewards balance={dashboard.balance} craftsmanId={dashboard.craftsmanId} onBalanceChanged={refreshDashboard} />}
    {screen === 'wallet' && <Wallet dashboard={dashboard} go={setScreen} />}
    {screen === 'coupons' && <Coupons craftsmanId={dashboard.craftsmanId} back={() => setScreen('home')} />}
    {screen === 'campaigns' && <Campaigns back={() => setScreen('home')} />}
    {screen === 'notifications' && <Notifications back={() => setScreen('home')} />}
    {screen === 'support' && <Support craftsmanId={dashboard.craftsmanId} back={() => setScreen('home')} />}
    {screen === 'profile' && <Profile craftsmanId={dashboard.craftsmanId} onUpdated={refreshDashboard} onLogout={logout} />}
    <BottomNav screen={screen} setScreen={setScreen} />
  </main>
}

function App() { const path = window.location.pathname; return path.startsWith('/admin/loyalty-rules') ? <AdminLoyaltyRulesPage /> : path.startsWith('/admin/products') ? <AdminProductsPage /> : path.startsWith('/admin/rewards') ? <AdminRewardsPage /> : path.startsWith('/admin/campaigns') ? <AdminCampaignsPage /> : path.startsWith('/admin/craftsmen') ? <AdminManagementPage kind="craftsmen" /> : path.startsWith('/admin/dealers') ? <AdminManagementPage kind="dealers" /> : path.startsWith('/admin') ? <AdminApp /> : path.startsWith('/dealer/risk') ? <DealerRiskPage /> : path.startsWith('/dealer') ? <DealerApp /> : <CraftsmanApp /> }

export default App
