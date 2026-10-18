import type { User } from 'firebase/auth'

export interface PublishedExamOption {
  examId: string
  examName: string
  publishedAt: string | null
}

export interface ResultScope {
  totalScore: boolean
  domains: boolean
  questionCorrectness: boolean
  explanations: boolean
}

export interface DomainResult {
  area: string
  achievement: number
}

export interface QuestionResult {
  no: number
  correct: boolean
  unanswered: boolean
  explanation?: string
}

export interface StudentExamResult {
  examId: string
  examName: string
  submittedAt: string
  scope: ResultScope
  totalScore?: number
  domains?: DomainResult[]
  questions?: QuestionResult[]
}

interface ResultApiResponse<T> {
  success?: boolean
  code?: string
  error?: string
  exams?: PublishedExamOption[]
  result?: T
}

export class ResultApiError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ResultApiError'
    this.code = code
  }
}

async function callResultApi<T>(
  user: User,
  body: Record<string, unknown>,
): Promise<ResultApiResponse<T>> {
  const gasUrl = import.meta.env.VITE_GAS_URL as string | undefined
  if (!gasUrl) throw new ResultApiError('VITE_GAS_URL 환경 변수가 설정되지 않았습니다.')

  const idToken = await user.getIdToken()
  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, idToken }),
  })
  if (!response.ok) throw new ResultApiError(`결과 조회 서버 응답 오류 (HTTP ${response.status})`)

  const result = (await response.json()) as ResultApiResponse<T>
  if (!result.success) throw new ResultApiError(result.error || '결과를 불러오지 못했습니다.', result.code)
  return result
}

export async function fetchMyPublishedExams(user: User): Promise<PublishedExamOption[]> {
  const response = await callResultApi<never>(user, { action: 'listMyPublishedExams' })
  return response.exams ?? []
}

export async function fetchMyExamResult(user: User, examId: string): Promise<StudentExamResult> {
  const response = await callResultApi<StudentExamResult>(user, { action: 'getMyExamResult', examId })
  if (!response.result) throw new ResultApiError('본인의 시험 결과가 응답에 없습니다.')
  return response.result
}
