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
  // 문항 번호별 오류 매핑
  const errorsByNo = new Map<number, ValidationIssue[]>()
  issues.forEach((issue) => {
    if (issue.severity === 'error' && typeof issue.no === 'number') {
      const list = errorsByNo.get(issue.no) ?? []
      list.push(issue)
      errorsByNo.set(issue.no, list)
    }
  })

  // concept 중복 카운트 매핑
  const conceptCountMap = new Map<string, number>()
  questions.forEach((q) => {
    const c = (q.concept || '').trim()
    if (c) {
      conceptCountMap.set(c, (conceptCountMap.get(c) ?? 0) + 1)
    }
  })

  return (
    <div className="admin-table-container">
      <div className="admin-table-toolbar">
        <h4>전체 문항 검토 목록 ({questions.length}문항)</h4>
        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
          * [수정] 버튼을 누르면 질문, 선택지, 정답, 영역, 난이도를 즉시 수정할 수 있습니다.
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-exam-table">
          <thead>
            <tr>
              <th style={{ width: '48px', textAlign: 'center' }}>번호</th>
              <th style={{ width: '70px', textAlign: 'center' }}>상태</th>
              <th style={{ width: '110px' }}>영역 (domain)</th>
              <th style={{ width: '60px', textAlign: 'center' }}>난이도</th>
              <th style={{ width: '130px' }}>핵심 개념 (concept)</th>
              <th style={{ minWidth: '220px' }}>질문 (question)</th>
              <th style={{ minWidth: '240px' }}>선택지 4개 (choices)</th>
              <th style={{ width: '50px', textAlign: 'center' }}>정답</th>
              <th style={{ width: '120px' }}>근거 자료 (source)</th>
              <th style={{ minWidth: '180px' }}>해설 (explanation)</th>
              <th style={{ width: '64px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, idx) => {
              const qErrors = errorsByNo.get(q.no) ?? []
              const hasError = qErrors.length > 0
              const isReview = Boolean(q.review)
              const isDuplicateConcept = (conceptCountMap.get((q.concept || '').trim()) ?? 0) > 1

              return (
                <tr
                  key={`${q.no}-${idx}`}
                  className={`${hasError ? 'has-error' : ''} ${isReview ? 'is-review' : ''}`}
                >
                  {/* 문항 번호 */}
                  <td style={{ textAlign: 'center' }}>
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

                  {/* 수정 버튼 */}
                  <td style={{ textAlign: 'center' }}>
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
  )
}
