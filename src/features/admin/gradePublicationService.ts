import type { User } from 'firebase/auth'

export interface GradePublicationScope {
  totalScore: boolean
  domains: boolean
  questionCorrectness: boolean
  explanations: boolean
}

export interface GradePublicationSetting {
  examId: string
  examName: string
  published: boolean
  scope: GradePublicationScope
  publishedAt: string | null
  publishedBy: string | null
  cancelledAt: string | null
  cancelledBy: string | null
}

interface GasResponse {
  success?: boolean
  setting?: GradePublicationSetting
  error?: string
}

async function callPublicationApi(
  user: User,
  body: Record<string, unknown>,
): Promise<GradePublicationSetting> {
  const gasUrl = import.meta.env.VITE_GAS_URL as string | undefined
  if (!gasUrl) throw new Error('VITE_GAS_URL 환경 변수가 설정되지 않았습니다.')

  const idToken = await user.getIdToken()
  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, idToken }),
  })
  if (!response.ok) throw new Error(`성적 공개 서버 응답 오류 (HTTP ${response.status})`)

  const result = (await response.json()) as GasResponse
  if (!result.success || !result.setting) {
    throw new Error(result.error || '성적 공개 설정을 처리하지 못했습니다.')
  }
  return result.setting
}

export function fetchGradePublicationSetting(user: User, examId: string) {
  return callPublicationApi(user, { action: 'getGradePublicationSettings', examId })
}

export function publishGradeSetting(
  user: User,
  examId: string,
  examName: string,
  scope: GradePublicationScope,
) {
  return callPublicationApi(user, { action: 'publishGrades', examId, examName, scope })
}

export function cancelGradeSetting(user: User, examId: string) {
  return callPublicationApi(user, { action: 'cancelGradePublication', examId })
}
