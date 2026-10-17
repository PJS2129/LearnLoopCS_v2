import Shell from './app/Shell'
import Modal from './components/Modal'
import LoginScreen from './features/auth/LoginScreen'
import RegisterModal from './features/auth/RegisterModal'
import { AuthProvider, useAuth } from './lib/auth'
import { isFirebaseConfigured } from './lib/firebase'
import './features/auth/auth.css'

function SetupNotice() {
  return (
    <main className="login">
      <section className="card setup-card">
        <h1>Firebase 설정이 필요해요</h1>
        <p>
          <code>.env.local</code> 파일에 <code>VITE_FIREBASE_*</code> 값을 채운 뒤 개발 서버를 다시
          시작해 주세요. 배포 환경에서는 Vercel 환경 변수에 같은 값을 등록하고 재배포해야 해요.
        </p>
        <p>필요한 항목은 <code>.env.example</code>에 적혀 있어요.</p>
      </section>
    </main>
  )
}

function Gate() {
  const { status, error, clearError } = useAuth()

  return (
    <>
      {status === 'loading' && (
        <main className="login">
          <p className="mono" style={{ color: '#fff' }}>불러오는 중…</p>
        </main>
      )}
      {status === 'signedOut' && <LoginScreen />}
      {status === 'needsRegistration' && (
        <>
          <main className="login" />
          <RegisterModal />
        </>
      )}
      {status === 'ready' && <Shell />}
      {error && (
        <Modal
          title="안내"
          onClose={clearError}
          actions={
            <button type="button" className="btn btn-primary" onClick={clearError}>
              확인
            </button>
          }
        >
          <p>{error}</p>
        </Modal>
      )}
    </>
  )
}

export default function App() {
  if (!isFirebaseConfigured) return <SetupNotice />
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
