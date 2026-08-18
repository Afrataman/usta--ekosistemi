import { useState } from 'react'
import './App.css'

type Screen = 'home' | 'scan' | 'rewards' | 'wallet' | 'profile'

const rewards = [
  { name: 'Takım Çantası', points: '2.500', art: '🧰', delivery: 'Hemen Teslim' },
  { name: 'Akülü Matkap', points: '7.500', art: '🔧' },
  { name: 'Usta Montu', points: '3.000', art: '🦺' },
  { name: 'Dijital Hediye Kodu', points: '1.500', art: '🎁', digital: true },
]

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

function Home({ go }: { go: (screen: Screen) => void }) {
  return (
    <>
      <header className="brand-header"><div className="brand"><span>⚒</span><strong>Usta Kulübü</strong></div><button aria-label="Bildirimler" type="button">♧</button></header>
      <p className="hello">Merhaba Ahmet Usta 👋</p>

      <section className="points-card">
        <div><strong>10.000 <small>puan</small></strong><p>Bu puanla alabileceğiniz ödüllerin<br />değeri: 500 TL'ye kadar</p></div><span className="gift-art">♙</span>
      </section>

      <section className="level-card">
        <div className="medal">★</div><div className="level-copy"><strong>Gümüş Seviye</strong><div className="level-progress"><i /></div><span>Altın seviyeye 2.500 puan</span></div><b>★</b>
      </section>

      <button className="primary-action" onClick={() => go('scan')} type="button"><span>▦</span>QR Okut</button>
      <button className="secondary-action" onClick={() => go('scan')} type="button"><span>⌨</span>Kodu Elle Gir</button>

      <h2 className="block-title">Hızlı İşlemler</h2>
      <div className="quick-grid">
        <button type="button"><span>◴</span>Puan Geçmişi</button><button type="button"><span>▰</span>Kuponlar</button>
        <button type="button"><span>◇</span>Kampanyalar</button><button type="button"><span>♧</span>Destek</button>
      </div>

      <div className="section-row"><h2>Son Puan Hareketleri</h2><button type="button">Tümü ›</button></div>
      <div className="movement-list">
        <div><span>Ürün kodu okuma</span><time>Bugün 09:21</time><b>+250</b></div>
        <div><span>Kampanya bonusu</span><time>Dün 16:48</time><b>+150</b></div>
        <div><span>Kupon kullanımı</span><time>Dün 11:02</time><b className="minus">-50</b></div>
      </div>
    </>
  )
}

function Scanner({ back }: { back: () => void }) {
  return (
    <>
      <header className="page-header"><button onClick={back} type="button">‹</button><h1>Ürün Kodunu Okut</h1><button type="button">?</button></header>
      <p className="scan-instruction">Kodu çerçevenin içine hizalayın</p>
      <div className="camera-frame">
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        <div className="product-box"><div className="box-top" /><div className="qr-art">▦</div><small>||||||||||</small></div>
      </div>
      <button className="secondary-action scanner-manual" type="button"><span>⌨</span>Kodu Elle Gir</button>
      <section className="how-card"><h2>Nasıl Çalışır?</h2><div className="steps"><div><span>▦</span><small>Kodu Okut</small></div><b>→</b><div><span>♢</span><small>Ürün doğrulansın</small></div><b>→</b><div><span>★</span><small>Puanın hemen eklensin</small></div></div><p>♢ Her ürün kodu yalnızca bir kez kullanılabilir.</p></section>
      <div className="connection-warning">⌁ <strong>Bağlantı zayıf — işlem güvenle tekrar denenecek</strong></div>
    </>
  )
}

function Rewards() {
  return (
    <>
      <header className="rewards-header"><h1>Ödüller</h1><strong>10.000 <small>puan</small></strong></header>
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
  return <main className="app-shell">
    <div className="status-bar"><strong>9:41</strong><span>▮▮ ◔ ▰</span></div>
    {screen === 'home' && <Home go={setScreen} />}
    {screen === 'scan' && <Scanner back={() => setScreen('home')} />}
    {screen === 'rewards' && <Rewards />}
    {screen === 'wallet' && <Placeholder title="Puan Cüzdanı" />}
    {screen === 'profile' && <Placeholder title="Profilim" />}
    <BottomNav screen={screen} setScreen={setScreen} />
  </main>
}

export default App
