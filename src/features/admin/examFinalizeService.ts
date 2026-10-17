import type { User } from 'firebase/auth'
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { ExamPackage, StudentExamQuestion } from './types'

export interface FinalizeResult {
  examId: string
  examName: string
  questionCount: number
  finalizedAt: string
  finalizedBy: string
}

export interface LatestExamStatus {
  examId: string
  examName: string
  status: string
  questionCount: number
  domainCounts: Record<string, number>
  finalizedAt: string | null
  finalizedBy: string
}

/**
 * 문항 확정 2단계 저장 서비스:
 * 1. Apps Script Web App 호출 -> Google Sheet [정답표] 탭에 정답·해설 포함 저장
 * 2. Firestore -> exams/{examId} (시험 정보) 및 exams/{examId}/questions/{no} (학생용 문항만) 분리 저장
 */
export async function finalizeExamPackage(
  examId: string,
  pkg: ExamPackage,
  user: User,
): Promise<FinalizeResult> {
  const gasUrl = import.meta.env.VITE_GAS_URL as string | undefined

  if (!gasUrl || gasUrl.trim() === '') {
    throw new Error(
      'VITE_GAS_URL 환경 변수가 설정되지 않았습니다. .env.local 파일 및 docs/setup-apps-script.md를 확인해 주세요.',
    )
  }

  if (!db) {
    throw new Error('Firebase Firestore 연결이 초기화되지 않았습니다.')
  }

  // 1. Firebase Auth ID 토큰 획득
  const idToken = await user.getIdToken()

  // 2. Apps Script로 정답표 전송 (CORS 사전 요청을 피하기 위해 text/plain 사용)
  const gasPayload = {
    action: 'finalizeExam',
    idToken,
    examId,
    examPackage: pkg,
  }

  let gasResponse: Response
  try {
    gasResponse = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(gasPayload),
    })
  } catch (netErr) {
    throw new Error(
      `Apps Script 웹 앱 통신 실패: ${netErr instanceof Error ? netErr.message : String(netErr)}`,
    )
  }

  if (!gasResponse.ok) {
    throw new Error(
      `Apps Script HTTP 오류: ${gasResponse.status} ${gasResponse.statusText}`,
    )
  }

  const gasJson = (await gasResponse.json()) as {
    success: boolean
    error?: string
    message?: string
    finalizedAt?: string
    finalizedBy?: string
  }

  if (!gasJson.success) {
    throw new Error(gasJson.error || '구글 시트 정답표 저장에 실패했습니다.')
  }

  // 3. Firestore 저장 (정답표 저장이 성공한 경우에만 실행)
  // 3-1. 영역별 문항 수 집계
  const domainCounts: Record<string, number> = {}
  for (const q of pkg.questions) {
    domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1
  }

  // 3-2. 시험 정보 문서 (exams/{examId})
  const examRef = doc(db, 'exams', examId)
  await setDoc(examRef, {
    examId,
    examName: pkg.exam,
    status: 'finalized',
    questionCount: pkg.questions.length,
    domainCounts,
    finalizedAt: serverTimestamp(),
    finalizedBy: user.email?.toLowerCase() || '',
  })

  // 3-3. 학생용 문항 하위 컬렉션 (exams/{examId}/questions/{no})
  // studentQuestion에는 no, domain, level, question, choices만 포함 (정답, 해설, 개념, 출처 제외)
  const batch = writeBatch(db)

  for (const q of pkg.questions) {
    const qDocRef = doc(db, 'exams', examId, 'questions', String(q.no))
    const studentQuestion: StudentExamQuestion = {
      no: q.no,
      domain: q.domain,
      level: q.level,
      question: q.question,
      choices: q.choices,
    }
    batch.set(qDocRef, studentQuestion)
  }

  await batch.commit()

  return {
    examId,
    examName: pkg.exam,
    questionCount: pkg.questions.length,
    finalizedAt: gasJson.finalizedAt || new Date().toISOString(),
    finalizedBy: gasJson.finalizedBy || user.email || '',
  }
}

/**
 * 최근 확정된 시험 상태 조회 (있으면 화면 상단에 배지 표시)
 */
export async function fetchLatestExamStatus(): Promise<LatestExamStatus | null> {
  if (!db) return null

  try {
    const q = query(collection(db, 'exams'), orderBy('finalizedAt', 'desc'), limit(1))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const docData = snapshot.docs[0].data()
    const finalizedAtDate = docData.finalizedAt?.toDate
      ? docData.finalizedAt.toDate().toISOString()
      : null

    return {
      examId: docData.examId,
      examName: docData.examName,
      status: docData.status,
      questionCount: docData.questionCount,
      domainCounts: docData.domainCounts || {},
      finalizedAt: finalizedAtDate,
      finalizedBy: docData.finalizedBy || '',
    }
  } catch (err) {
    console.warn('최근 확정 시험 상태 조회 실패 (무시 가능):', err)
    return null
  }
}
