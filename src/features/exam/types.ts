import type { StudentExamQuestion, ExamInfo, ExamSession } from '../admin/types'

export type { StudentExamQuestion, ExamInfo, ExamSession }

export type ExamTabState =
  | 'loading' // 시험 상태 확인 중
  | 'locked' // 시험 준비 중 (열리지 않음)
  | 'closed' // 시험 종료됨
  | 'code_entry' // 시험 코드 입력
  | 'consent' // 응시 안내 및 서약 동의
  | 'paper' // 시험지 풀이 중
  | 'expired' // 응시 시간 종료
  | 'submitted' // 제출 완료 (4-2단계)

export type UserAnswers = Record<number, number> // [문항번호(1~40)]: 선택지(1~4)
export type FlaggedMap = Record<number, boolean> // [문항번호(1~40)]: 깃발 여부

export interface ExamTimerState {
  totalSeconds: number
  minutes: number
  seconds: number
  formattedTime: string
  isWarning5Min: boolean
  isWarning1Min: boolean
  isExpired: boolean
}
