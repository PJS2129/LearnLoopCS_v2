import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../lib/auth'
import type { LearningTab } from '../../lib/types'
import {
  fetchMyExamResult,
  fetchMyPublishedExams,
  type PublishedExamOption,
  type StudentExamResult,
} from './resultService'
import './result.css'

interface ResultViewProps {
  learningTabs: LearningTab[]
}

function questionStatus(result: { correct: boolean; unanswered: boolean }): string {
  if (result.unanswered) return '미응답'
  return result.correct ? '정답' : '오답'
}

export default function ResultView({ learningTabs }: ResultViewProps) {
  const { user } = useAuth()
  const [exams, setExams] = useState<PublishedExamOption[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [result, setResult] = useState<StudentExamResult | null>(null)
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingResult, setIsLoadingResult] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchMyPublishedExams(user)
      .then((items) => {
        if (cancelled) return
        setExams(items)
        if (items[0]) {
          setIsLoadingResult(true)
          setSelectedExamId(items[0].examId)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '공개된 시험을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingList(false)
      })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user || !selectedExamId) return
    let cancelled = false
    fetchMyExamResult(user, selectedExamId)
      .then((nextResult) => {
        if (!cancelled) setResult(nextResult)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '결과를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingResult(false)
      })
    return () => { cancelled = true }
  }, [selectedExamId, user])

  const lowestAreas = useMemo(() => {
    if (!result?.domains?.length) return []
    const minimum = Math.min(...result.domains.map((domain) => domain.achievement))
    return result.domains.filter((domain) => domain.achievement === minimum).map((domain) => domain.area)
  }, [result])

  const recommendations = useMemo(() => {
    return lowestAreas.map((area) => ({
      area,
      tabs: learningTabs.filter((tab) => tab.area === area),
    }))
  }, [learningTabs, lowestAreas])

  const goToLearningTab = (tabId: string) => {
    window.dispatchEvent(new CustomEvent('shell:navigate', { detail: `learn:${tabId}` }))
  }

  const changeExam = (examId: string) => {
    setResult(null)
    setIsLoadingResult(true)
    setError(null)
    setSelectedExamId(examId)
  }

  return (
    <div className="result-page">
      <header className="result-header">
        <div>
          <span className="result-eyebrow">내 결과</span>
          <h2>시험 결과와 추천 복습</h2>
          <p>교수자가 공개한 범위 안에서 내 결과만 확인할 수 있습니다.</p>
        </div>
        {exams.length > 0 && (
          <label className="result-exam-field">
            <span>시험 선택</span>
            <select value={selectedExamId} onChange={(event) => changeExam(event.target.value)}>
              {exams.map((exam) => (
                <option key={exam.examId} value={exam.examId}>{exam.examName}</option>
              ))}
            </select>
          </label>
        )}
      </header>

      {error && <div className="result-message is-error" role="alert">{error}</div>}

      {isLoadingList || isLoadingResult ? (
        <div className="result-empty">내 결과를 불러오는 중입니다...</div>
      ) : exams.length === 0 ? (
        <div className="result-empty">
          <span aria-hidden="true">🔒</span>
          <h3>아직 성적이 공개되지 않았습니다</h3>
          <p>성적이 공개되면 이 화면에서 본인의 결과를 확인할 수 있습니다.</p>
        </div>
      ) : result ? (
        <div className="result-content">
          <section className="result-summary-card">
            <div>
              <span className="result-card-label">선택한 시험</span>
              <h3>{result.examName}</h3>
              <p>제출 시각: <span className="mono">{result.submittedAt || '-'}</span></p>
            </div>
            {result.scope.totalScore && result.totalScore !== undefined && (
              <div className="result-score" aria-label={`총점 ${result.totalScore}점`}>
                <strong>{result.totalScore}</strong><span>/ 100점</span>
              </div>
            )}
          </section>

          {result.scope.domains && result.domains && (
            <section className="result-section-card">
              <div className="result-section-heading">
                <div>
                  <span className="result-card-label">영역별 성취도</span>
                  <h3>어떤 영역을 복습하면 좋을까요?</h3>
                </div>
                <span className="result-lowest-guide">가장 낮은 영역 강조</span>
              </div>
              <div className="result-domain-list">
                {result.domains.map((domain) => {
                  const isLowest = lowestAreas.includes(domain.area)
                  return (
                    <div key={domain.area} className={`result-domain-row ${isLowest ? 'is-lowest' : ''}`}>
                      <div className="result-domain-meta">
                        <strong>{domain.area}</strong>
                        <span className="mono">{domain.achievement.toFixed(1)}%</span>
                      </div>
                      <div className="result-domain-track" aria-hidden="true">
                        <span style={{ width: `${Math.max(0, Math.min(100, domain.achievement))}%` }} />
                      </div>
                      {isLowest && <small>추천 복습 영역</small>}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {result.scope.domains && recommendations.length > 0 && (
            <section className="result-section-card result-review-card">
              <span className="result-card-label">추천 복습</span>
              <h3>낮은 성취도 영역부터 다시 살펴보세요</h3>
              <div className="result-recommendations">
                {recommendations.map(({ area, tabs }) => (
                  <div key={area} className="result-recommendation">
                    <strong>{area}</strong>
                    {tabs.length > 0 ? (
                      <div className="result-learning-links">
                        {tabs.map((tab) => (
                          <button key={tab.id} type="button" onClick={() => goToLearningTab(tab.id)}>
                            {tab.name} 학습으로 이동
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p>연결된 학습 탭이 없습니다. 관련 개념 카드를 복습해 보세요.</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {result.scope.questionCorrectness && result.questions && (
            <section className="result-section-card">
              <span className="result-card-label">문항별 결과</span>
              <h3>내 답안 정오 확인</h3>
              <div className="result-question-grid">
                {result.questions.map((question) => (
                  <article
                    key={question.no}
                    className={`result-question ${question.unanswered ? 'is-unanswered' : question.correct ? 'is-correct' : 'is-wrong'}`}
                  >
                    <div className="result-question-title">
                      <strong>{question.no}번</strong>
                      <span>{questionStatus(question)}</span>
                    </div>
                    {result.scope.explanations && (
                      <p>{question.explanation || '등록된 해설이 없습니다.'}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : null}
    </div>
  )
}
