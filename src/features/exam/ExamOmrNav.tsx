import { useState } from 'react'
import type { FlaggedMap, UserAnswers } from './types'

interface Props {
  totalQuestions: number
  answers: UserAnswers
  flags: FlaggedMap
  onScrollToQuestion: (qNo: number) => void
}

export default function ExamOmrNav({
  totalQuestions,
  answers,
  flags,
  onScrollToQuestion,
}: Props) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)

  const answeredCount = Object.keys(answers).length
  const isAllAnswered = answeredCount >= totalQuestions && totalQuestions > 0

  const handleItemClick = (qNo: number) => {
    onScrollToQuestion(qNo)
    setIsMobileSheetOpen(false)
  }

  const renderGrid = () => {
    const items = []
    for (let i = 1; i <= totalQuestions; i++) {
      const isAnswered = answers[i] !== undefined
      const isFlagged = Boolean(flags[i])

      let statusClass = 'is-unanswered'
      if (isFlagged) {
        statusClass = 'is-flagged'
      } else if (isAnswered) {
        statusClass = 'is-answered'
      }

      items.push(
        <button
          key={i}
          type="button"
          className={`omr-cell ${statusClass}`}
          onClick={() => handleItemClick(i)}
          title={`${i}번 문항으로 이동 (답: ${answers[i] || '미응답'})`}
        >
          <span className="omr-num mono">{i}</span>
          {isFlagged ? (
            <span className="omr-flag-dot" aria-hidden="true">🚩</span>
          ) : isAnswered ? (
            <span className="omr-ans-val mono">{answers[i]}</span>
          ) : null}
        </button>,
      )
    }
    return items
  }

  return (
    <>
      {/* 데스크톱 고정 OMR 패널 */}
      <aside className="exam-omr-desktop" aria-label="답안 마킹 현황">
        <div className="omr-header">
          <h3 className="omr-title">OMR 답안 현황</h3>
          <span className={`omr-progress-chip ${isAllAnswered ? 'is-complete' : ''}`}>
            {answeredCount} / {totalQuestions}
          </span>
        </div>

        <div className="omr-legend">
          <span className="legend-item"><span className="legend-dot dot-answered" />답변</span>
          <span className="legend-item"><span className="legend-dot dot-flagged" />표시</span>
          <span className="legend-item"><span className="legend-dot dot-empty" />미답변</span>
        </div>

        <div className="omr-grid">{renderGrid()}</div>
      </aside>

      {/* 모바일 하단 플로팅 버튼 */}
      <div className="exam-omr-mobile-bar">
        <button
          type="button"
          className={`exam-mobile-omr-btn ${isAllAnswered ? 'is-all-done' : ''}`}
          onClick={() => setIsMobileSheetOpen(true)}
        >
          <span>📋 답안 현황</span>
          <strong className="mono">
            {answeredCount} / {totalQuestions} 완료
          </strong>
        </button>
      </div>

      {/* 모바일 바텀 시트 */}
      {isMobileSheetOpen && (
        <div
          className="exam-omr-bottomsheet-backdrop"
          onClick={() => setIsMobileSheetOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="exam-omr-bottomsheet-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bottomsheet-header">
              <div className="bottomsheet-title-wrap">
                <span className="bottomsheet-handle" />
                <h3>OMR 답안 현황</h3>
                <span className="omr-progress-chip">
                  {answeredCount} / {totalQuestions}
                </span>
              </div>
              <button
                type="button"
                className="bottomsheet-close-btn"
                onClick={() => setIsMobileSheetOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="omr-legend">
              <span className="legend-item"><span className="legend-dot dot-answered" />답변</span>
              <span className="legend-item"><span className="legend-dot dot-flagged" />표시</span>
              <span className="legend-item"><span className="legend-dot dot-empty" />미답변</span>
            </div>

            <div className="omr-grid is-mobile">{renderGrid()}</div>
          </div>
        </div>
      )}
    </>
  )
}
