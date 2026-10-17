import { useState } from 'react'
import Modal from '../../components/Modal'
import type { ExamPackage } from './types'

interface FinalizeConfirmModalProps {
  examPackage: ExamPackage
  onClose: () => void
  onConfirm: (examId: string) => Promise<void>
}

export default function FinalizeConfirmModal({
  examPackage,
  onClose,
  onConfirm,
}: FinalizeConfirmModalProps) {
  // 기본 시험ID 제안 (예: midterm-2026)
  const defaultExamId = 'midterm-2026'
  const [examId, setExamId] = useState(defaultExamId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleConfirm = async () => {
    const trimmedId = examId.trim()
    if (!trimmedId) {
      setErrorMessage('시험ID를 입력해 주세요.')
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
      setErrorMessage('시험ID는 영문, 숫자, 하이픈(-), 밑줄(_)만 사용할 수 있습니다.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      await onConfirm(trimmedId)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err))
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      title="문항 점검 완료 및 시험 확정"
      onClose={isSubmitting ? () => {} : onClose}
      actions={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting ? '확정 저장 중...' : '점검 완료 및 확정 저장'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>
          총 <strong>{examPackage.questions.length}문항</strong>에 대한 형식 검사를 마쳤으며,
          정답표와 시험 문항을 시스템에 정식 확정합니다.
        </p>

        {/* 시험 ID 입력 */}
        <div>
          <label
            htmlFor="exam-id-input"
            style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#334155',
              marginBottom: '6px',
            }}
          >
            시험 식별자 (시험ID)
          </label>
          <input
            id="exam-id-input"
            type="text"
            className="form-control"
            value={examId}
            disabled={isSubmitting}
            onChange={(e) => setExamId(e.target.value)}
            placeholder="예: midterm-2026"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontFamily: 'monospace',
              fontSize: '0.95rem',
            }}
          />
          <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
            시트 정답표와 Firestore 문서의 고유 ID로 사용됩니다.
          </small>
        </div>

        {/* 요약 박스 */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.85rem',
            color: '#334155',
          }}
        >
          <div style={{ marginBottom: '6px' }}>
            <strong>시험명:</strong> {examPackage.exam}
          </div>
          <div>
            <strong>확정 대상:</strong> {examPackage.questions.length}문항 ({examPackage.domains.join(', ')})
          </div>
        </div>

        {/* 저장 절차 및 주의사항 안내 */}
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.82rem',
            color: '#1e40af',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>저장 및 초안 처리 절차</div>
          <ol style={{ margin: 0, paddingLeft: '18px' }}>
            <li>
              <strong>구글 시트 [정답표]</strong>: 정답, 해설, 핵심개념, 출처를 포함한 전체 정답표가 안전하게 저장됩니다.
            </li>
            <li>
              <strong>Firestore</strong>: 학생 시험용으로 정답·해설·핵심개념·출처를 제외한 순수 문항(번호, 영역, 난이도, 질문, 선택지)만 저장됩니다.
            </li>
            <li>
              <strong>초안 삭제</strong>: 확정 완료 후 브라우저 임시 초안은 자동으로 비워집니다. 추후 수정이 필요한 경우 <em>03 AI 초안</em> 폴더의 원본 JSON을 다시 가져올 수 있습니다.
            </li>
          </ol>
        </div>

        {errorMessage && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.85rem',
            }}
          >
            {errorMessage}
          </div>
        )}
      </div>
    </Modal>
  )
}
