import { APP_CONFIG } from '../../app/config'
import { GoogleIcon } from '../../components/Icon'
import { useAuth } from '../../lib/auth'
import './auth.css'

export default function LoginScreen() {
  const { signIn } = useAuth()
  return (
    <main className="login">
      <section className="login-card card">
        <span className="login-logo" aria-hidden="true">LL</span>
        <h1 className="login-title">{APP_CONFIG.appName}</h1>
        <p className="login-tagline">{APP_CONFIG.tagline}</p>
        <button id="btn-google-login" type="button" className="btn btn-primary login-btn" onClick={signIn}>
          <span className="login-google"><GoogleIcon size={20} /></span>
          Google 계정으로 시작하기
        </button>
      </section>
    </main>
  )
}
