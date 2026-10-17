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
