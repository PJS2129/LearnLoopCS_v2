import type {
  AnswerDistribution,
  DomainStat,
  ExamQuestion,
  LevelStat,
  ValidationIssue,
  ValidationSummary,
} from './types'

export const STANDARD_DOMAINS = [
  '기초 ICT',
  '하드웨어·CPU',
  '데이터 표현',
  '논리회로',
  '자료구조·알고리즘',
] as const

export const STANDARD_LEVELS = ['상', '중', '하'] as const

export const TARGET_QUESTION_COUNT = 40

export function validateExamQuestions(
  questions: ExamQuestion[],
  targetCount = TARGET_QUESTION_COUNT,
): ValidationSummary {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  // 1. 총 문항 수 검사 (경고)
  if (questions.length !== targetCount) {
    warnings.push({
      severity: 'warning',
      message: `총 문항 수가 목표(${targetCount}문항)와 일치하지 않습니다 (현재 ${questions.length}문항).`,
    })
  }

  // 2. 문항 번호(no) 중복 검사
  const noCounts = new Map<number, number>()
  questions.forEach((q) => {
    if (typeof q.no === 'number') {
      noCounts.set(q.no, (noCounts.get(q.no) ?? 0) + 1)
    }
  })
  noCounts.forEach((count, no) => {
    if (count > 1) {
      errors.push({
        severity: 'error',
        no,
        field: 'no',
        message: `문항 번호 [${no}]번이 ${count}회 중복되었습니다.`,
      })
    }
  })

  // 3. 핵심 개념(concept) 중복 검사 (경고)
  const conceptMap = new Map<string, number[]>()
  questions.forEach((q) => {
    const trimmed = (q.concept ?? '').trim()
    if (trimmed) {
      const list = conceptMap.get(trimmed) ?? []
      list.push(q.no)
      conceptMap.set(trimmed, list)
    }
  })
  conceptMap.forEach((qNos, concept) => {
    if (qNos.length > 1) {
      warnings.push({
        severity: 'warning',
        message: `핵심 개념 '${concept}'이(가) ${qNos.length}개 문항(${qNos.map((n) => `${n}번`).join(', ')})에서 중복되었습니다.`,
      })
    }
  })

  // 4. 개별 문항 검사
  questions.forEach((q, idx) => {
    const qNo = q.no ?? idx + 1

    // 질문 누락
    if (!q.question || !q.question.trim()) {
      errors.push({
        severity: 'error',
        no: qNo,
        field: 'question',
        message: `질문(question) 내용이 누락되었습니다.`,
      })
    }

    // 선택지(choices) 검사: 정확히 4개
    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      errors.push({
        severity: 'error',
        no: qNo,
        field: 'choices',
        message: `선택지(choices)는 반드시 4개여야 합니다 (현재 ${q.choices?.length ?? 0}개).`,
      })
    } else {
      q.choices.forEach((c, cIdx) => {
        if (typeof c !== 'string' || !c.trim()) {
          errors.push({
            severity: 'error',
            no: qNo,
            field: 'choices',
            message: `${cIdx + 1}번 선택지 내용이 비어 있습니다.`,
          })
        }
      })
    }

    // 정답(answer) 검사: 1~4 정수
    if (typeof q.answer !== 'number' || !Number.isInteger(q.answer) || q.answer < 1 || q.answer > 4) {
      errors.push({
        severity: 'error',
        no: qNo,
        field: 'answer',
        message: `정답 번호(answer)는 1부터 4 사이의 정수여야 합니다 (현재 값: ${q.answer}).`,
      })
    }

    // 영역 태그(domain) 검사
    if (!STANDARD_DOMAINS.includes(q.domain as (typeof STANDARD_DOMAINS)[number])) {
      errors.push({
        severity: 'error',
        no: qNo,
        field: 'domain',
        message: `유효하지 않은 영역 태그입니다 ('${q.domain ?? '미지정'}'). 5개 표준 영역 중 하나여야 합니다.`,
      })
    }

    // 난이도(level) 검사
    if (!STANDARD_LEVELS.includes(q.level as (typeof STANDARD_LEVELS)[number])) {
      errors.push({
        severity: 'error',
        no: qNo,
        field: 'level',
        message: `유효하지 않은 난이도입니다 ('${q.level ?? '미지정'}'). '상', '중', '하' 중 하나여야 합니다.`,
      })
    }

    // 근거 자료(source) 검사
    if (!q.source || !q.source.trim()) {
      errors.push({
        severity: 'error',
        no: qNo,
        field: 'source',
        message: `강의자료 근거(source)가 누락되었습니다. (예: '01. 디지털세상 p.5')`,
      })
    }
  })

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  }
}

// 영역별 문항 수 집계
export function calculateDomainStats(questions: ExamQuestion[]): DomainStat[] {
  const counts: Record<string, number> = {}
  STANDARD_DOMAINS.forEach((d) => {
    counts[d] = 0
  })

  questions.forEach((q) => {
    if (q.domain) {
      counts[q.domain] = (counts[q.domain] ?? 0) + 1
    }
  })

  return Object.entries(counts).map(([domain, count]) => ({ domain, count }))
}

// 난이도별 문항 수 집계
export function calculateLevelStats(questions: ExamQuestion[]): LevelStat[] {
  const counts: Record<string, number> = { 하: 0, 중: 0, 상: 0 }
  questions.forEach((q) => {
    if (q.level && counts[q.level] !== undefined) {
      counts[q.level] += 1
    }
  })
  return STANDARD_LEVELS.map((level) => ({ level, count: counts[level] ?? 0 }))
}

// 정답 번호(1~4) 분포 집계
export function calculateAnswerDistribution(questions: ExamQuestion[]): AnswerDistribution[] {
  const total = questions.length || 1
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

  questions.forEach((q) => {
    if (typeof q.answer === 'number' && q.answer >= 1 && q.answer <= 4) {
      counts[q.answer] = (counts[q.answer] ?? 0) + 1
    }
  })

  return [1, 2, 3, 4].map((ans) => ({
    answer: ans,
    count: counts[ans] ?? 0,
    ratio: Math.round(((counts[ans] ?? 0) / total) * 100),
  }))
}

// review: true 검토 대상 문항 수
export function countReviewQuestions(questions: ExamQuestion[]): number {
  return questions.filter((q) => Boolean(q.review)).length
}
