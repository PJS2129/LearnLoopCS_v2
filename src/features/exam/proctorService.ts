import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { ProctorEventType, ProctorLogEntry, ProctorSummary } from './types'

/**
 * 개별 보조 기록(이탈/다수인원) 생성 및 세션 요약 필드 안전 갱신
 * - Firestore 저장이 실패해도 학생 시험을 중단시키지 않음 (try-catch 방어)
 */
export async function recordProctorEvent(params: {
  examId: string
  uid: string
  type: ProctorEventType
  startAt: string
  endAt: string
  durationSeconds: number
  detail: string
  cameraUsed?: boolean
}): Promise<void> {
  if (!db) {
    console.warn('[proctorService] Firestore가 초기화되지 않았습니다.')
    return
  }

  const { examId, uid, type, startAt, endAt, durationSeconds, detail, cameraUsed } = params
  const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const logRef = doc(db, 'exams', examId, 'sessions', uid, 'proctorLogs', logId)
  const sessionRef = doc(db, 'exams', examId, 'sessions', uid)

  try {
    // 1. 개별 로그 문서 생성
    await setDoc(logRef, {
      id: logId,
      type,
      startAt,
      endAt,
      durationSeconds: Math.max(0, Math.round(durationSeconds)),
      detail,
      createdAt: serverTimestamp(),
    })

    // 2. 세션 문서 요약 필드 단조 증가 갱신
    const updatePayload: Record<string, unknown> = {
      lastProctorAt: serverTimestamp(),
    }

    if (type === 'tab_blur') {
      updatePayload.tabBlurCount = increment(1)
      updatePayload.tabBlurDuration = increment(Math.max(0, Math.round(durationSeconds)))
    } else if (type === 'face_out') {
      updatePayload.faceOutCount = increment(1)
      updatePayload.faceOutDuration = increment(Math.max(0, Math.round(durationSeconds)))
    } else if (type === 'multiple_faces') {
      updatePayload.multipleFacesCount = increment(1)
    }

    if (cameraUsed !== undefined) {
      updatePayload.cameraUsed = cameraUsed
    }

    await updateDoc(sessionRef, updatePayload)
  } catch (err) {
    // 저장 실패해도 학생 응시 진행/제출은 절대 방해받지 않음
    console.warn('[proctorService] 보조 기록 저장 실패 (무시 후 계속 진행):', err)
  }
}

/**
 * 세션 문서의 현재 보조 요약 필드 조회
 */
export async function fetchProctorSummary(
  examId: string,
  uid: string,
): Promise<ProctorSummary | null> {
  if (!db) return null
  try {
    const sessionRef = doc(db, 'exams', examId, 'sessions', uid)
    const snap = await getDoc(sessionRef)
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      tabBlurCount: data.tabBlurCount || 0,
      tabBlurDuration: data.tabBlurDuration || 0,
      faceOutCount: data.faceOutCount || 0,
      faceOutDuration: data.faceOutDuration || 0,
      multipleFacesCount: data.multipleFacesCount || 0,
      cameraUsed: Boolean(data.cameraUsed),
      lastProctorAt: data.lastProctorAt,
    }
  } catch (err) {
    console.warn('[proctorService] 요약 조회 실패:', err)
    return null
  }
}

/**
 * 학생별 전체 상세 이탈 로그 조회 (관리자용, 시각순)
 */
export async function fetchProctorLogs(
  examId: string,
  uid: string,
): Promise<ProctorLogEntry[]> {
  if (!db) return []
  try {
    const logsCol = collection(db, 'exams', examId, 'sessions', uid, 'proctorLogs')
    const q = query(logsCol, orderBy('createdAt', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as ProctorLogEntry)
  } catch (err) {
    console.warn('[proctorService] 로그 목록 조회 실패:', err)
    return []
  }
}
