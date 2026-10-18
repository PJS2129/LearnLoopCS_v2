import type { User } from 'firebase/auth'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { fetchExamQuestions } from '../exam/examService'
import type { ExamInfo, StudentExamQuestion } from './types'

export async function fetchPreviewExams(): Promise<ExamInfo[]> {
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.')

  const examQuery = query(collection(db, 'exams'), orderBy('finalizedAt', 'desc'))
  const snapshot = await getDocs(examQuery)
  return snapshot.docs.map((examDoc) => examDoc.data() as ExamInfo)
}

export async function fetchPreviewQuestions(
  examId: string,
): Promise<StudentExamQuestion[]> {
  return fetchExamQuestions(examId)
}

export async function fetchPreviewAnswerKey(
  examId: string,
  user: User,
): Promise<Record<number, number>> {
  const gasUrl = import.meta.env.VITE_GAS_URL as string | undefined
  if (!gasUrl) {
    throw new Error('VITE_GAS_URL 환경 변수가 설정되지 않았습니다.')
  }

  const idToken = await user.getIdToken()
  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'getPreviewAnswerKey',
      idToken,
      examId,
    }),
  })

  if (!response.ok) {
    throw new Error(`정답 조회 서버 응답 오류 (HTTP ${response.status})`)
  }

  const result = (await response.json()) as {
    success?: boolean
    answers?: Record<string, number>
    error?: string
  }

  if (!result.success || !result.answers) {
    throw new Error(result.error || '미리보기 정답을 불러오지 못했습니다.')
  }

  const answers: Record<number, number> = {}
  for (const [questionNo, answer] of Object.entries(result.answers)) {
    const no = Number(questionNo)
    if (Number.isInteger(no) && Number.isInteger(answer) && answer >= 1 && answer <= 4) {
      answers[no] = answer
    }
  }
  return answers
}
