import { useEffect, useMemo, useRef, useState } from 'react'
import type { ExamQuestion, ValidationIssue } from './types'

interface QuestionTableProps {
  questions: ExamQuestion[]
  issues: ValidationIssue[]
  onEditQuestion: (question: ExamQuestion) => void
}

export default function QuestionTable({
  questions,
  issues,
  onEditQuestion,
}: QuestionTableProps) {
  // 뷰 모드: 테이블 뷰 vs 카드형 뷰 (가로 스크롤 없는 편한 보기)
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
    return (localStorage.getItem('admin_q_view_mode') as 'table' | 'card') || 'table'
  })

  // 필터: 영역 선택, 검토 대상만 보기, 오류만 보기
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [filterOnlyReview, setFilterOnlyReview] = useState(false)
  const [filterOnlyError, setFilterOnlyError] = useState(false)

  // 상단 / 본문 가로 스크롤 동기화 ref
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const topScrollRef = useRef<HTMLDivElement>(null)
  const [tableScrollWidth, setTableScrollWidth] = useState(1400)
  const isSyncingScroll = useRef(false)

  const handleViewModeChange = (mode: 'table' | 'card') => {
    setViewMode(mode)
    localStorage.setItem('admin_q_view_mode', mode)
  }

  // 문항 번호별 오류 매핑
  const errorsByNo = useMemo(() => {
    const map = new Map<number, ValidationIssue[]>()
    issues.forEach((issue) => {
      if (issue.severity === 'error' && typeof issue.no === 'number') {
        const list = map.get(issue.no) ?? []
        list.push(issue)
        map.set(issue.no, list)
      }
    })
    return map
  }, [issues])

  // concept 중복 카운트 매핑
  const conceptCountMap = useMemo(() => {
    const map = new Map<string, number>()
    questions.forEach((q) => {
      const c = (q.concept || '').trim()
      if (c) {
        map.set(c, (map.get(c) ?? 0) + 1)
      }
    })
    return map
  }, [questions])

  // 영역 목록 및 영역별 문항 수
  const domainStats = useMemo(() => {
    const counts = new Map<string, number>()
    questions.forEach((q) => {
      const d = q.domain || '미지정'
      counts.set(d, (counts.get(d) ?? 0) + 1)
    })
    return Array.from(counts.entries())
  }, [questions])

  // 검토 필요 문항 수
  const reviewCount = useMemo(() => questions.filter((q) => q.review).length, [questions])
  const errorCount = useMemo(() => Array.from(errorsByNo.keys()).length, [errorsByNo])

  // 필터링된 문항 목록
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedDomain !== 'all' && (q.domain || '미지정') !== selectedDomain) {
        return false
      }
      const hasError = (errorsByNo.get(q.no) ?? []).length > 0
      if (filterOnlyError && !hasError) {
        return false
      }
      if (filterOnlyReview && !q.review) {
        return false
      }
      return true
    })
  }, [questions, selectedDomain, filterOnlyError, filterOnlyReview, errorsByNo])

  // 가로 스크롤 동기화 및 너비 측정
  useEffect(() => {
    if (viewMode !== 'table') return

    const updateWidth = () => {
      if (tableScrollRef.current) {
        setTableScrollWidth(tableScrollRef.current.scrollWidth)
      }
    }

    updateWidth()
    const timer = setTimeout(updateWidth, 200)
    window.addEventListener('resize', updateWidth)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateWidth)
    }
  }, [viewMode, filteredQuestions])

  const handleTopScroll = () => {
    if (isSyncingScroll.current) return
    isSyncingScroll.current = true
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false
    })
  }

  const handleTableScroll = () => {
    if (isSyncingScroll.current) return
    isSyncingScroll.current = true
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false
    })
  }

  // 가로 위치 빠른 이동 버튼
  const scrollToX = (pos: 'start' | 'choices' | 'end') => {
    if (!tableScrollRef.current) return
    let target = 0
    if (pos === 'choices') target = 480
    if (pos === 'end') target = tableScrollRef.current.scrollWidth

    tableScrollRef.current.scrollTo({ left: target, behavior: 'smooth' })
  }

  // 특정 문항으로 스크롤 이동
  const handleJumpToQuestion = (no: number) => {
    const el = document.getElementById(`q-row-${no}`) || document.getElementById(`q-card-${no}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="admin-table-container">
      {/* 툴바 상단: 제목 + 뷰 모드 전환 버튼 */}
      <div className="admin-table-toolbar">
        <div className="admin-toolbar-left">
          <h4>전체 문항 검토 목록 ({filteredQuestions.length} / {questions.length}문항)</h4>
          <span className="admin-toolbar-tip">
            * [수정] 버튼을 누르면 질문, 선택지, 정답, 영역, 난이도를 즉시 수정할 수 있습니다.
          </span>
        </div>

        <div className="admin-toolbar-right">
          {/* 뷰 모드 토글 (테이블 뷰 vs 카드형 뷰) */}
          <div className="admin-view-switcher" role="group" aria-label="보기 방식">
            <button
              type="button"
              className={`view-btn ${viewMode === 'table' ? 'is-active' : ''}`}
              onClick={() => handleViewModeChange('table')}
              title="한 줄씩 넓게 표로 검토합니다 (상·하단 가로 스크롤바 제공)"
            >
              📋 테이블 뷰
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'card' ? 'is-active' : ''}`}
              onClick={() => handleViewModeChange('card')}
              title="가로 스크롤 없이 시험지 카드 형태로 편안하게 검토합니다"
            >
              🗂️ 카드형 뷰 (가로스크롤 없음)
            </button>
          </div>
        </div>
      </div>

      {/* 필터 및 빠른 이동 바 */}
      <div className="admin-filter-bar">
        {/* 영역 필터 칩 */}
        <div className="admin-domain-chips">
          <button
            type="button"
            className={`filter-chip ${selectedDomain === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedDomain('all')}
          >
            전체 ({questions.length})
          </button>
          {domainStats.map(([domain, count]) => (
            <button
              key={domain}
              type="button"
              className={`filter-chip ${selectedDomain === domain ? 'is-active' : ''}`}
              onClick={() => setSelectedDomain(domain)}
            >
              {domain} ({count})
            </button>
          ))}
        </div>

        {/* 상태 필터 및 바로가기 */}
        <div className="admin-filter-actions">
          {reviewCount > 0 && (
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filterOnlyReview}
                onChange={(e) => setFilterOnlyReview(e.target.checked)}
              />
              <span className="q-review-badge">검토 대상만 ({reviewCount})</span>
            </label>
          )}

          {errorCount > 0 && (
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={filterOnlyError}
                onChange={(e) => setFilterOnlyError(e.target.checked)}
              />
              <span className="q-error-badge">오류만 ({errorCount})</span>
            </label>
          )}

          {/* 문항 바로가기 셀렉트 */}
          <select
            className="admin-jump-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                handleJumpToQuestion(Number(e.target.value))
                e.target.value = ''
              }
            }}
            aria-label="문항 바로가기"
          >
            <option value="" disabled>
              문항 바로가기...
            </option>
            {questions.map((q) => (
              <option key={q.no} value={q.no}>
                {q.no}번 ({q.domain}) {q.review ? '·[검토]' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* [테이블 뷰 모드] */}
      {viewMode === 'table' && (
        <div className="admin-table-view-wrapper">
          {/* 상단 가로 스크롤 컨트롤 바 (사용자가 위에서도 가로 스크롤을 바로 조작할 수 있도록 함) */}
          <div className="admin-scroll-helper-bar">
            <span className="helper-label">↔ 가로 이동 바로가기:</span>
            <div className="helper-btns">
              <button
                type="button"
                className="helper-nav-btn"
                onClick={() => scrollToX('start')}
                title="번호와 질문 영역으로 이동"
              >
                ◀ 1. 번호·질문
              </button>
              <button
                type="button"
                className="helper-nav-btn"
                onClick={() => scrollToX('choices')}
                title="선택지와 정답 영역으로 이동"
              >
                🎯 2. 선택지·정답
              </button>
              <button
                type="button"
                className="helper-nav-btn"
                onClick={() => scrollToX('end')}
                title="근거 자료, 해설 및 수정 버튼 영역으로 이동"
              >
                3. 해설·수정 관리 ▶
              </button>
            </div>
          </div>

          {/* 상단 동기화 가로 스크롤바: 표 상단에서 마우스로 바로 드래그 가능 */}
          <div
            className="admin-table-top-scroll"
            ref={topScrollRef}
            onScroll={handleTopScroll}
            title="가로 스크롤바 (상단)"
          >
            <div style={{ width: tableScrollWidth, height: 1 }} />
          </div>

          {/* 표 본문 스크롤 컨테이너 (max-height로 뷰포트 고정 -> 가로 스크롤바가 화면 하단에 항상 보임) */}
          <div
            className="admin-table-scroll-wrap"
            ref={tableScrollRef}
            onScroll={handleTableScroll}
          >
            <table className="admin-exam-table">
              <thead>
                <tr>
                  <th className="col-sticky-no" style={{ width: '54px', textAlign: 'center' }}>
                    번호
                  </th>
                  <th style={{ width: '64px', textAlign: 'center' }}>상태</th>
                  <th style={{ width: '110px' }}>영역 (domain)</th>
                  <th style={{ width: '58px', textAlign: 'center' }}>난이도</th>
                  <th style={{ width: '130px' }}>핵심 개념 (concept)</th>
                  <th style={{ minWidth: '240px' }}>질문 (question)</th>
                  <th style={{ minWidth: '270px' }}>선택지 4개 (choices)</th>
                  <th style={{ width: '56px', textAlign: 'center' }}>정답</th>
                  <th style={{ width: '120px' }}>근거 자료 (source)</th>
                  <th style={{ minWidth: '200px' }}>해설 (explanation)</th>
                  <th className="col-sticky-action" style={{ width: '68px', textAlign: 'center' }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q, idx) => {
                  const qErrors = errorsByNo.get(q.no) ?? []
                  const hasError = qErrors.length > 0
                  const isReview = Boolean(q.review)
                  const isDuplicateConcept =
                    (conceptCountMap.get((q.concept || '').trim()) ?? 0) > 1

                  return (
                    <tr
                      key={`${q.no}-${idx}`}
                      id={`q-row-${q.no}`}
                      className={`${hasError ? 'has-error' : ''} ${isReview ? 'is-review' : ''}`}
                    >
                      {/* 문항 번호 (좌측 고정 열) */}
                      <td className="col-sticky-no" style={{ textAlign: 'center' }}>
                        <span className="q-no-badge">{q.no}</span>
                      </td>

                      {/* 상태 배지 */}
                      <td style={{ textAlign: 'center' }}>
                        {hasError && <span className="q-error-badge">오류</span>}
                        {isReview && <span className="q-review-badge">검토</span>}
                        {!hasError && !isReview && (
                          <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>
                            정상
                          </span>
                        )}
                      </td>

                      {/* 영역 */}
                      <td>
                        <span className="tag-domain">{q.domain || '미지정'}</span>
                      </td>

                      {/* 난이도 */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`tag-level level-${q.level}`}>{q.level || '-'}</span>
                      </td>

                      {/* 핵심 개념 */}
                      <td>
                        <span className="tag-concept" title={q.concept}>
                          {q.concept || '-'}
                        </span>
                        {isDuplicateConcept && (
                          <span
                            style={{
                              display: 'block',
                              fontSize: '0.68rem',
                              color: '#B45309',
                              marginTop: '2px',
                            }}
                          >
                            (개념 중복)
                          </span>
                        )}
                      </td>

                      {/* 질문 */}
                      <td>
                        <div style={{ fontWeight: 500, lineHeight: 1.45 }}>{q.question}</div>
                        {hasError && (
                          <div
                            style={{
                              marginTop: '6px',
                              color: '#B91C1C',
                              fontSize: '0.74rem',
                              lineHeight: 1.3,
                            }}
                          >
                            {qErrors.map((e, eIdx) => (
                              <div key={eIdx}>⚠ {e.message}</div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* 선택지 4개 */}
                      <td>
                        <ul className="choices-preview-list">
                          {(q.choices || []).map((choice, cIdx) => {
                            const choiceNo = cIdx + 1
                            const isAns = q.answer === choiceNo
                            return (
                              <li
                                key={cIdx}
                                className={`choice-item-row ${isAns ? 'is-answer' : ''}`}
                              >
                                <span className="choice-no">{choiceNo}.</span>
                                <span>{choice}</span>
                                {isAns && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      backgroundColor: '#DCFCE7',
                                      color: '#15803D',
                                      padding: '0 4px',
                                      borderRadius: '3px',
                                      marginLeft: '4px',
                                      fontWeight: 600,
                                    }}
                                  >
                                    정답
                                  </span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </td>

                      {/* 정답 번호 */}
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#1B2B5B' }}>
                        {q.answer ?? '-'}번
                      </td>

                      {/* 근거 자료 */}
                      <td>
                        <span className="q-source-text">{q.source || '-'}</span>
                      </td>

                      {/* 해설 */}
                      <td>
                        <div className="q-explanation-text">{q.explanation || '-'}</div>
                      </td>

                      {/* 수정 버튼 (우측 고정 열) */}
                      <td className="col-sticky-action" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          onClick={() => onEditQuestion(q)}
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* [카드형 뷰 모드] (가로 스크롤이 전혀 필요 없는 편리한 뷰) */}
      {viewMode === 'card' && (
        <div className="admin-card-view-list">
          {filteredQuestions.map((q, idx) => {
            const qErrors = errorsByNo.get(q.no) ?? []
            const hasError = qErrors.length > 0
            const isReview = Boolean(q.review)
            const isDuplicateConcept = (conceptCountMap.get((q.concept || '').trim()) ?? 0) > 1

            return (
              <div
                key={`${q.no}-${idx}`}
                id={`q-card-${q.no}`}
                className={`admin-q-card ${hasError ? 'has-error' : ''} ${isReview ? 'is-review' : ''}`}
              >
                {/* 카드 상단 메타 바 */}
                <div className="q-card-header">
                  <div className="q-card-meta">
                    <span className="q-no-badge">{q.no}</span>
                    <span className="tag-domain">{q.domain || '미지정'}</span>
                    <span className={`tag-level level-${q.level}`}>난이도 {q.level || '-'}</span>
                    <span className="tag-concept" title={q.concept}>
                      {q.concept || '-'}
                    </span>
                    {isDuplicateConcept && (
                      <span className="q-warn-badge">개념 중복</span>
                    )}
                    {isReview && <span className="q-review-badge">검토 필요</span>}
                    {hasError && <span className="q-error-badge">오류 {qErrors.length}건</span>}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '5px 12px', fontSize: '0.82rem', fontWeight: 600 }}
                    onClick={() => onEditQuestion(q)}
                  >
                    ✏ 문항 수정
                  </button>
                </div>

                {/* 질문 내용 */}
                <div className="q-card-question">
                  <span className="q-card-label">질문:</span> {q.question}
                </div>

                {hasError && (
                  <div className="q-card-errors">
                    {qErrors.map((e, eIdx) => (
                      <div key={eIdx}>⛔ {e.message}</div>
                    ))}
                  </div>
                )}

                {/* 4지선다 선택지 그리드 */}
                <div className="q-card-choices-grid">
                  {(q.choices || []).map((choice, cIdx) => {
                    const choiceNo = cIdx + 1
                    const isAns = q.answer === choiceNo
                    return (
                      <div
                        key={cIdx}
                        className={`q-card-choice-item ${isAns ? 'is-correct-answer' : ''}`}
                      >
                        <span className="choice-number">{choiceNo}.</span>
                        <span className="choice-text">{choice}</span>
                        {isAns && (
                          <span className="choice-ans-tag">✔ 정답 ({choiceNo}번)</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* 하단 근거 자료 및 해설 바 */}
                <div className="q-card-footer">
                  <div className="q-card-footer-item">
                    <span className="footer-label">근거 자료:</span>
                    <span className="footer-value">{q.source || '-'}</span>
                  </div>
                  <div className="q-card-footer-item">
                    <span className="footer-label">해설:</span>
                    <span className="footer-value">{q.explanation || '-'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

