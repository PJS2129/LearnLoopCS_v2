import type { ExamPackage } from './types'

const STORAGE_KEY = 'learnloop_admin_exam_draft_v1'

export function loadExamDraft(): ExamPackage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ExamPackage
    if (parsed && Array.isArray(parsed.questions)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function saveExamDraft(draft: ExamPackage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch (err) {
    console.error('Failed to save exam draft to localStorage', err)
  }
}

export function clearExamDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear exam draft from localStorage', err)
  }
}
