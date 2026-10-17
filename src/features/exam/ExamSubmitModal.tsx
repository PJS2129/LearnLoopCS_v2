import { ShieldIcon } from '../../components/Icon'

interface Props {
  unansweredList: number[]
  totalCount: number
  onClose: () => void
  onNavigateToQuestion: (qNo: number) => void
  onConfirmSubmit: () => void
}

export default function ExamSubmitModal({
  unansweredList,
  totalCount,
  onClose,
  onNavigateToQuestion,
  onConfirmSubmit,
}: Props) {
  const hasUnanswered = unansweredList.length > 0

  const handleGoQuestion = (qNo: number) => {
    onClose()
    onNavigateToQuestion(qNo)
  }

  const handleProceedSubmit = () => {
    onClose()
    onConfirmSubmit()
  }

  return (
    <div className="exam-modal-backdrop" role="dialog" aria-modal="true">
      <div className="exam-modal-card">
        <div className="exam-modal-icon-wrap" aria-hidden="true">
          {hasUnanswered ? '⚠️' : '✅'}
        </div>

        <h3 className="exam-modal-title">
          {hasUnanswered ? '미답변 문항이 있습니다' : '시험지를 최종 제출하시겠습니까?'}
        </h3>

        <p className="exam-modal-text">
          {hasUnanswered ? (
            <>
              총 {totalCount}문항 중 <strong>{unansweredList.length}문항</strong>에 답변하지 않았습니다.
              미답변 문항은 오답으로 처리됩니다.
            </>
          ) : (
            <>
              모든 문항({totalCount}문항)에 답변을 완료하셨습니다. 제출 후에는 답안을 다시 수정할 수 없습니다.
            </>
          )}
        </p>

        {hasUnanswered && (
          <div className="unanswered-badge-box">
            <span className="unanswered-label">미답변 문항 (클릭 시 해당 문제로 이동):</span>
            <div className="unanswered-grid">
              {unansweredList.map((no) => (
                <button
                  key={no}
                  type="button"
                  className="unanswered-pill mono"
                  onClick={() => handleGoQuestion(no)}
                >
                  Q{no}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="exam-modal-actions">
          {hasUnanswered ? (
            <>
              <button
                type="button"
                className="exam-modal-btn is-secondary"
                onClick={() => handleGoQuestion(unansweredList[0])}
              >
                문제 풀러가기
              </button>
              <button
                type="button"
                className="exam-modal-btn is-danger-outline"
                onClick={handleProceedSubmit}
              >
                그대로 제출하기
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="exam-modal-btn is-secondary"
                onClick={onClose}
              >
                다시 검토하기
              </button>
              <button
                type="button"
                className="exam-modal-btn is-primary"
                onClick={handleProceedSubmit}
              >
                <ShieldIcon size={16} />
                <span>시험지 최종 제출하기</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
