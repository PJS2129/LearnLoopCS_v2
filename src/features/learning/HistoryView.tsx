import { useEffect, useState } from 'react'
import { ClockIcon, HistoryIcon, TargetIcon } from '../../components/Icon'
import { useAuth } from '../../lib/auth'
import type { LearningLog, LearningSummary, LearningTab } from '../../lib/types'
import {
  flushPendingHistory,
  getLearningSummary,
  getRecentLearningLogs,
} from './learningHistory'

interface Props {
  learningTabs: LearningTab[]
}

// 초 단위를 직관적인 한국어 시간 표현으로 변환 (예: 1시간 15분, 3분 40초, 25초)
function formatSeconds(sec: number): string {
  if (sec <= 0) return '0초'
  const hours = Math.floor(sec / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const remainingSec = sec % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}시간`)
  if (minutes > 0) parts.push(`${minutes}분`)
  if (remainingSec > 0 && hours === 0) parts.push(`${remainingSec}초`)
  return parts.join(' ') || `${sec}초`
}

// 타임스탬프 포맷
function formatTimestamp(ts: unknown): string {
  if (!ts) return ''
  let date: Date
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    date = (ts as { toDate: () => Date }).toDate()
  } else if (ts instanceof Date) {
    date = ts
  } else if (typeof ts === 'number') {
    date = new Date(ts)
  } else {
    return ''
  }

  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  if (isToday) {
    return `오늘 ${hours}:${minutes}`
  }
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day} ${hours}:${minutes}`
}

export default function HistoryView({ learningTabs }: Props) {
  const { user } = useAuth()
  const [summary, setSummary] = useState<LearningSummary | null>(null)
  const [recentLogs, setRecentLogs] = useState<LearningLog[]>([])
  const [loading, setLoading] = useState(Boolean(user?.uid))

  useEffect(() => {
    if (!user?.uid) return

    let cancelled = false

    // 먼저 현재 탭까지의 잔여 시간을 플러시한 후 최신 요약 및 로그 조회
    flushPendingHistory().then(async () => {
      const [sum, logs] = await Promise.all([
        getLearningSummary(user.uid),
        getRecentLearningLogs(user.uid, 15),
      ])
      if (!cancelled) {
        setSummary(sum)
        setRecentLogs(logs)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [user?.uid])

  if (loading) {
    return (
      <section className="card shell-empty" aria-live="polite">
        <p className="shell-empty-desc">학습 이력을 불러오는 중이에요…</p>
      </section>
    )
  }

  // 1. 총 학습 시간 계산
  const timeByTab = summary?.timeByTab ?? {}
  const totalSeconds = Object.values(timeByTab).reduce((acc, cur) => acc + cur, 0)

  // 2. 첫 시도 기준 정답률 계산
  const totalFirstAttempts = summary?.totalFirstAttempts ?? 0
  const correctFirstAttempts = summary?.correctFirstAttempts ?? 0
  const firstAttemptAccuracy =
    totalFirstAttempts > 0 ? Math.round((correctFirstAttempts / totalFirstAttempts) * 100) : 0

  // 총 풀이 횟수 (다시 푼 횟수 포함)
  const totalAttemptsCount = summary?.quizzes
    ? Object.values(summary.quizzes).reduce((acc, q) => acc + (q.totalAttempts || 0), 0)
    : 0

  // 기록 유무 판별
  const hasHistory = totalSeconds > 0 || totalFirstAttempts > 0 || recentLogs.length > 0

  // 영역별 최대 체류 시간 (막대 그래프 백분율 게이지 기준)
  const maxTabSeconds = Math.max(...learningTabs.map((t) => timeByTab[t.id] ?? 0), 1)

  return (
    <div className="history-view-container">
      {/* 상단 핵심 지표 카드 */}
      <div className="history-stats-grid">
        <div className="card history-stat-card">
          <div className="hstat-header">
            <span className="hstat-icon-wrap hstat-clock">
              <ClockIcon size={20} />
            </span>
            <span className="hstat-label">총 학습 시간</span>
          </div>
          <div className="hstat-value mono">{formatSeconds(totalSeconds)}</div>
          <div className="hstat-sub">화면 열람 및 조작 시간 누적</div>
        </div>

        <div className="card history-stat-card">
          <div className="hstat-header">
            <span className="hstat-icon-wrap hstat-target">
              <TargetIcon size={20} />
            </span>
            <span className="hstat-label">첫 시도 정답률</span>
          </div>
          <div className="hstat-value mono">
            {totalFirstAttempts > 0 ? `${firstAttemptAccuracy}%` : '-'}
          </div>
          <div className="hstat-sub">
            {totalFirstAttempts > 0 ? (
              <>
                <span className="mono">{correctFirstAttempts}</span> / {totalFirstAttempts}문제 정답 (총 {totalAttemptsCount}회 풀이)
              </>
            ) : (
              '아직 푼 문제가 없어요'
            )}
          </div>
        </div>
      </div>

      {/* 비어 있을 때의 안내 문구 */}
      {!hasHistory && (
        <section className="card history-empty-card" aria-label="학습 기록 없음">
          <div className="history-empty-icon" aria-hidden="true">
            <HistoryIcon size={36} />
          </div>
          <h3 className="history-empty-title">아직 기록된 학습 활동이 없어요</h3>
          <p className="history-empty-desc">
            상단 메뉴에서 시뮬레이터(알고리즘, 논리회로)를 체험하거나
            <br />
            개념 카드와 연습 문제를 풀면 여기에 나의 학습 흐름이 기록돼요!
          </p>
        </section>
      )}

      {/* 2. 영역별 학습 시간 막대 그래프 (learning-tabs.json 기반) */}
      <section className="card history-chart-card" aria-label="영역별 학습 시간">
        <div className="history-card-header">
          <h3 className="history-card-title">영역별 학습 시간</h3>
          <span className="history-card-sub">탭 id 기반 집계</span>
        </div>

        <div className="history-bars-list">
          {learningTabs.map((tab) => {
            const sec = timeByTab[tab.id] ?? 0
            const pct = totalSeconds > 0 ? Math.round((sec / maxTabSeconds) * 100) : 0

            return (
              <div key={tab.id} className="history-bar-row">
                <div className="history-bar-meta">
                  <span className="history-bar-tab-name">
                    <strong>{tab.name}</strong>
                    <span className="history-bar-tab-area">{tab.area}</span>
                  </span>
                  <span className="history-bar-time mono">{formatSeconds(sec)}</span>
                </div>
                <div className="history-bar-track">
                  <div
                    className="history-bar-fill"
                    style={{ width: `${Math.max(pct, sec > 0 ? 3 : 0)}%` }}
                    aria-label={`${tab.name} ${formatSeconds(sec)}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. 최근 활동 타임라인 */}
      <section className="card history-logs-card" aria-label="최근 활동 목록">
        <div className="history-card-header">
          <h3 className="history-card-title">최근 활동 목록</h3>
          <span className="history-card-sub">최근 {recentLogs.length}건</span>
        </div>

        {recentLogs.length === 0 ? (
          <p className="history-no-logs">최근 활동 내역이 없습니다.</p>
        ) : (
          <div className="history-timeline">
            {recentLogs.map((log, idx) => (
              <div key={log.id ?? idx} className="history-timeline-item">
                <div className="history-item-dot" />
                <div className="history-item-content">
                  <div className="history-item-top">
                    <span className="history-item-badge">{log.tabName || log.tabId}</span>
                    <span className="history-item-time mono">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  <div className="history-item-desc">
                    <strong className="history-item-activity">
                      {log.activity === 'quiz'
                        ? '연습 문제'
                        : log.activity === 'view_card'
                        ? '개념 카드'
                        : log.activity === 'start'
                        ? '시뮬레이터 시작'
                        : log.activity === 'complete'
                        ? '시뮬레이터 완료'
                        : log.activity === 'explain'
                        ? '회로 설명 확인'
                        : log.activity}
                    </strong>
                    {log.detail && <span className="history-item-detail">{log.detail}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
