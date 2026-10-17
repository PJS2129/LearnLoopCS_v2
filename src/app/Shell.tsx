import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { APP_CONFIG } from './config'
import { BookIcon, ExamIcon, HistoryIcon, LogoutIcon, ShieldIcon } from '../components/Icon'
import { useAuth } from '../lib/auth'
import type { LearningTab } from '../lib/types'
import TabPlaceholder from '../features/learning/TabPlaceholder'
import SlotView from '../features/learning/SlotView'
import HistoryView from '../features/learning/HistoryView'
import {
  flushPendingHistory,
  setVisibility,
  startTabTracking,
  stopTabTracking,
} from '../features/learning/learningHistory'
import './shell.css'

interface TabItem {
  id: string
  label: string
  icon: ReactNode
  admin?: boolean
  description?: string
  learning?: LearningTab
}

// 로그인·등록을 마친 사용자에게 보이는 셸: 헤더, 탭 바, 본문
export default function Shell() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [learningTabs, setLearningTabs] = useState<LearningTab[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // 학습 탭은 learning-tabs.json에서 자동 생성한다. 이름·순서를 코드에 적지 않는다.
  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}learning-tabs.json`)
      .then((r) => {
        if (!r.ok) throw new Error('load failed')
        return r.json() as Promise<LearningTab[]>
      })
      .then((tabs) => {
        if (!cancelled) setLearningTabs(tabs)
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const tabs = useMemo<TabItem[]>(() => {
    const list: TabItem[] = learningTabs.map((t) => ({
      id: `learn:${t.id}`,
      label: t.name,
      icon: <BookIcon size={18} />,
      description: `${t.area} 학습 콘텐츠를 준비 중이에요.`,
      learning: t,
    }))
    list.push({ id: 'history', label: '학습 이력', icon: <HistoryIcon size={18} /> })
    list.push({ id: 'exam', label: '시험', icon: <ExamIcon size={18} /> })
    // 화면 숨김. 실제 권한은 Firestore 보안 규칙에서도 다시 확인한다.
    if (isAdmin) {
      list.push({ id: 'admin', label: '관리자', icon: <ShieldIcon size={18} />, admin: true })
    }
    return list
  }, [learningTabs, isAdmin])

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]

  // 학습 탭 체류 시간 측정 (학습 탭에 있을 때만 측정)
  useEffect(() => {
    if (!user?.uid) return
    if (active?.learning) {
      startTabTracking(user.uid, active.learning.id)
    } else {
      stopTabTracking()
    }
  }, [user?.uid, active?.learning])

  // 화면 가시성 변경(백그라운드 전환 시 타이머 정지) 및 페이지 이탈 시 플러시
  useEffect(() => {
    const onVisibilityChange = () => {
      setVisibility(!document.hidden)
    }
    const onBeforeUnload = () => {
      flushPendingHistory()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [])

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-brand">
          <span className="shell-logo" aria-hidden="true">LL</span>
          <h1 className="shell-title">{APP_CONFIG.appName}</h1>
          <span className="shell-course">{APP_CONFIG.courseName}</span>
        </div>
        <div className="shell-user">
          {profile && (
            <span className="shell-user-info">
              <strong>{profile.name}</strong>
              <span className="mono shell-user-id">{profile.studentId}</span>
            </span>
          )}
          <button id="btn-logout" type="button" className="shell-logout" onClick={signOut}>
            <LogoutIcon size={18} />
            <span>로그아웃</span>
          </button>
        </div>
      </header>

      <nav className="shell-tabs" aria-label="메뉴 탭">
        <div className="shell-tabs-inner" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id.replace(':', '-')}`}
              type="button"
              role="tab"
              aria-selected={active?.id === t.id}
              className={`shell-tab ${active?.id === t.id ? 'is-active' : ''} ${t.admin ? 'is-admin' : ''}`}
              onClick={() => setActiveId(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="shell-main">
        {loadFailed && (
          <p className="shell-notice" role="alert">
            학습 탭 목록을 불러오지 못했어요. 새로고침해 주세요.
          </p>
        )}
        {active?.id === 'history' && <HistoryView learningTabs={learningTabs} />}
        {active && active.learning && <SlotView key={active.id} tab={active.learning} />}
        {active && !active.learning && active.id !== 'history' && (
          <TabPlaceholder title={active.label} description={active.description} />
        )}
      </main>
    </div>
  )
}

