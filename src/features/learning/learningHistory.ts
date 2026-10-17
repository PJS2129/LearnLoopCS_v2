import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { LearningLog, LearningSummary } from '../../lib/types'
import type { ActivitySignal } from './activity'

// 메모리 버퍼 상태
let currentTabId: string | null = null
let currentUid: string | null = null
let tabStartTime: number | null = null
let accumulatedSeconds = 0
let isVisible = true
let flushTimer: number | null = null

// 활동 신호 버퍼 (Firestore에 일괄 쓰기 전 임시 보관)
const activityBuffer: {
  tabId: string
  tabName: string
  activity: string
  detail: string
  duration: number
}[] = []

// 고유 ID 생성 (클라이언트 생성 create 전용 문서용)
function makeDocId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 탭 추적 시작
 */
export function startTabTracking(uid: string, tabId: string) {
  if (currentTabId && currentUid && (currentTabId !== tabId || currentUid !== uid)) {
    flushPendingHistory()
  }

  currentUid = uid
  currentTabId = tabId
  accumulatedSeconds = 0
  isVisible = !document.hidden
  tabStartTime = isVisible ? Date.now() : null

  if (!flushTimer) {
    flushTimer = window.setInterval(() => {
      flushPendingHistory()
    }, 30000) // 30초 주기 플러시
  }
}

/**
 * 탭 추적 중지
 */
export function stopTabTracking() {
  flushPendingHistory()
  currentTabId = null
  tabStartTime = null
  accumulatedSeconds = 0
  if (flushTimer) {
    window.clearInterval(flushTimer)
    flushTimer = null
  }
}

/**
 * 화면 가시성 변경 핸들러 (화면을 보고 있을 때만 시간 측정)
 */
export function setVisibility(visible: boolean) {
  if (visible === isVisible) return
  isVisible = visible

  if (!visible) {
    // 화면이 가려지면 지금까지 본 시간 누적 후 타이머 정지
    if (tabStartTime) {
      accumulatedSeconds += Math.floor((Date.now() - tabStartTime) / 1000)
      tabStartTime = null
    }
    // 백그라운드 전환 시 즉시 플러시
    flushPendingHistory()
  } else {
    // 다시 화면이 보이면 타이머 재개
    tabStartTime = Date.now()
  }
}

/**
 * 외부 활동 신호(시뮬레이터, 개념 카드 열람 등) 버퍼에 등록
 */
export function queueActivitySignal(uid: string, signal: ActivitySignal, tabName: string) {
  if (uid && !currentUid) {
    currentUid = uid
  }

  activityBuffer.push({
    tabId: signal.tab,
    tabName,
    activity: signal.activity,
    detail: signal.detail,
    duration: Math.round(signal.duration),
  })

  // 버퍼가 5개 이상 쌓이면 즉시 플러시
  if (activityBuffer.length >= 5) {
    flushPendingHistory()
  }
}


/**
 * 버퍼에 쌓인 체류 시간과 활동 로그를 Firestore에 저장
 */
export async function flushPendingHistory(): Promise<void> {
  if (!db || !currentUid) return

  // 1. 현재 탭 체류 시간 계산
  if (isVisible && tabStartTime) {
    const elapsedSec = Math.floor((Date.now() - tabStartTime) / 1000)
    accumulatedSeconds += elapsedSec
    tabStartTime = Date.now() // 리셋
  }

  const secondsToAdd = accumulatedSeconds
  accumulatedSeconds = 0
  const logsToFlush = activityBuffer.splice(0, activityBuffer.length)
  const tabId = currentTabId
  const uid = currentUid

  // 저장할 내용이 없으면 종료
  if (secondsToAdd <= 0 && logsToFlush.length === 0) return

  try {
    const summaryRef = doc(db, 'students', uid, 'learning_stats', 'summary')
    const summarySnap = await getDoc(summaryRef)

    let currentSummary: LearningSummary = {
      timeByTab: {},
      quizzes: {},
      totalFirstAttempts: 0,
      correctFirstAttempts: 0,
    }

    if (summarySnap.exists()) {
      const data = summarySnap.data() as Partial<LearningSummary>
      currentSummary = {
        timeByTab: data.timeByTab ?? {},
        quizzes: data.quizzes ?? {},
        totalFirstAttempts: data.totalFirstAttempts ?? 0,
        correctFirstAttempts: data.correctFirstAttempts ?? 0,
      }
    }

    // 탭별 시간 누적
    if (tabId && secondsToAdd > 0) {
      currentSummary.timeByTab[tabId] = (currentSummary.timeByTab[tabId] ?? 0) + secondsToAdd
    }

    // summary 갱신 (create or update)
    await setDoc(summaryRef, {
      ...currentSummary,
      updatedAt: serverTimestamp(),
    })

    // 활동 로그 각각 create
    for (const log of logsToFlush) {
      const logRef = doc(db, 'students', uid, 'learning_logs', makeDocId())
      await setDoc(logRef, {
        tabId: log.tabId,
        tabName: log.tabName,
        activity: log.activity,
        detail: log.detail,
        duration: log.duration,
        timestamp: serverTimestamp(),
      })
    }
  } catch (err) {
    console.error('[learningHistory] flush failed:', err)
  }
}

/**
 * 연습 문제 풀이 기록 저장
 * - 첫 시도(firstAttempt)는 덮어쓰지 않고 따로 보존
 * - 다시 푼 기록도 attempts로 추가 보존
 * - summary에 첫 시도 정답률 집계 갱신
 */
export async function recordPracticeQuizAttempt(params: {
  uid: string
  quizId: string
  tabId: string
  tabName: string
  selectedOption: number
  isCorrect: boolean
}): Promise<{ isFirstAttempt: boolean }> {
  if (!db) return { isFirstAttempt: false }

  const { uid, quizId, tabId, tabName, selectedOption, isCorrect } = params
  const summaryRef = doc(db, 'students', uid, 'learning_stats', 'summary')

  try {
    const summarySnap = await getDoc(summaryRef)
    let currentSummary: LearningSummary = {
      timeByTab: {},
      quizzes: {},
      totalFirstAttempts: 0,
      correctFirstAttempts: 0,
    }

    if (summarySnap.exists()) {
      const data = summarySnap.data() as Partial<LearningSummary>
      currentSummary = {
        timeByTab: data.timeByTab ?? {},
        quizzes: data.quizzes ?? {},
        totalFirstAttempts: data.totalFirstAttempts ?? 0,
        correctFirstAttempts: data.correctFirstAttempts ?? 0,
      }
    }

    const prevQuizInfo = currentSummary.quizzes[quizId]
    const isFirstAttempt = !prevQuizInfo
    const attemptNumber = prevQuizInfo ? prevQuizInfo.totalAttempts + 1 : 1

    if (isFirstAttempt) {
      currentSummary.totalFirstAttempts = (currentSummary.totalFirstAttempts ?? 0) + 1
      if (isCorrect) {
        currentSummary.correctFirstAttempts = (currentSummary.correctFirstAttempts ?? 0) + 1
      }
      currentSummary.quizzes[quizId] = {
        firstCorrect: isCorrect,
        totalAttempts: 1,
      }
    } else {
      currentSummary.quizzes[quizId] = {
        firstCorrect: prevQuizInfo.firstCorrect,
        totalAttempts: attemptNumber,
      }
    }

    // 1. summary 문서 갱신
    await setDoc(summaryRef, {
      ...currentSummary,
      updatedAt: serverTimestamp(),
    })

    // 2. practice_results 생성 (create 전용, 수정/삭제 불가)
    const resultDocId = `${quizId}_att_${attemptNumber}_${Date.now()}`
    const resultRef = doc(db, 'students', uid, 'practice_results', resultDocId)
    await setDoc(resultRef, {
      quizId,
      tabId,
      selectedOption,
      isCorrect,
      attemptNumber,
      isFirstAttempt,
      createdAt: serverTimestamp(),
    })

    // 3. learning_logs 생성
    const logRef = doc(db, 'students', uid, 'learning_logs', makeDocId())
    await setDoc(logRef, {
      tabId,
      tabName,
      activity: 'quiz',
      detail: `${isFirstAttempt ? '첫 시도' : `${attemptNumber}회차 다시 풀기`} - ${isCorrect ? '정답' : '오답'}`,
      duration: 0,
      timestamp: serverTimestamp(),
    })

    return { isFirstAttempt }
  } catch (err) {
    console.error('[learningHistory] recordPracticeQuizAttempt failed:', err)
    return { isFirstAttempt: false }
  }
}

/**
 * 학습 요약 데이터 조회
 */
export async function getLearningSummary(uid: string): Promise<LearningSummary | null> {
  if (!db) return null
  try {
    const summaryRef = doc(db, 'students', uid, 'learning_stats', 'summary')
    const snap = await getDoc(summaryRef)
    if (!snap.exists()) return null
    return snap.data() as LearningSummary
  } catch (err) {
    console.error('[learningHistory] getLearningSummary error:', err)
    return null
  }
}

/**
 * 최근 활동 로그 목록 조회 (최신순 15건)
 */
export async function getRecentLearningLogs(uid: string, count = 15): Promise<LearningLog[]> {
  if (!db) return []
  try {
    const logsCol = collection(db, 'students', uid, 'learning_logs')
    const q = query(logsCol, orderBy('timestamp', 'desc'), limit(count))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<LearningLog, 'id'>),
    }))
  } catch (err) {
    console.error('[learningHistory] getRecentLearningLogs error:', err)
    return []
  }
}
