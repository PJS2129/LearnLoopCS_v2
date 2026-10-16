import { APP_CONFIG } from './config'
import './shell.css'

// 빈 셸: 헤더, 빈 탭 바, 본문 영역. 로그인·탭 내용은 이후 단계에서 채운다.
export default function Shell() {
  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-brand">
          <span className="shell-logo" aria-hidden="true">LL</span>
          <h1 className="shell-title">{APP_CONFIG.appName}</h1>
          <span className="shell-course">{APP_CONFIG.courseName}</span>
        </div>
        <div className="shell-user" aria-label="사용자 영역 (준비 중)" />
      </header>

      <nav className="shell-tabs" aria-label="메뉴 탭">
        <div className="shell-tabs-inner" role="tablist" />
      </nav>

      <main className="shell-main">
        <section className="card shell-empty">
          <p className="shell-empty-title">화면을 준비하고 있어요</p>
          <p className="shell-empty-desc">로그인과 학습 탭은 다음 단계에서 추가됩니다.</p>
        </section>
      </main>
    </div>
  )
}
