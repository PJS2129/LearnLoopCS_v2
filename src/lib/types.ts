export interface StudentProfile {
  studentId: string // 문자열로 저장 (앞자리 0 유지)
  name: string
  section: string
  email: string
}

export interface LearningTab {
  id: string
  name: string
  area: string
  type: 'simulator' | 'cards'
  src: string
}

export interface ConceptCard {
  id: string
  concept: string
  summary: string
  example: string
  reference: string
}

export interface PracticeQuiz {
  id: string
  cardId?: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
  tip?: string
}

export interface ConceptQuizContent {
  version: number
  area: string
  title: string
  cards: ConceptCard[]
  quizzes: PracticeQuiz[]
}

export interface QuizAttemptInfo {
  firstCorrect: boolean
  totalAttempts: number
}

export interface LearningSummary {
  timeByTab: Record<string, number> // 탭 id -> 초 단위 체류 시간
  quizzes: Record<string, QuizAttemptInfo> // quizId -> 시도 집계
  totalFirstAttempts: number
  correctFirstAttempts: number
  updatedAt?: unknown
}

export interface LearningLog {
  id?: string
  tabId: string
  tabName: string
  activity: string
  detail: string
  duration: number
  timestamp?: unknown
}

