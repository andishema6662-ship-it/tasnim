import { Link } from 'react-router-dom'

export function Splash() {
  return (
    <div className="app-shell auth">
      <section className="hero-splash">
        <div className="brand-mark" style={{ marginBottom: 8 }}>
          <div className="logo">د</div>
          <div>
            <div className="name">شارژبان</div>
            <span className="tag">مدیریت شارژ ساختمان</span>
          </div>
        </div>
        <div className="visual" role="img" aria-label="نمای مجتمع مسکونی" />
        <h1>شارژ شفاف، ساختمان آرام</h1>
        <p>چهار نقش: ادمین کل، مدیر شهرک، مدیر بلوک، مدیر مالی — به‌همراه ساکنین.</p>
        <div className="cta-row">
          <Link className="btn btn-primary" to="/login">
            ورود نقش‌محور
          </Link>
          <Link className="btn btn-secondary" to="/login">
            ادمین / شهرک / مالی
          </Link>
          <Link className="btn btn-ghost" to="/subscription">
            مشاهده پلن اشتراک
          </Link>
        </div>
      </section>
    </div>
  )
}
