import { useEffect, useState, type FormEvent } from 'react'
import { getDemoDashboard, redeemProductCode, type Dashboard } from './api'
import './App.css'

type Screen = 'home' | 'scan' | 'rewards' | 'wallet' | 'profile'

const rewards = [
  { name: 'Takım Çantası', points: '2.500', art: '🧰', delivery: 'Hemen Teslim' },
  { name: 'Akülü Matkap', points: '7.500', art: '🔧' },
  { name: 'Usta Montu', points: '3.000', art: '🦺' },
  { name: 'Dijital Hediye Kodu', points: '1.500', art: '🎁', digital: true },
]

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
      <header className="brand-header"><div className="brand"><span>⚒</span><strong>Usta Kulübü</strong></div><button aria-label="Bildirimler" type="button">♧</button></header>
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
        <button type="button"><span>◴</span>Puan Geçmişi</button><button type="button"><span>▰</span>Kuponlar</button>
        <button type="button"><span>◇</span>Kampanyalar</button><button type="button"><span>♧</span>Destek</button>
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
        <div className="product-box"><div className="box-top" /><div className="qr-art">▦</div><small>||||||||||</small></div>
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

function Rewards({ balance }: { balance: number }) {
  return (
    <>
      <header className="rewards-header"><h1>Ödüller</h1><strong>{numberFormatter.format(balance)} <small>puan</small></strong></header>
      <div className="filters"><button className="selected" type="button">Tümü</button><button type="button">Dijital</button><button type="button">Bayiden Teslim</button></div>
      <div className="rewards-grid">
        {rewards.map((reward) => <article className="reward-product" key={reward.name}>
          {reward.delivery && <span className="delivery">{reward.delivery}</span>}<div className="product-art">{reward.art}</div><h2>{reward.name}</h2><p>{reward.points} puan</p><button type="button">{reward.digital ? 'İncele' : 'Ödülü Al'}</button>
        </article>)}
      </div>
      <div className="points-note">ⓘ <span>Puanlar nakit değildir; yalnızca program ödüllerinde kullanılır.</span></div>
    </>
  )
}

function Placeholder({ title }: { title: string }) {
  return <section className="placeholder"><span>⚒</span><h1>{title}</h1><p>Bu ekran sıradaki geliştirme adımında gerçek verilerle hazırlanacak.</p></section>
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [dashboard, setDashboard] = useState(fallbackDashboard)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getDemoDashboard(controller.signal)
      .then((data) => { setDashboard(data); setConnected(true) })
      .catch(() => setConnected(false))
    return () => controller.abort()
  }, [])

  async function refreshDashboard() {
    const data = await getDemoDashboard()
    setDashboard(data)
    setConnected(true)
  }

  return <main className="app-shell">
    <div className="status-bar"><strong>9:41</strong><span>▮▮ ◔ ▰</span></div>
    {screen === 'home' && <Home go={setScreen} dashboard={dashboard} connected={connected} />}
    {screen === 'scan' && <Scanner back={() => setScreen('home')} craftsmanId={dashboard.craftsmanId} onRedeemed={refreshDashboard} />}
    {screen === 'rewards' && <Rewards balance={dashboard.balance} />}
    {screen === 'wallet' && <Placeholder title="Puan Cüzdanı" />}
    {screen === 'profile' && <Placeholder title="Profilim" />}
    <BottomNav screen={screen} setScreen={setScreen} />
  </main>
}

export default App
