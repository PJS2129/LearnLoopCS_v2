import type { User } from 'firebase/auth'

export interface AnalyticsSummary {
  candidateCount: number
  averageScore: number
  standardDeviation: number
  variance: number
  highestScore: number
  lowestScore: number
  averageCorrectRate: number
  difficulty: '쉬움' | '적절' | '어려움'
}

export interface SectionAverage {
  section: string
  average: number
}

export interface DomainAnalytics {
  domain: string
  average: number
  sections: SectionAverage[]
}

export interface TopWrongQuestion {
  no: number
  domain: string
  concept: string
  correctRate: number
  mostWrongChoice: number | null
  mostWrongRate: number
}

export interface DistributionBin {
  label: string
  count: number
}

export interface DifficultyThresholds {
  EASY_MIN: number
  APPROPRIATE_MIN: number
}

export interface StudentDomainResult {
  domain: string
  achievement: number
}

export interface AnalyticsStudent {
  studentId: string
  name: string
  section: string
  totalScore: number
  domains: StudentDomainResult[]
  submitType: string
  cameraExitCount: number | string
}

export interface ExamAnalyticsData {
  examId: string
  generatedAt: string
  summary: AnalyticsSummary
  difficultyThresholds: {
    exam: DifficultyThresholds
    question: DifficultyThresholds
  }
  scoreDistribution: DistributionBin[]
  questionDifficultyDistribution: {
    easy: number
    appropriate: number
    hard: number
  }
  sections: string[]
  domains: DomainAnalytics[]
  topWrongQuestions: TopWrongQuestion[]
  smallSampleCaution: boolean
  students: AnalyticsStudent[]
}

export interface ExamAnalysisSummary {
  examId: string
  summaryText: string
  documentUrl: string
  documentId: string
  reviewConfirmed: boolean
  updatedAt: string | null
  updatedBy: string | null
}

interface AnalyticsApiResponse {
  success?: boolean
  analytics?: ExamAnalyticsData
  summary?: ExamAnalysisSummary | null
  error?: string
}

async function callAnalyticsApi(
  user: User,
  body: Record<string, unknown>,
): Promise<AnalyticsApiResponse> {
  const gasUrl = import.meta.env.VITE_GAS_URL as string | undefined
  if (!gasUrl) throw new Error('VITE_GAS_URL 환경 변수가 설정되지 않았습니다.')

  const idToken = await user.getIdToken()
  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, idToken }),
  })
  if (!response.ok) throw new Error(`성적 분석 서버 응답 오류 (HTTP ${response.status})`)

  const result = (await response.json()) as AnalyticsApiResponse
  if (!result.success) throw new Error(result.error || '성적 분석 요청을 처리하지 못했습니다.')
  return result
}

export async function fetchExamAnalytics(user: User, examId: string): Promise<ExamAnalyticsData> {
  const result = await callAnalyticsApi(user, { action: 'getExamAnalytics', examId })
  if (!result.analytics) throw new Error('성적 분석 데이터가 응답에 없습니다.')
  return result.analytics
}

export async function fetchExamAnalysisSummary(
  user: User,
  examId: string,
): Promise<ExamAnalysisSummary | null> {
  const result = await callAnalyticsApi(user, { action: 'getExamAnalysisSummary', examId })
  return result.summary ?? null
}

export async function saveExamAnalysisSummary(
  user: User,
  examId: string,
  summaryText: string,
  documentUrl: string,
  reviewConfirmed: boolean,
): Promise<ExamAnalysisSummary> {
  const result = await callAnalyticsApi(user, {
    action: 'saveExamAnalysisSummary',
    examId,
    summaryText,
    documentUrl,
    reviewConfirmed,
  })
  if (!result.summary) throw new Error('저장된 분석 요약이 응답에 없습니다.')
  return result.summary
}

export async function deleteExamAnalysisSummary(user: User, examId: string): Promise<void> {
  await callAnalyticsApi(user, { action: 'deleteExamAnalysisSummary', examId })
}
