// 02-2 AI 협업 출제 프롬프트의 exam.json 형식과 정확히 일치하는 문항 객체
export interface ExamQuestion {
  no: number
  domain: string
  level: string // '상' | '중' | '하'
  question: string
  choices: string[] // 4개 선택지
  answer: number // 1 ~ 4
  concept: string
  source: string
  explanation: string
  review?: boolean
}

export interface ExamPackage {
  exam: string
  domains: string[]
  questions: ExamQuestion[]
}

// Firestore에 저장되는 학생용 문항 (정답, 해설, 핵심개념, 출처근거 제외)
export interface StudentExamQuestion {
  no: number
  domain: string
  level: string
  question: string
  choices: string[]
}

// Firestore exams/{examId} 공개 메타데이터 문서 (학생 및 관리자 읽기 가능, 관리자 이메일 제외)
export interface ExamInfo {
  examId: string
  examName: string
  status: 'finalized' | 'ready' | 'open' | 'closed'
  questionCount: number
  domainCounts: Record<string, number>
  finalizedAt: unknown // Timestamp
  examDate?: string // 예: '2026.4.22.(수) 11:30'
  startAt?: unknown // Timestamp
  durationMinutes?: number // 기본 50
  bufferMinutes?: number // 여유시간 (기본 10)
  closeAt?: unknown // Timestamp (startAt + duration + buffer)
  updatedAt?: unknown // Timestamp
}

// Firestore exams/{examId}/private/config 문서 (관리자만 읽고 쓰기 가능)
export interface ExamPrivateConfig {
  accessCode: string
  finalizedBy: string
  updatedBy?: string
  updatedAt?: unknown
}

// Firestore exams/{examId}/sessions/{uid} 문서 (학생 본인 생성/조회)
export interface ExamSession {
  uid: string
  studentId: string
  name: string
  section: string
  enteredCode: string
  enteredAt: unknown // Timestamp (request.time)
  individualEndAt?: unknown // Timestamp (A안: min(enteredAt + duration, closeAt) 유도값)
}

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  severity: ValidationSeverity
  no?: number // 대상 문항 번호
  field?: string
  message: string
}

export interface ValidationSummary {
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  isValid: boolean // error가 0건이면 true
}

export interface DomainStat {
  domain: string
  count: number
}

export interface LevelStat {
  level: string
  count: number
}

export interface AnswerDistribution {
  answer: number
  count: number
  ratio: number // %
}
