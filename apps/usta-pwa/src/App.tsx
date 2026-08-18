import './App.css'

const rewards = [
  { name: 'Dijital alışveriş çeki', points: '5.000 puan', icon: '₺' },
  { name: 'Profesyonel el aleti', points: '9.800 puan', icon: '✦' },
]

const movements = [
  { title: 'Ürün kodu puanı', date: 'Bugün, 14:32', value: '+600' },
  { title: 'Kupon kullanımı', date: '12 Ağustos, 11:08', value: '-5.000' },
]

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">UK</div>
        <div className="welcome"><span>Hoş geldin</span><strong>Ahmet Usta</strong></div>
        <button className="icon-button" type="button" aria-label="Bildirimler"><span aria-hidden="true">♢</span><i /></button>
      </header>

      <section className="balance-card" aria-labelledby="points-title">
        <div className="level-row"><span className="level-badge">ALTIN SEVİYE</span><span>Sonraki seviye için 5.800 puan</span></div>
        <p id="points-title">Toplam puanın</p>
        <div className="points">14.200</div>
        <p className="reward-value">Bu puanla alabileceğin ödüllerin değeri<strong> 710 TL'ye kadar</strong></p>
        <div className="progress" aria-label="Seviye ilerlemesi: yüzde 72"><span /></div>
      </section>

      <section className="scan-card">
        <div><span className="eyebrow">PUAN KAZAN</span><h1>Ürün kodunu okut</h1><p>Ambalajdaki QR kodu güvenle okut veya kodu elle gir.</p></div>
        <button className="scan-button" type="button"><span className="qr-symbol" aria-hidden="true">⌗</span>QR OKUT</button>
        <button className="text-button" type="button">Kodu elle gir</button>
      </section>

      <section className="content-section">
        <div className="section-heading"><div><span className="eyebrow">SANA ÖZEL</span><h2>Öne çıkan ödüller</h2></div><button type="button">Tümünü gör</button></div>
        <div className="reward-grid">
          {rewards.map((reward) => (
            <article className="reward-card" key={reward.name}>
              <div className="reward-icon" aria-hidden="true">{reward.icon}</div><h3>{reward.name}</h3><p>{reward.points}</p><button type="button">İncele</button>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section movements">
        <div className="section-heading"><h2>Son hareketler</h2><button type="button">Geçmiş</button></div>
        {movements.map((movement) => (
          <div className="movement-row" key={movement.title}>
            <div className="movement-icon" aria-hidden="true">↗</div><div><strong>{movement.title}</strong><span>{movement.date}</span></div>
            <b className={movement.value.startsWith('+') ? 'positive' : ''}>{movement.value}</b>
          </div>
        ))}
      </section>

      <nav className="bottom-nav" aria-label="Ana menü">
        <button className="active" type="button"><span>⌂</span>Ana sayfa</button><button type="button"><span>☆</span>Ödüller</button>
        <button className="scan-nav" type="button" aria-label="QR okut"><span>⌗</span></button><button type="button"><span>↻</span>Hareketler</button><button type="button"><span>○</span>Profil</button>
      </nav>
    </main>
  )
}

export default App
