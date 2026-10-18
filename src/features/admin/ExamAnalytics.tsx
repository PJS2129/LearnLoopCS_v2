import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../../components/Modal'
import { useAuth } from '../../lib/auth'
import { fetchPreviewExams } from './examPreviewService'
import type { ExamInfo } from './types'
import {
  deleteExamAnalysisSummary,
  fetchExamAnalytics,
  fetchExamAnalysisSummary,
  saveExamAnalysisSummary,
  type AnalyticsStudent,
  type ExamAnalysisSummary,
  type ExamAnalyticsData,
} from './examAnalyticsService'
import './examAnalytics.css'

type StudentSortKey = 'studentId' | 'score'
type SortDirection = 'asc' | 'desc'

function formatKoreanDate(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR')
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function studentComparator(
  key: StudentSortKey,
  direction: SortDirection,
): (a: AnalyticsStudent, b: AnalyticsStudent) => number {
  const multiplier = direction === 'asc' ? 1 : -1
  return (a, b) => {
    const compared = key === 'score'
      ? a.totalScore - b.totalScore
      : a.studentId.localeCompare(b.studentId, 'ko', { numeric: true })
    return compared * multiplier
  }
}

export default function ExamAnalytics() {
  const { user } = useAuth()
  const requestIdRef = useRef(0)
  const [exams, setExams] = useState<ExamInfo[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [analytics, setAnalytics] = useState<ExamAnalyticsData | null>(null)
  const [analysisSummary, setAnalysisSummary] = useState<ExamAnalysisSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSummary, setIsSavingSummary] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [summaryModalOpen, setSummaryModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [sectionFilter, setSectionFilter] = useState('all')
  const [sortKey, setSortKey] = useState<StudentSortKey>('studentId')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const loadExamData = useCallback(async (examId: string) => {
    if (!user || !examId) return
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    setNotice(null)
    try {
      const [nextAnalytics, nextSummary] = await Promise.all([
        fetchExamAnalytics(user, examId),
        fetchExamAnalysisSummary(user, examId),
      ])
      if (requestId !== requestIdRef.current) return
      setAnalytics(nextAnalytics)
      setAnalysisSummary(nextSummary)
      setSectionFilter('all')
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : '성적 분석을 불러오지 못했습니다.')
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchPreviewExams()
      .then((items) => {
        if (cancelled) return
        setExams(items)
        if (items[0]) {
          setSelectedExamId(items[0].examId)
          void loadExamData(items[0].examId)
        } else {
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '시험 목록을 불러오지 못했습니다.')
        setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [loadExamData, user])

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.examId === selectedExamId) ?? null,
    [exams, selectedExamId],
  )

  const displayedStudents = useMemo(() => {
    const filtered = (analytics?.students ?? []).filter((student) => (
      sectionFilter === 'all' || student.section === sectionFilter
    ))
    return filtered.slice().sort(studentComparator(sortKey, sortDirection))
  }, [analytics?.students, sectionFilter, sortDirection, sortKey])

  const maxScoreBinCount = useMemo(
    () => Math.max(1, ...(analytics?.scoreDistribution.map((bin) => bin.count) ?? [0])),
    [analytics?.scoreDistribution],
  )

  const questionDifficultyBins = useMemo(() => {
    if (!analytics) return []
    return [
      { key: 'easy', label: '쉬움', count: analytics.questionDifficultyDistribution.easy, guide: '80% 이상' },
      { key: 'appropriate', label: '적절', count: analytics.questionDifficultyDistribution.appropriate, guide: '30% 이상 80% 미만' },
      { key: 'hard', label: '어려움', count: analytics.questionDifficultyDistribution.hard, guide: '30% 미만' },
    ]
  }, [analytics])

  const maxQuestionDifficultyCount = useMemo(
    () => Math.max(1, ...questionDifficultyBins.map((bin) => bin.count)),
    [questionDifficultyBins],
  )

  const changeExam = (examId: string) => {
    setSelectedExamId(examId)
    setAnalytics(null)
    setAnalysisSummary(null)
    void loadExamData(examId)
  }

  const openSummaryModal = () => {
    setSummaryText(analysisSummary?.summaryText ?? '')
    setDocumentUrl(analysisSummary?.documentUrl ?? '')
    setReviewConfirmed(analysisSummary?.reviewConfirmed ?? false)
    setSummaryModalOpen(true)
    setError(null)
  }

  const saveSummary = async () => {
    if (!user || !selectedExamId || !reviewConfirmed) return
    setIsSavingSummary(true)
    setError(null)
    try {
      const saved = await saveExamAnalysisSummary(user, selectedExamId, summaryText, documentUrl, reviewConfirmed)
      setAnalysisSummary(saved)
      setSummaryModalOpen(false)
      setNotice('교수자 검토가 완료된 AI 분석 요약을 저장했습니다.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 분석 요약을 저장하지 못했습니다.')
    } finally {
      setIsSavingSummary(false)
    }
  }

  const deleteSummary = async () => {
    if (!user || !selectedExamId) return
    setIsSavingSummary(true)
    setError(null)
    try {
      await deleteExamAnalysisSummary(user, selectedExamId)
      setAnalysisSummary(null)
      setDeleteModalOpen(false)
      setNotice('저장된 AI 분석 요약을 삭제했습니다.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 분석 요약을 삭제하지 못했습니다.')
    } finally {
      setIsSavingSummary(false)
    }
  }

  const setSort = (nextKey: StudentSortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(nextKey)
      setSortDirection(nextKey === 'score' ? 'desc' : 'asc')
    }
  }

  return (
    <div className="analytics-page">
      <header className="analytics-toolbar">
        <div>
          <span className="analytics-eyebrow">성적과 분석</span>
          <h2>시험 결과 대시보드</h2>
          <p>응시결과 시트의 확정 기록을 관리자 권한으로 집계합니다.</p>
        </div>
        <div className="analytics-toolbar-actions">
          <label>
            <span>시험 선택</span>
            <select value={selectedExamId} onChange={(event) => changeExam(event.target.value)} disabled={isLoading}>
              {exams.length === 0 && <option value="">확정된 시험 없음</option>}
              {exams.map((exam) => <option key={exam.examId} value={exam.examId}>{exam.examName}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-ghost" onClick={() => void loadExamData(selectedExamId)} disabled={!selectedExamId || isLoading}>
            {isLoading ? '조회 중...' : '새로고침'}
          </button>
        </div>
        <div className="analytics-last-read">
          마지막 조회: <span className="mono">{analytics ? formatKoreanDate(analytics.generatedAt) : '-'}</span>
        </div>
      </header>

      {error && <div className="analytics-message is-error" role="alert">{error}</div>}
      {notice && <div className="analytics-message is-success" role="status">{notice}</div>}

      {!selectedExam ? (
        <div className="analytics-empty">분석할 확정 시험이 없습니다.</div>
      ) : isLoading && !analytics ? (
        <div className="analytics-empty">응시결과를 분석하는 중입니다...</div>
      ) : analytics ? (
        <>
          <section className="analytics-ai-card">
            <div className="analytics-section-heading">
              <div>
                <span className="analytics-eyebrow">AI 분석 요약 · 관리자 전용</span>
                <h3>교수자 검토 의견</h3>
              </div>
              <div className="analytics-inline-actions">
                {analysisSummary ? (
                  <>
                    <button type="button" className="btn btn-ghost" onClick={openSummaryModal}>수정</button>
                    <button type="button" className="btn analytics-danger-btn" onClick={() => setDeleteModalOpen(true)}>삭제</button>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={openSummaryModal}>요약 입력</button>
                )}
              </div>
            </div>
            {analysisSummary ? (
              <div className="analytics-ai-content">
                <p>{analysisSummary.summaryText}</p>
                <small>AI가 작성한 참고 의견이며 교수자가 검토했습니다. 자세한 분석은 문서에서 확인하세요.</small>
                <div className="analytics-document-actions">
                  <a className="btn btn-ghost" href={analysisSummary.documentUrl} target="_blank" rel="noreferrer">문서 열기</a>
                  <a
                    className="btn btn-primary"
                    href={`https://docs.google.com/document/d/${analysisSummary.documentId}/export?format=pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF 다운로드
                  </a>
                </div>
                <small>마지막 수정: {formatKoreanDate(analysisSummary.updatedAt)}</small>
              </div>
            ) : (
              <div className="analytics-ai-empty">
                <p>claude.ai에서 결과 분석 후 요약을 붙여 넣으세요.</p>
                <small>전체 분석 문서는 Google Drive에 보관하고, 검토한 요약만 이 화면에 게시합니다.</small>
              </div>
            )}
          </section>

          <section className="analytics-summary-grid" aria-label="한눈에 보기">
            <article className="analytics-metric-card">
              <span>응시 인원</span><strong className="mono">{analytics.summary.candidateCount}<small>명</small></strong>
            </article>
            <article className="analytics-metric-card">
              <span>평균</span><strong className="mono">{analytics.summary.averageScore}<small>점</small></strong>
            </article>
            <article className="analytics-metric-card">
              <span>표준편차</span><strong className="mono">{analytics.summary.standardDeviation}<small>점</small></strong>
              <small className="analytics-metric-detail">분산 {analytics.summary.variance.toFixed(1)}</small>
            </article>
            <article className="analytics-metric-card">
              <span>최고 · 최저</span>
              <strong className="mono">{analytics.summary.highestScore}<small>점</small> · {analytics.summary.lowestScore}<small>점</small></strong>
            </article>
            <article className="analytics-metric-card analytics-difficulty-card">
              <span>시험 난이도</span>
              <strong className={`analytics-difficulty-badge is-${analytics.summary.difficulty === '쉬움' ? 'easy' : analytics.summary.difficulty === '적절' ? 'appropriate' : 'hard'}`}>
                {analytics.summary.difficulty}
              </strong>
              <small className="analytics-metric-detail">평균 정답률 {analytics.summary.averageCorrectRate.toFixed(1)}%</small>
            </article>
          </section>
          <p className="analytics-difficulty-guide">
            시험 난이도 기준: 평균 정답률 {analytics.difficultyThresholds.exam.EASY_MIN}% 이상 쉬움 · {analytics.difficultyThresholds.exam.APPROPRIATE_MIN}% 이상 {analytics.difficultyThresholds.exam.EASY_MIN}% 미만 적절 · {analytics.difficultyThresholds.exam.APPROPRIATE_MIN}% 미만 어려움
          </p>

          <section className="analytics-distribution-grid">
            <article className="analytics-panel">
              <div className="analytics-section-heading"><div><span className="analytics-eyebrow">분포</span><h3>점수 분포</h3></div></div>
              <div className="analytics-distribution-list">
                {analytics.scoreDistribution.map((bin) => (
                  <div key={bin.label}>
                    <span className="mono">{bin.label}</span>
                    <div><i style={{ width: `${bin.count / maxScoreBinCount * 100}%` }} /></div>
                    <strong className="mono">{bin.count}명</strong>
                  </div>
                ))}
              </div>
            </article>
            <article className="analytics-panel">
              <div className="analytics-section-heading"><div><span className="analytics-eyebrow">분포</span><h3>문항 난이도 분포</h3></div></div>
              <div className="analytics-difficulty-list">
                {questionDifficultyBins.map((bin) => (
                  <div key={bin.key} className={`is-${bin.key}`}>
                    <div><strong>{bin.label}</strong><small>{bin.guide}</small></div>
                    <div className="analytics-difficulty-track"><i style={{ width: `${bin.count / maxQuestionDifficultyCount * 100}%` }} /></div>
                    <b className="mono">{bin.count}문항</b>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="analytics-panel">
            <div className="analytics-section-heading">
              <div><span className="analytics-eyebrow">문항 분석</span><h3>오답이 많은 문항 TOP 5</h3></div>
            </div>
            {analytics.smallSampleCaution && <p className="analytics-caution-line">응시 인원이 적어 해석에 주의가 필요합니다.</p>}
            <div className="analytics-table-wrap">
              <table className="analytics-table analytics-top-table">
                <thead><tr><th>문항</th><th>영역</th><th>핵심 개념</th><th>정답률</th><th>가장 많이 고른 오답</th></tr></thead>
                <tbody>
                  {analytics.topWrongQuestions.map((question) => (
                    <tr key={question.no}>
                      <td><strong>{question.no}번</strong></td><td>{question.domain}</td><td>{question.concept}</td>
                      <td className="mono">{question.correctRate.toFixed(1)}%</td>
                      <td>{question.mostWrongChoice === null ? '선택된 오답 없음' : <><strong>{question.mostWrongChoice}번</strong> <span className="mono">({question.mostWrongRate.toFixed(1)}%)</span></>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="analytics-panel">
            <div className="analytics-section-heading">
              <div>
                <span className="analytics-eyebrow">영역별 평균</span>
                <h3>5개 영역 성취도</h3>
              </div>
              {analytics.sections.length >= 2 && <span className="analytics-section-note">전체 · 분반별 수치</span>}
            </div>
            <div className="analytics-domain-list">
              {analytics.domains.map((domain) => (
                <article key={domain.domain} className="analytics-domain-card">
                  <div className="analytics-domain-title"><strong>{domain.domain}</strong><span className="mono">{domain.average.toFixed(1)}%</span></div>
                  <div className="analytics-bar" aria-label={`${domain.domain} 전체 평균 ${domain.average}%`}>
                    <span style={{ width: `${clampPercent(domain.average)}%` }} />
                  </div>
                  {analytics.sections.length >= 2 && (
                    <div className="analytics-section-bars">
                      {domain.sections.map((section) => (
                        <div key={section.section}>
                          <span>{section.section}</span>
                          <div className="analytics-mini-bar"><i style={{ width: `${clampPercent(section.average)}%` }} /></div>
                          <strong className="mono">{section.average.toFixed(1)}%</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="analytics-panel">
            <div className="analytics-section-heading">
              <div>
                <span className="analytics-eyebrow">전체 성적표</span>
                <h3>학생별 결과</h3>
              </div>
              <div className="analytics-table-controls">
                <label>분반
                  <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
                    <option value="all">전체 분반</option>
                    {analytics.sections.map((section) => <option key={section} value={section}>{section}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => setSort('studentId')}>학번 {sortKey === 'studentId' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</button>
                <button type="button" onClick={() => setSort('score')}>점수 {sortKey === 'score' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</button>
              </div>
            </div>
            <div className="analytics-proctor-note">카메라 기록은 참고용이며 자동 불이익 판단에 쓰지 않습니다.</div>
            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead><tr><th>학번</th><th>성명</th><th>분반</th><th>총점</th>{analytics.domains.map((domain) => <th key={domain.domain}>{domain.domain}</th>)}<th>제출 방식</th><th>카메라 이탈</th></tr></thead>
                <tbody>
                  {displayedStudents.map((student) => (
                    <tr key={`${student.studentId}-${student.section}`}>
                      <td className="mono">{student.studentId}</td><td>{student.name}</td><td>{student.section}</td>
                      <td className="mono"><strong>{student.totalScore}</strong></td>
                      {student.domains.map((domain) => <td key={domain.domain} className="mono">{domain.achievement.toFixed(1)}%</td>)}
                      <td>{student.submitType}</td><td className="mono">{String(student.cameraExitCount)}</td>
                    </tr>
                  ))}
                  {displayedStudents.length === 0 && <tr><td colSpan={11}>조건에 맞는 응시 결과가 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {summaryModalOpen && (
        <Modal
          title={analysisSummary ? 'AI 분석 요약 수정' : 'AI 분석 요약 입력'}
          onClose={isSavingSummary ? undefined : () => setSummaryModalOpen(false)}
          actions={(
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setSummaryModalOpen(false)} disabled={isSavingSummary}>취소</button>
              <button type="button" className="btn btn-primary" onClick={() => void saveSummary()} disabled={isSavingSummary || !summaryText.trim() || !documentUrl.trim() || !reviewConfirmed}>
                {isSavingSummary ? '저장 중...' : '저장'}
              </button>
            </>
          )}
        >
          <div className="analytics-summary-form">
            <label>요약 글
              <textarea value={summaryText} maxLength={1000} rows={8} onChange={(event) => setSummaryText(event.target.value)} placeholder="앱에 표시할 5줄 이내 요약을 붙여 넣으세요." />
              <small>{summaryText.length} / 1,000자</small>
            </label>
            <label>Drive 분석 문서 링크
              <input type="url" value={documentUrl} onChange={(event) => setDocumentUrl(event.target.value)} placeholder="https://docs.google.com/document/d/..." />
            </label>
            <label className="analytics-review-check">
              <input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} />
              <span>AI가 작성한 참고 의견이며 교수자가 검토했습니다.</span>
            </label>
          </div>
        </Modal>
      )}

      {deleteModalOpen && (
        <Modal
          title="AI 분석 요약을 삭제할까요?"
          onClose={isSavingSummary ? undefined : () => setDeleteModalOpen(false)}
          actions={(
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteModalOpen(false)} disabled={isSavingSummary}>취소</button>
              <button type="button" className="btn analytics-danger-btn" onClick={() => void deleteSummary()} disabled={isSavingSummary}>{isSavingSummary ? '삭제 중...' : '삭제'}</button>
            </>
          )}
        >
          <p><strong>{selectedExam?.examName}</strong>에 저장된 요약과 문서 링크를 삭제합니다. Google Drive의 원본 문서는 삭제되지 않습니다.</p>
        </Modal>
      )}
    </div>
  )
}
