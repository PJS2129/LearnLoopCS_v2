import type { StudentExamQuestion } from './types'

interface Props {
  question: StudentExamQuestion
  selectedChoice?: number // 1 ~ 4
  isFlagged?: boolean
  isHighlightedUnanswered?: boolean
  correctChoice?: number
  onSelectChoice: (qNo: number, choiceNo: number) => void
  onToggleFlag: (qNo: number) => void
}

export default function ExamQuestionCard({
  question,
  selectedChoice,
  isFlagged,
  isHighlightedUnanswered,
  correctChoice,
  onSelectChoice,
  onToggleFlag,
}: Props) {
  // 질문 텍스트 \n 줄바꿈 지원
  const questionLines = question.question.split('\n')

  return (
    <article
      id={`exam-q-${question.no}`}
      className={`exam-q-card ${isHighlightedUnanswered ? 'is-unanswered-pulse' : ''}`}
    >
      {/* 문항 상단 바 */}
      <div className="exam-q-top-bar">
        <div className="exam-q-top-left">
          <span className="exam-q-no-badge mono">Q{question.no}</span>
          <span className="exam-q-domain-chip">{question.domain}</span>
          <span className="exam-q-score-tag">2.5점</span>
        </div>

        <button
          type="button"
          className={`exam-q-flag-btn ${isFlagged ? 'is-flagged' : ''}`}
          onClick={() => onToggleFlag(question.no)}
          aria-label={isFlagged ? '다시 볼 문항 표시 해제' : '다시 볼 문항으로 표시'}
          title={isFlagged ? '다시 볼 문항 표시 해제' : '다시 볼 문항으로 표시'}
        >
          <span className="flag-icon" aria-hidden="true">🚩</span>
          <span className="flag-text">{isFlagged ? '다시 볼 문항' : '표시'}</span>
        </button>
      </div>

      {/* 질문 본문 */}
      <div className="exam-q-body">
        {questionLines.map((line, idx) => (
          <p key={idx} className="exam-q-text">
            {line || '\u00A0'}
          </p>
        ))}
      </div>

      {/* 4지선다 선택지 목록 */}
      <div className="exam-q-choices" role="radiogroup" aria-label={`${question.no}번 선택지`}>
        {question.choices.map((choiceText, idx) => {
          const choiceNo = idx + 1
          const isSelected = selectedChoice === choiceNo
          const isCorrect = correctChoice === choiceNo

          return (
            <button
              key={choiceNo}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`exam-choice-btn ${isSelected ? 'is-selected' : ''} ${isCorrect ? 'is-preview-correct' : ''}`}
              onClick={() => onSelectChoice(question.no, choiceNo)}
            >
              <span className={`choice-num-badge ${isSelected ? 'is-selected' : ''}`}>
                {choiceNo}
              </span>
              <span className="choice-text">{choiceText}</span>
              {isCorrect && (
                <span className="exam-preview-answer-tag" aria-label="정답">
                  정답
                </span>
              )}
            </button>
          )
        })}
      </div>
    </article>
  )
}
