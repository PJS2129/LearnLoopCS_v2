import type { FlaggedMap, UserAnswers } from './types'

function getStorageKey(examId: string, uid: string, type: 'answers' | 'flags'): string {
  return `exam_${examId}_${uid}_${type}`
}

export function loadStoredAnswers(examId: string, uid: string): UserAnswers {
  try {
    const raw = localStorage.getItem(getStorageKey(examId, uid, 'answers'))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveStoredAnswers(examId: string, uid: string, answers: UserAnswers): void {
  try {
    localStorage.setItem(getStorageKey(examId, uid, 'answers'), JSON.stringify(answers))
  } catch {
    // 저장 실패 무시
  }
}

export function loadStoredFlags(examId: string, uid: string): FlaggedMap {
  try {
    const raw = localStorage.getItem(getStorageKey(examId, uid, 'flags'))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveStoredFlags(examId: string, uid: string, flags: FlaggedMap): void {
  try {
    localStorage.setItem(getStorageKey(examId, uid, 'flags'), JSON.stringify(flags))
  } catch {
    // 저장 실패 무시
  }
}

export function saveSubmission(examId: string, uid: string, submittedAt: string): void {
  try {
    localStorage.setItem(`exam_${examId}_${uid}_submission`, submittedAt)
  } catch {
    // 무시
  }
}

export function loadSubmission(examId: string, uid: string): string | null {
  try {
    return localStorage.getItem(`exam_${examId}_${uid}_submission`)
  } catch {
    return null
  }
}

export function clearStoredExamData(examId: string, uid: string): void {
  try {
    localStorage.removeItem(getStorageKey(examId, uid, 'answers'))
    localStorage.removeItem(getStorageKey(examId, uid, 'flags'))
    localStorage.removeItem(`exam_${examId}_${uid}_submission`)
  } catch {
    // 무시
  }
}
