import type { User } from 'firebase/auth'
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { ExamInfo, ExamPrivateConfig } from './types'

export interface ExamOperationData {
  info: ExamInfo | null
  config: ExamPrivateConfig | null
  hasLegacyFinalizedBy: boolean // exams/{examId}에 finalizedBy가 남아있는지 여부
}

export interface SaveOperationParams {
  examId: string
  examDate: string
  startAt: Date
  durationMinutes: number
  bufferMinutes: number
  accessCode: string
  newStatus?: 'finalized' | 'ready' | 'open' | 'closed'
}

/**
 * 6자리 시험 코드 생성 (알파벳 대문자 + 숫자 혼합, 헷갈리기 쉬운 I, O, 0, 1 제외)
 */
export function generateRandomAccessCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 시험 정보 및 비공개 설정 로드 (관리자 전용)
 */
export async function fetchExamOperationData(
  examId: string,
): Promise<ExamOperationData> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')

  const examPath = `exams/${examId}`
  const configPath = `exams/${examId}/private/config`

  const examRef = doc(db, 'exams', examId)
  const configRef = doc(db, 'exams', examId, 'private', 'config')

  let examSnap
  try {
    examSnap = await getDoc(examRef)
  } catch (err) {
    throw new Error(`[${examPath}] 읽기 실패: ${err instanceof Error ? err.message : String(err)}`)
  }

  let configSnap
  try {
    configSnap = await getDoc(configRef)
  } catch (err) {
    throw new Error(`[${configPath}] 읽기 실패: ${err instanceof Error ? err.message : String(err)}`)
  }

  let info: ExamInfo | null = null
  let hasLegacyFinalizedBy = false
  if (examSnap.exists()) {
    const rawData = examSnap.data()
    info = rawData as ExamInfo
    if ('finalizedBy' in rawData && rawData.finalizedBy) {
      hasLegacyFinalizedBy = true
    }
  }

  let config: ExamPrivateConfig | null = null
  if (configSnap.exists()) {
    config = configSnap.data() as ExamPrivateConfig
  }

  return { info, config, hasLegacyFinalizedBy }
}

/**
 * 시험 운영 설정 저장 및 상태 변경
 */
export async function saveExamOperation(
  params: SaveOperationParams,
  user: User,
): Promise<void> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')

  const {
    examId,
    examDate,
    startAt,
    durationMinutes,
    bufferMinutes,
    accessCode,
    newStatus,
  } = params

  const examPath = `exams/${examId}`
  const configPath = `exams/${examId}/private/config`

  const examRef = doc(db, 'exams', examId)
  const configRef = doc(db, 'exams', examId, 'private', 'config')

  // 마감 시각 계산: startAt + (durationMinutes + bufferMinutes)
  const totalLimitMs = (durationMinutes + bufferMinutes) * 60 * 1000
  const closeAtDate = new Date(startAt.getTime() + totalLimitMs)
  const closeAtTimestamp = Timestamp.fromDate(closeAtDate)
  const startAtTimestamp = Timestamp.fromDate(startAt)

  // 1. exams/{examId} 공개 문서 업데이트
  // (만약 기존 문서에 finalizedBy가 남아있다면 deleteField()로 제거)
  const infoUpdate: Record<string, unknown> = {
    examDate,
    startAt: startAtTimestamp,
    durationMinutes,
    bufferMinutes,
    closeAt: closeAtTimestamp,
    updatedAt: serverTimestamp(),
  }

  if (newStatus) {
    infoUpdate.status = newStatus
  }

  // finalizedBy 제거 시도 (구조 이전)
  infoUpdate.finalizedBy = deleteField()

  try {
    await updateDoc(examRef, infoUpdate)
  } catch {
    // updateDoc이 실패하면 setDoc fallback 시도
    try {
      delete infoUpdate.finalizedBy
      await setDoc(examRef, infoUpdate, { merge: true })
    } catch (setErr) {
      throw new Error(
        `[${examPath}] 저장 실패: ${setErr instanceof Error ? setErr.message : String(setErr)}`,
      )
    }
  }

  // 2. exams/{examId}/private/config 비공개 문서 업데이트
  const configUpdate: Partial<ExamPrivateConfig> = {
    accessCode: accessCode.trim().toUpperCase(),
    updatedBy: user.email?.toLowerCase() || '',
    updatedAt: serverTimestamp(),
  }

  try {
    await setDoc(configRef, configUpdate, { merge: true })
  } catch (configErr) {
    throw new Error(
      `[${configPath}] 저장 실패: ${configErr instanceof Error ? configErr.message : String(configErr)}`,
    )
  }
}

/**
 * 기존 3-2단계 시험 데이터의 finalizedBy를 private/config로 마이그레이션
 */
export async function migrateLegacyExamData(
  examId: string,
  user: User,
): Promise<{ migratedEmail: string }> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')

  const examPath = `exams/${examId}`
  const configPath = `exams/${examId}/private/config`

  const examRef = doc(db, 'exams', examId)
  const configRef = doc(db, 'exams', examId, 'private', 'config')

  let examSnap
  try {
    examSnap = await getDoc(examRef)
  } catch (err) {
    throw new Error(`[${examPath}] 읽기 실패: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (!examSnap.exists()) {
    throw new Error(`[${examPath}] 대상 시험 문서를 찾을 수 없습니다.`)
  }

  const rawData = examSnap.data()
  const legacyFinalizedBy = (rawData.finalizedBy as string) || user.email || ''

  // 1. private/config에 finalizedBy 저장
  try {
    await setDoc(
      configRef,
      {
        finalizedBy: legacyFinalizedBy.toLowerCase(),
        updatedBy: user.email?.toLowerCase() || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (err) {
    throw new Error(
      `[${configPath}] 비공개 설정 저장 실패: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // 2. exams/{examId}에서 finalizedBy 필드 삭제
  try {
    await updateDoc(examRef, {
      finalizedBy: deleteField(),
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    throw new Error(
      `[${examPath}] finalizedBy 필드 삭제 실패: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  return { migratedEmail: legacyFinalizedBy }
}

/**
 * 시험 상태만 즉시 전환 (열기 / 닫기)
 */
export async function updateExamStatus(
  examId: string,
  newStatus: 'ready' | 'open' | 'closed',
  user: User,
): Promise<void> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')

  const examPath = `exams/${examId}`
  const configPath = `exams/${examId}/private/config`

  const examRef = doc(db, 'exams', examId)
  const configRef = doc(db, 'exams', examId, 'private', 'config')

  try {
    await setDoc(
      examRef,
      {
        status: newStatus,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (err) {
    throw new Error(
      `[${examPath}] 상태 변경 실패: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  try {
    await setDoc(
      configRef,
      {
        updatedBy: user.email?.toLowerCase() || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (err) {
    throw new Error(
      `[${configPath}] 비공개 상태 기록 실패: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}

/**
 * [관리자 전용] 시험 응시 기록 초기화 (리셋)
 * 1. Apps Script 호출 -> [응시결과] 시트에서 해당 시험 행 전체 삭제
 * 2. Firestore -> exams/{examId}/sessions 및 exams/{examId}/submissions 문서 일괄 삭제
 */
export interface ResetExamSubmissionsResult {
  deletedSheetRows: number
  deletedSessions: number
  deletedSubmissions: number
  sheetError: string | null
}

export async function resetExamSubmissions(
  examId: string,
  user: User,
): Promise<ResetExamSubmissionsResult> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')
  const gasUrl = import.meta.env.VITE_GAS_URL as string | undefined

  // 1. Apps Script 응시결과 시트 행을 [삭제기록] 탭으로 이동 후 삭제
  let deletedSheetRows = 0
  let gasError: string | null = null
  if (gasUrl) {
    const idToken = await user.getIdToken()
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'resetSubmissions',
          idToken,
          examId,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          deletedSheetRows = json.deletedCount || 0
        } else {
          gasError = json.error || 'Apps Script 처리 오류'
        }
      } else {
        gasError = `Apps Script HTTP 오류 (${res.status})`
      }
    } catch (e) {
      gasError = e instanceof Error ? e.message : String(e)
    }
  }

  // 2. Firestore sessions 하위 컬렉션 및 각 학생의 proctorLogs 하위 문서 일괄 삭제
  const sessionsCol = collection(db, 'exams', examId, 'sessions')
  const sessionsSnap = await getDocs(sessionsCol)
  if (sessionsSnap.docs.length > 0) {
    const batch1 = writeBatch(db)
    for (const sDoc of sessionsSnap.docs) {
      // 학생별 proctorLogs 하위 컬렉션 문서 삭제
      const proctorCol = collection(db, 'exams', examId, 'sessions', sDoc.id, 'proctorLogs')
      const proctorSnap = await getDocs(proctorCol)
      proctorSnap.docs.forEach((pDoc) => batch1.delete(pDoc.ref))
      // 세션 문서 삭제
      batch1.delete(sDoc.ref)
    }
    await batch1.commit()
  }

  // 3. Firestore submissions 하위 컬렉션 삭제
  const submissionsCol = collection(db, 'exams', examId, 'submissions')
  const submissionsSnap = await getDocs(submissionsCol)
  if (submissionsSnap.docs.length > 0) {
    const batch2 = writeBatch(db)
    submissionsSnap.docs.forEach((d) => batch2.delete(d.ref))
    await batch2.commit()
  }

  return {
    deletedSheetRows,
    deletedSessions: sessionsSnap.docs.length,
    deletedSubmissions: submissionsSnap.docs.length,
    sheetError: gasError,
  }
}

/**
 * [관리자 전용] 특정 학생 1명의 응시 기록 개별 초기화 (리셋)
 * 1. Apps Script 호출 -> [응시결과] 시트에서 해당 학생 행을 [삭제기록] 탭으로 이동
 * 2. Firestore -> 해당 학생의 submissions/{uid}, sessions/{uid}/proctorLogs 전체, sessions/{uid} 문서 삭제
 */
export async function resetStudentExamSubmission(
  examId: string,
  uid: string,
  user: User,
): Promise<{ success: boolean; sheetError: string | null }> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')
  const gasUrl = import.meta.env.VITE_GAS_URL as string | undefined
  let gasError: string | null = null

  // 1. Apps Script 시트 행 이동
  if (gasUrl) {
    const idToken = await user.getIdToken()
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'resetSubmissions',
          idToken,
          examId,
          uid,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        if (!json.success) gasError = json.error || 'Apps Script 처리 오류'
      } else {
        gasError = `Apps Script HTTP 오류 (${res.status})`
      }
    } catch (e) {
      gasError = e instanceof Error ? e.message : String(e)
    }
  }

  // 2. Firestore 접수 확인 문서 및 세션 + proctorLogs 삭제
  const batch = writeBatch(db)
  const subRef = doc(db, 'exams', examId, 'submissions', uid)
  batch.delete(subRef)

  const proctorCol = collection(db, 'exams', examId, 'sessions', uid, 'proctorLogs')
  const proctorSnap = await getDocs(proctorCol)
  proctorSnap.docs.forEach((pDoc) => batch.delete(pDoc.ref))

  const sessionRef = doc(db, 'exams', examId, 'sessions', uid)
  batch.delete(sessionRef)

  await batch.commit()

  return { success: true, sheetError: gasError }
}
