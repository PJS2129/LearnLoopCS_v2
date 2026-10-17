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

// Firestore exams/{examId} 메타데이터 문서
export interface ExamInfo {
  examId: string
  examName: string
  status: 'finalized' | 'ready' | 'open' | 'closed'
  questionCount: number
  domainCounts: Record<string, number>
  finalizedAt: unknown // Timestamp
  finalizedBy: string
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
