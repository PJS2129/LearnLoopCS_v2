import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
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

export async function fetchExamSession(
  examId: string,
  uid: string,
): Promise<ExamSession | null> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')
  const sessionRef = doc(db, 'exams', examId, 'sessions', uid)
  const snap = await getDoc(sessionRef)
  if (!snap.exists()) return null
  return snap.data() as ExamSession
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

  // 개인 종료 시각 계산: min(입장 시각 + 제한시간, closeAt)
  const durationMs = (examInfo.durationMinutes || 50) * 60 * 1000
  const nowMs = Date.now()
  let limitDate = new Date(nowMs + durationMs)

  const closeAtSnap = examInfo.closeAt as { toDate?: () => Date } | undefined
  if (closeAtSnap?.toDate) {
    const closeAtDate = closeAtSnap.toDate()
    if (closeAtDate.getTime() < limitDate.getTime()) {
      limitDate = closeAtDate
    }
  }

  const individualEndAt = Timestamp.fromDate(limitDate)

  const sessionData = {
    uid,
    studentId: profile.studentId,
    name: profile.name,
    section: profile.section,
    enteredCode: enteredCode.trim().toUpperCase(),
    enteredAt: serverTimestamp(),
    individualEndAt,
  }

  await setDoc(sessionRef, sessionData)

  return {
    ...sessionData,
    enteredAt: new Date(),
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

