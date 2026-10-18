import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal'
import { useAuth } from '../../lib/auth'
import type { ExamInfo } from './types'
import { fetchPreviewExams } from './examPreviewService'
import {
  cancelGradeSetting,
  fetchGradePublicationSetting,
  publishGradeSetting,
  type GradePublicationScope,
  type GradePublicationSetting,
} from './gradePublicationService'

const EMPTY_SCOPE: GradePublicationScope = {
  totalScore: false,
  domains: false,
  questionCorrectness: false,
  explanations: false,
}

const SCOPE_OPTIONS: Array<{
  key: keyof GradePublicationScope
  label: string
  description: string
}> = [
  { key: 'totalScore', label: '총점', description: '100점 만점의 본인 총점을 공개합니다.' },
  { key: 'domains', label: '영역별 성취도', description: '5개 영역의 성취도와 맞춤 복습 추천을 공개합니다.' },
  { key: 'questionCorrectness', label: '문항별 정오', description: '각 문항의 정답·오답·미응답 여부만 공개합니다.' },
  { key: 'explanations', label: '해설', description: '문항별 해설을 공개합니다. 문항별 정오도 함께 공개됩니다.' },
]

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR')
}

export default function GradePublication() {
  const { user } = useAuth()
  const [exams, setExams] = useState<ExamInfo[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [setting, setSetting] = useState<GradePublicationSetting | null>(null)
  const [scope, setScope] = useState<GradePublicationScope>(EMPTY_SCOPE)
  const [isLoadingExams, setIsLoadingExams] = useState(true)
  const [isLoadingSetting, setIsLoadingSetting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'publish' | 'cancel' | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchPreviewExams()
      .then((items) => {
        if (cancelled) return
        setExams(items)
        if (items[0]) {
          setIsLoadingSetting(true)
          setSelectedExamId(items[0].examId)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '시험 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingExams(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedExamId || !user) return
    let cancelled = false
    fetchGradePublicationSetting(user, selectedExamId)
      .then((nextSetting) => {
        if (cancelled) return
        setSetting(nextSetting)
        setScope(nextSetting.scope)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '공개 설정을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSetting(false)
      })
    return () => { cancelled = true }
  }, [selectedExamId, user])

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.examId === selectedExamId) ?? null,
    [exams, selectedExamId],
  )
  const hasSelection = Object.values(scope).some(Boolean)

  const toggleScope = (key: keyof GradePublicationScope) => {
    setScope((current) => {
      const next = { ...current, [key]: !current[key] }
      if (key === 'explanations' && next.explanations) next.questionCorrectness = true
      if (key === 'questionCorrectness' && !next.questionCorrectness) next.explanations = false
      return next
    })
    setNotice(null)
  }

  const changeExam = (examId: string) => {
    setIsLoadingSetting(true)
    setError(null)
    setNotice(null)
    setSelectedExamId(examId)
  }

  const performAction = async () => {
    if (!user || !selectedExam) return
    setIsSaving(true)
    setError(null)
    try {
      const nextSetting = confirmAction === 'publish'
        ? await publishGradeSetting(user, selectedExam.examId, selectedExam.examName, scope)
        : await cancelGradeSetting(user, selectedExam.examId)
      setSetting(nextSetting)
      setScope(nextSetting.scope)
      setNotice(confirmAction === 'publish' ? '선택한 범위로 성적을 공개했습니다.' : '성적 공개를 취소했습니다.')
      setConfirmAction(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '성적 공개 설정을 저장하지 못했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grade-publish-page">
      <div className="admin-view-header">
        <div>
          <span className="admin-eyebrow">성적 공개</span>
          <h2>학생 결과 공개 범위</h2>
          <p>공개할 시험과 항목을 선택한 뒤 확인을 거쳐 적용합니다.</p>
        </div>
      </div>

      {error && <div className="grade-publish-message is-error" role="alert">{error}</div>}
      {notice && <div className="grade-publish-message is-success" role="status">{notice}</div>}

      <section className="grade-publish-card">
        <label className="grade-publish-exam-field">
          <span>시험 선택</span>
          <select
            value={selectedExamId}
            onChange={(event) => changeExam(event.target.value)}
            disabled={isLoadingExams || exams.length === 0 || isSaving}
          >
            {exams.length === 0 && <option value="">확정된 시험 없음</option>}
            {exams.map((exam) => (
              <option key={exam.examId} value={exam.examId}>{exam.examName} · {exam.examId}</option>
            ))}
          </select>
        </label>

        {isLoadingExams || isLoadingSetting ? (
          <div className="grade-publish-empty">공개 설정을 불러오는 중입니다...</div>
        ) : !selectedExam ? (
          <div className="grade-publish-empty">성적을 공개할 확정 시험이 없습니다.</div>
        ) : (
          <>
            <div className={`grade-publish-status ${setting?.published ? 'is-published' : ''}`}>
              <div>
                <strong>{setting?.published ? '현재 공개 중' : '현재 비공개'}</strong>
                <span>
                  {setting?.published
                    ? `${formatDateTime(setting.publishedAt)}부터 학생이 공개 범위의 본인 결과를 볼 수 있습니다.`
                    : '학생 요청은 서버에서 거부되며 점수 데이터가 전달되지 않습니다.'}
                </span>
              </div>
              <span className="grade-publish-status-chip">{setting?.published ? '공개' : '비공개'}</span>
            </div>

            <fieldset className="grade-publish-scope">
              <legend>공개 범위</legend>
              <div className="grade-publish-options">
                {SCOPE_OPTIONS.map((option) => (
                  <label key={option.key} className={`grade-publish-option ${scope[option.key] ? 'is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={scope[option.key]}
                      onChange={() => toggleScope(option.key)}
                      disabled={isSaving}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grade-publish-actions">
              {setting?.published && (
                <button type="button" className="btn grade-publish-cancel" onClick={() => setConfirmAction('cancel')} disabled={isSaving}>
                  공개 취소
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setConfirmAction('publish')}
                disabled={!hasSelection || isSaving}
              >
                {setting?.published ? '공개 범위 변경' : '성적 공개'}
              </button>
            </div>
          </>
        )}
      </section>

      {confirmAction && selectedExam && (
        <Modal
          title={confirmAction === 'publish' ? '성적을 공개할까요?' : '성적 공개를 취소할까요?'}
          onClose={isSaving ? undefined : () => setConfirmAction(null)}
          actions={(
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmAction(null)} disabled={isSaving}>돌아가기</button>
              <button
                type="button"
                className={`btn ${confirmAction === 'publish' ? 'btn-primary' : 'grade-publish-danger'}`}
                onClick={performAction}
                disabled={isSaving}
              >
                {isSaving ? '처리 중...' : confirmAction === 'publish' ? '성적 공개' : '공개 취소'}
              </button>
            </>
          )}
        >
          <p><strong>{selectedExam.examName}</strong></p>
          <p>
            {confirmAction === 'publish'
              ? '학생은 즉시 선택한 범위의 본인 결과만 볼 수 있습니다.'
              : '학생의 결과 요청은 즉시 서버에서 거부됩니다.'}
          </p>
        </Modal>
      )}
    </div>
  )
}
