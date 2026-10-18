import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { StudentProfile } from '../../lib/types'
import type { ExamInfo, ExamSession, StudentExamQuestion } from './types'

export async function fetchExamInfo(examId: string): Promise<ExamInfo | null> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')
  const examRef = doc(db, 'exams', examId)
  const snap = await getDoc(examRef)
  if (!snap.exists()) return null
  return snap.data() as ExamInfo
}

/**
 * Apps Script Web App에서 서버 공인 시각 조회 (GET 요청)
 * 3초 타임아웃, 실패 시 null 반환 (로컬 fallback용)
 */
export async function fetchServerTime(): Promise<Date | null> {
  const gasUrl = import.meta.env.VITE_GAS_URL as string | undefined
  if (!gasUrl) return null

  try {
    const controller = new AbortController()
    const timerId = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(gasUrl, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timerId)

    if (!res.ok) return null
    const data = await res.json()
    if (data && data.timestamp) {
      const d = new Date(data.timestamp)
      if (!isNaN(d.getTime())) return d
    }
    return null
  } catch (err) {
    console.warn('서버 시각 조회 실패 (로컬 시각 fallback):', err)
    return null
  }
}

export async function fetchExamSession(
  examId: string,
  uid: string,
  examInfo?: ExamInfo | null,
): Promise<ExamSession | null> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')
  const sessionRef = doc(db, 'exams', examId, 'sessions', uid)
  const snap = await getDoc(sessionRef)
  if (!snap.exists()) return null
  const data = snap.data() as ExamSession

  // [4-3단계 A안] 세션 문서에 individualEndAt이 없으면 enteredAt + duration, closeAt으로 계산하여 주입
  if (!data.individualEndAt && data.enteredAt && examInfo) {
    let enteredTime = 0
    if (typeof (data.enteredAt as { toDate?: () => Date }).toDate === 'function') {
      enteredTime = (data.enteredAt as { toDate: () => Date }).toDate().getTime()
    } else if (data.enteredAt instanceof Date) {
      enteredTime = data.enteredAt.getTime()
    } else if (typeof data.enteredAt === 'string' || typeof data.enteredAt === 'number') {
      enteredTime = new Date(data.enteredAt).getTime()
    }

    if (enteredTime > 0) {
      const durationMs = (examInfo.durationMinutes || 50) * 60 * 1000
      let limitDate = new Date(enteredTime + durationMs)
      const closeAtSnap = examInfo.closeAt as { toDate?: () => Date } | undefined
      if (closeAtSnap?.toDate) {
        const closeAtDate = closeAtSnap.toDate()
        if (closeAtDate.getTime() < limitDate.getTime()) {
          limitDate = closeAtDate
        }
      }
      data.individualEndAt = limitDate
    }
  }

  return data
}

export interface CreateSessionParams {
  examId: string
  uid: string
  profile: StudentProfile
  enteredCode: string
  examInfo: ExamInfo
}

export async function createExamSession(
  params: CreateSessionParams,
): Promise<ExamSession> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')

  const { examId, uid, profile, enteredCode, examInfo } = params
  const sessionRef = doc(db, 'exams', examId, 'sessions', uid)

  // [4-3단계 A안] Firestore 세션 문서에는 enteredAt만 serverTimestamp()로 저장 (individualEndAt 제외)
  const sessionData = {
    uid,
    studentId: profile.studentId,
    name: profile.name,
    section: profile.section,
    enteredCode: enteredCode.trim().toUpperCase(),
    enteredAt: serverTimestamp(),
  }

  await setDoc(sessionRef, sessionData)

  // UI 반환 객체에는 min(입장 시각 + 제한시간, closeAt)을 계산해 부여
  const durationMs = (examInfo.durationMinutes || 50) * 60 * 1000
  const now = new Date()
  let limitDate = new Date(now.getTime() + durationMs)

  const closeAtSnap = examInfo.closeAt as { toDate?: () => Date } | undefined
  if (closeAtSnap?.toDate) {
    const closeAtDate = closeAtSnap.toDate()
    if (closeAtDate.getTime() > now.getTime() && closeAtDate.getTime() < limitDate.getTime()) {
      limitDate = closeAtDate
    }
  }

  return {
    ...sessionData,
    enteredAt: now,
    individualEndAt: limitDate,
  }
}

export async function fetchExamQuestions(
  examId: string,
): Promise<StudentExamQuestion[]> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')

  const qCol = collection(db, 'exams', examId, 'questions')
  const qQuery = query(qCol, orderBy('no', 'asc'))
  const snap = await getDocs(qQuery)

  return snap.docs.map((d) => d.data() as StudentExamQuestion)
}

/**
 * [4-2단계] Firestore에서 학생의 시험 접수 완료 문서 조회
 */
export async function fetchExamSubmission(
  examId: string,
  uid: string,
): Promise<{ receiptId: string; submittedAt: string } | null> {
  if (!db) return null
  try {
    const subRef = doc(db, 'exams', examId, 'submissions', uid)
    const snap = await getDoc(subRef)
    if (!snap.exists()) return null
    const data = snap.data()
    let timeStr = ''
    if (data.submittedAt?.toDate) {
      const d: Date = data.submittedAt.toDate()
      timeStr = d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } else {
      timeStr = String(data.submittedAt || '')
    }
    return {
      receiptId: data.receiptId || `REC-${examId}`,
      submittedAt: timeStr,
    }
  } catch {
    return null
  }
}

/**
 * [4-2단계] Firestore에 학생 답안 접수 문서 기록
 */
export async function recordExamSubmission(params: {
  examId: string
  uid: string
  receiptId: string
  submitType: 'manual' | 'auto' | 'delayed'
}): Promise<void> {
  if (!db) return
  const { examId, uid, receiptId, submitType } = params
  const subRef = doc(db, 'exams', examId, 'submissions', uid)
  await setDoc(subRef, {
    uid,
    receiptId,
    submittedAt: serverTimestamp(),
    submitType,
  })
}

/**
 * [4-2단계] Apps Script 채점 서버로 답안 전송 및 자동 재전송
 */
export async function submitExamToGas(params: {
  examId: string
  idToken: string
  answers: Record<number, number>
  submitType: 'manual' | 'auto'
}): Promise<{ receiptId: string; submittedAt: string }> {
  const gasUrl = import.meta.env.VITE_GAS_URL
  if (!gasUrl) {
    throw new Error(
      '채점 서버 주소(VITE_GAS_URL)가 설정되지 않았습니다. 관리자에게 문의하세요.',
    )
  }

  const payload = {
    action: 'submitExam',
    idToken: params.idToken,
    examId: params.examId,
    answers: params.answers,
    submitType: params.submitType,
  }

  const maxAttempts = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
      }

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || '답안 접수에 실패했습니다.')
      }

      return {
        receiptId: json.receiptId,
        submittedAt: json.submittedAt,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // 토큰 만료 또는 세션 없음 등 재시도해도 불가능한 오류는 즉시 중단
      if (
        lastError.message.includes('만료') ||
        lastError.message.includes('존재하지 않습니다')
      ) {
        throw lastError
      }
      // 재시도 전 지연 (1회차: 1.2초, 2회차: 2.5초)
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1200))
      }
    }
  }

  throw lastError || new Error('네트워크 연결 불안정으로 답안 전송에 실패했습니다.')
}

