// 시뮬레이터가 postMessage로 보내는 활동 신호의 형식과 검증.
// 2-1단계에서는 콘솔에 출력만 한다. Firestore 저장은 2-3단계에서 recordActivity를 교체해 연결한다.

export interface ActivitySignal {
  type: 'activity'
  tab: string // 신호를 보낸 학습 탭 id (플랫폼이 현재 열린 탭 id로 덮어씀)
  activity: string // 예: "start", "complete"
  detail: string // 예: 알고리즘 이름
  duration: number // 밀리초. 해당 없으면 0
}

const MAX_TEXT = 100

// 형식이 맞지 않으면 null을 돌려준다. 문자열 길이와 숫자 범위를 제한해 비정상 값을 걸러 낸다.
export function parseActivitySignal(data: unknown, currentTabId: string): ActivitySignal | null {
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  if (d.type !== 'activity') return null
  if (typeof d.activity !== 'string' || d.activity.length === 0 || d.activity.length > MAX_TEXT) return null
  const detail = d.detail === undefined ? '' : d.detail
  if (typeof detail !== 'string' || detail.length > MAX_TEXT) return null
  const duration = d.duration === undefined ? 0 : d.duration
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0 || duration > 24 * 3600 * 1000) {
    return null
  }
  // 콘텐츠가 보낸 tab 값은 믿지 않고, 지금 열려 있는 탭 id를 쓴다.
  return { type: 'activity', tab: currentTabId, activity: d.activity, detail, duration }
}

import { queueActivitySignal } from './learningHistory'

export function recordActivity(signal: ActivitySignal, uid?: string | null, tabName?: string): void {
  console.log('[activity]', signal)
  if (uid) {
    queueActivitySignal(uid, signal, tabName || signal.tab)
  }
}

