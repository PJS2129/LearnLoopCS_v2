import { useEffect, useMemo, useState } from 'react'
import type { StudentProfile } from '../../lib/types'
import { useAuth } from '../../lib/auth'
import ExamConsentView from '../exam/ExamConsentView'
import ExamPaperView from '../exam/ExamPaperView'
import type { ExamInfo, ExamSession, StudentExamQuestion } from '../exam/types'
import {
  fetchPreviewAnswerKey,
  fetchPreviewExams,
  fetchPreviewQuestions,
} from './examPreviewService'

type PreviewScreen = 'consent' | 'paper'

function formatStatus(status: ExamInfo['status']): string {
  const labels: Record<ExamInfo['status'], string> = {
    finalized: '확정됨',
    ready: '개방 준비',
    open: '시험 중',
    closed: '종료됨',
  }
  return labels[status]
}

export default function ExamPreview() {
  const { user, profile } = useAuth()
  const [previewStartedAt] = useState(() => Date.now())
  const [exams, setExams] = useState<ExamInfo[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [questions, setQuestions] = useState<StudentExamQuestion[]>([])
  const [screen, setScreen] = useState<PreviewScreen>('consent')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const [answerKey, setAnswerKey] = useState<Record<number, number> | null>(null)
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false)
  const [previewNotice, setPreviewNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadExams = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const items = await fetchPreviewExams()
        if (cancelled) return
        setExams(items)
        setSelectedExamId((current) => current || items[0]?.examId || '')
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '확정 시험 목록을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadExams()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedExamId) return

    let cancelled = false
    const loadQuestions = async () => {
      setIsLoading(true)
      setError(null)
      setQuestions([])
      setScreen('consent')
      setShowAnswers(false)
      setAnswerKey(null)
      setPreviewNotice(null)
      try {
        const items = await fetchPreviewQuestions(selectedExamId)
        if (!cancelled) setQuestions(items)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '시험 문항을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadQuestions()
    return () => {
      cancelled = true
    }
  }, [selectedExamId])

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.examId === selectedExamId) ?? null,
    [exams, selectedExamId],
  )

  const previewProfile: StudentProfile = profile ?? {
    studentId: '20260000',
    name: '미리보기 학생',
    section: 'A반',
    email: user?.email || '',
  }

  const previewSession = useMemo<ExamSession | null>(() => {
    if (!selectedExam) return null
    const durationMinutes = selectedExam.durationMinutes || 50
    return {
      uid: `admin-preview-${selectedExam.examId}`,
      studentId: previewProfile.studentId,
      name: previewProfile.name,
      section: previewProfile.section,
      enteredCode: 'PREVIEW',
      enteredAt: previewStartedAt,
      individualEndAt: previewStartedAt + durationMinutes * 60 * 1000,
    }
  }, [previewStartedAt, selectedExam, previewProfile.name, previewProfile.section, previewProfile.studentId])

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId)
    setQuestions([])
    setScreen('consent')
    setShowAnswers(false)
    setAnswerKey(null)
    setPreviewNotice(null)
  }

  const handleAnswerToggle = async () => {
    if (showAnswers) {
      setShowAnswers(false)
      return
    }
    if (!selectedExam || !user) return

    if (answerKey) {
      setShowAnswers(true)
      return
    }

    setIsLoadingAnswers(true)
    setError(null)
    try {
      const answers = await fetchPreviewAnswerKey(selectedExam.examId, user)
      setAnswerKey(answers)
      setShowAnswers(true)
    } catch (err) {
      setShowAnswers(false)
      setError(err instanceof Error ? err.message : '정답을 불러오지 못했습니다.')
    } finally {
      setIsLoadingAnswers(false)
    }
  }

  return (
    <div className="admin-preview-page">
      <div className="admin-preview-toolbar">
        <div>
          <span className="admin-eyebrow">시험 미리보기</span>
          <h2>학생 화면 확인</h2>
          <p>확정된 시험의 안내 화면과 시험지를 기록 없이 확인합니다.</p>
        </div>

        <div className="admin-preview-controls">
          <label className="admin-preview-field">
            <span>확정 시험</span>
            <select
              value={selectedExamId}
              onChange={(event) => handleExamChange(event.target.value)}
              disabled={isLoading || exams.length === 0}
            >
              {exams.length === 0 && <option value="">확정된 시험 없음</option>}
              {exams.map((exam) => (
                <option key={exam.examId} value={exam.examId}>
                  {exam.examName} · {formatStatus(exam.status)} · {exam.examId}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-preview-screen-switch" aria-label="미리보기 화면 선택">
            <button
              type="button"
              className={screen === 'consent' ? 'is-active' : ''}
              onClick={() => setScreen('consent')}
              disabled={!selectedExam}
            >
              응시 안내
            </button>
            <button
              type="button"
              className={screen === 'paper' ? 'is-active' : ''}
              onClick={() => setScreen('paper')}
              disabled={!selectedExam || questions.length === 0}
            >
              시험지
            </button>
          </div>

          <label className="admin-preview-answer-toggle">
            <input
              type="checkbox"
              checked={showAnswers}
              onChange={handleAnswerToggle}
              disabled={!selectedExam || isLoadingAnswers || questions.length === 0}
            />
            <span>{isLoadingAnswers ? '정답 확인 중...' : '정답 표시'}</span>
          </label>
        </div>
      </div>

      <div className="admin-preview-mode-banner" role="status">
        미리보기 모드 - 학생 화면과 같지만 기록되지 않습니다
      </div>

      {error && <div className="admin-preview-error" role="alert">{error}</div>}
      {previewNotice && <div className="admin-preview-notice" role="status">{previewNotice}</div>}

      {isLoading ? (
        <div className="admin-preview-empty">시험 정보를 불러오는 중입니다...</div>
      ) : !selectedExam || !previewSession ? (
        <div className="admin-preview-empty">미리 볼 확정 시험이 없습니다.</div>
      ) : screen === 'consent' ? (
        <ExamConsentView
          key={`consent-${selectedExam.examId}`}
          examInfo={selectedExam}
          enteredCode="PREVIEW"
          profile={previewProfile}
          onStartExam={() => {
            setPreviewNotice(null)
            setScreen('paper')
          }}
          onBackToCode={() => setPreviewNotice('미리보기에서는 시험 코드 입력과 세션 생성을 생략합니다.')}
          isStarting={false}
          previewMode
        />
      ) : (
        <ExamPaperView
          key={`paper-${selectedExam.examId}`}
          examInfo={selectedExam}
          session={previewSession}
          profile={previewProfile}
          questions={questions}
          cameraConsent={false}
          cameraStream={null}
          previewMode
          correctAnswers={showAnswers ? answerKey ?? undefined : undefined}
        />
      )}
    </div>
  )
}
