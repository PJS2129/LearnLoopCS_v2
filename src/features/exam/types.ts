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
  | 'error' // 오류 발생 (권한, 네트워크, 문서 없음 등)

export type ExamErrorKind = 'permission' | 'network' | 'not_found' | 'unknown'

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

export interface ExamSubmissionPayload {
  action: 'submitExam'
  idToken: string
  examId: string
  answers: UserAnswers
  submitType: 'manual' | 'auto'
}

export interface ExamSubmissionResponse {
  success: boolean
  receiptId?: string
  submittedAt?: string
  error?: string
  message?: string
}

export interface ExamReceiptData {
  examId: string
  receiptId: string
  submittedAt: string
  submitType?: string
}

// 6단계 보조 장치 (Proctoring) 타입
export type ProctorEventType = 'tab_blur' | 'face_out' | 'multiple_faces'

export interface ProctorLogEntry {
  id: string
  type: ProctorEventType
  startAt: string
  endAt: string
  durationSeconds: number
  detail: string
  createdAt?: unknown
}

export interface ProctorSummary {
  tabBlurCount: number
  tabBlurDuration: number
  faceOutCount: number
  faceOutDuration: number
  multipleFacesCount: number
  cameraUsed: boolean
  lastProctorAt?: unknown
}

