import { Link } from 'react-router-dom'

export function Splash() {
  return (
    <div className="app-shell auth">
      <section className="hero-splash">
        <div className="brand-mark" style={{ marginBottom: 8 }}>
          <div className="logo">د</div>
          <div>
            <div className="name">دیارشارژ</div>
            <span className="tag">مدیریت شارژ ساختمان</span>
          </div>
        </div>
        <div className="visual" role="img" aria-label="نمای مجتمع مسکونی" />
        <h1>شارژ شفاف، ساختمان آرام</h1>
        <p>محاسبه شارژ، پرداخت آنلاین، نظرسنجی و بیلان مالی — مخصوص مدیر و ساکنین.</p>
        <div className="cta-row">
          <Link className="btn btn-primary" to="/login">
            ورود به پنل
          </Link>
          <Link className="btn btn-secondary" to="/subscription">
            مشاهده پلن اشتراک
          </Link>
        </div>
      </section>
    </div>
  )
}
