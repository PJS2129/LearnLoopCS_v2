import type { ExamReceiptData, FlaggedMap, UserAnswers } from './types'

function getStorageKey(examId: string, uid: string, type: 'answers' | 'flags' | 'receipt' | 'pending'): string {
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

export function savePendingSubmission(examId: string, uid: string, answers: UserAnswers): void {
  try {
    localStorage.setItem(getStorageKey(examId, uid, 'pending'), JSON.stringify(answers))
  } catch {
    // 무시
  }
}

export function loadPendingSubmission(examId: string, uid: string): UserAnswers | null {
  try {
    const raw = localStorage.getItem(getStorageKey(examId, uid, 'pending'))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearPendingSubmission(examId: string, uid: string): void {
  try {
    localStorage.removeItem(getStorageKey(examId, uid, 'pending'))
  } catch {
    // 무시
  }
}

export function saveReceipt(examId: string, uid: string, receipt: ExamReceiptData): void {
  try {
    localStorage.setItem(getStorageKey(examId, uid, 'receipt'), JSON.stringify(receipt))
  } catch {
    // 무시
  }
}

export function loadReceipt(examId: string, uid: string): ExamReceiptData | null {
  try {
    const raw = localStorage.getItem(getStorageKey(examId, uid, 'receipt'))
    if (raw) {
      return JSON.parse(raw) as ExamReceiptData
    }
    // 4-1 단계 구버전 키 호환 (exam_{examId}_{uid}_submission)
    const legacy = localStorage.getItem(`exam_${examId}_${uid}_submission`)
    if (legacy) {
      return {
        examId,
        receiptId: `REC-${examId}-${uid.substring(0, 8)}`,
        submittedAt: legacy,
      }
    }
    return null
  } catch {
    return null
  }
}

// 하위 호환용 헬퍼
export function saveSubmission(examId: string, uid: string, submittedAt: string): void {
  saveReceipt(examId, uid, {
    examId,
    receiptId: `REC-${examId}`,
    submittedAt,
  })
}

export function loadSubmission(examId: string, uid: string): string | null {
  const receipt = loadReceipt(examId, uid)
  return receipt ? receipt.submittedAt : null
}

export function clearStoredExamData(examId: string, uid: string): void {
  try {
    localStorage.removeItem(getStorageKey(examId, uid, 'answers'))
    localStorage.removeItem(getStorageKey(examId, uid, 'flags'))
    localStorage.removeItem(getStorageKey(examId, uid, 'receipt'))
    localStorage.removeItem(getStorageKey(examId, uid, 'pending'))
    localStorage.removeItem(`exam_${examId}_${uid}_submission`)
  } catch {
    // 무시
  }
}

