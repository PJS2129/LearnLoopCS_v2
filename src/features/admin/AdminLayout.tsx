import { useState, type ReactNode } from 'react'
import {
  BookIcon,
  ExamIcon,
  HistoryIcon,
  ShieldIcon,
  TargetIcon,
} from '../../components/Icon'
import { useAuth } from '../../lib/auth'
import QuestionManager from './QuestionManager'
import ExamOperation from './ExamOperation'
import ExamPreview from './ExamPreview'
import './admin.css'

type AdminNavId =
  | 'questions'
  | 'operation'
  | 'preview'
  | 'analytics'
  | 'publish'

interface AdminMenuItem {
  id: AdminNavId
  label: string
  icon: ReactNode
  isReady: boolean
  description: string
}

const ADMIN_MENUS: AdminMenuItem[] = [
  {
    id: 'questions',
    label: '문항 관리',
    icon: <BookIcon size={18} />,
    isReady: true,
    description: 'AI 출제 문항 JSON 가져오기 및 검토',
  },
  {
    id: 'operation',
    label: '시험 운영',
    icon: <ExamIcon size={18} />,
    isReady: true,
    description: '시험 일시·제한시간 설정, 시험 코드 발급 및 시험 개방/닫기',
  },
  {
    id: 'preview',
    label: '시험 미리보기',
    icon: <TargetIcon size={18} />,
    isReady: true,
    description: '확정 시험의 학생 안내·시험지 화면을 읽기 전용으로 확인',
  },
  {
    id: 'analytics',
    label: '성적과 분석',
    icon: <HistoryIcon size={18} />,
    isReady: false,
    description: '통계 대시보드, 오답 분석 및 AI 요약 (3-2단계)',
  },
  {
    id: 'publish',
    label: '성적 공개',
    icon: <ShieldIcon size={18} />,
    isReady: false,
    description: '공개 범위 설정 및 학생별 결과 이관 (3-2단계)',
  },
]

export default function AdminLayout() {
  const { isAdmin } = useAuth()
  const [activeMenu, setActiveMenu] = useState<AdminNavId>('questions')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true'
  })

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('admin_sidebar_collapsed', String(next))
      return next
    })
  }

  // 관리자 권한이 없는 경우 화면 단계에서 차단 안내 표시
  if (!isAdmin) {
    return (
      <div className="admin-layout" style={{ justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px', background: '#fff', padding: '32px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
          <h3 style={{ color: '#1B2B5B', margin: '0 0 8px' }}>관리자 권한이 필요합니다</h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 20px' }}>
            이 메뉴는 관리자로 지정된 계정만 열람할 수 있습니다. 관리자 권한 확인이 필요한 경우 시스템 관리자(교수자)에게 문의하세요.
          </p>
        </div>
      </div>
    )
  }

  const currentItem = ADMIN_MENUS.find((m) => m.id === activeMenu) ?? ADMIN_MENUS[0]

  return (
    <div className={`admin-layout ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>
      {/* Navy 사이드 메뉴 */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-top-bar">
            {!isSidebarCollapsed && <span className="admin-badge">Admin Studio</span>}
            <button
              type="button"
              className="admin-sidebar-toggle-btn"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기 (화면 넓게 쓰기)'}
              aria-label="사이드바 접기/펼치기"
            >
              {isSidebarCollapsed ? '▶' : '◀'}
            </button>
          </div>
          {!isSidebarCollapsed && <h2 className="admin-sidebar-title">교수자 관리실</h2>}
        </div>

        <nav className="admin-sidebar-nav" aria-label="관리자 메뉴">
          {ADMIN_MENUS.map((menu) => {
            const isActive = activeMenu === menu.id
            return (
              <button
                key={menu.id}
                type="button"
                className={`admin-nav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveMenu(menu.id)}
                title={isSidebarCollapsed ? `${menu.label} (${menu.isReady ? '사용 중' : '준비 중'})` : undefined}
              >
                <span className="admin-nav-label">
                  {menu.icon}
                  {!isSidebarCollapsed && <span>{menu.label}</span>}
                </span>
                {!isSidebarCollapsed && (
                  <span className={`admin-nav-chip ${menu.isReady ? 'active-chip' : ''}`}>
                    {menu.isReady ? '사용 중' : '준비 중'}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* 관리자 메인 콘텐츠 */}
      <section className="admin-content">
        {activeMenu === 'questions' && <QuestionManager />}
        {activeMenu === 'operation' && <ExamOperation />}
        {activeMenu === 'preview' && <ExamPreview />}

        {activeMenu !== 'questions' && activeMenu !== 'operation' && activeMenu !== 'preview' && (
          <div className="admin-placeholder-view">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚧</div>
            <h3>{currentItem.label} (준비 중)</h3>
            <p>{currentItem.description}</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '12px' }}>
              해당 기능은 순서에 따라 다음 단계에서 구현될 예정입니다.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
