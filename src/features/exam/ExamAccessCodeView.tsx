import { useState, type FormEvent } from 'react'
import { ShieldIcon, ArrowRightIcon } from '../../components/Icon'
import type { ExamInfo } from './types'

interface Props {
  examInfo: ExamInfo
  onCodeSubmit: (code: string) => void
  errorMsg?: string | null
}

export default function ExamAccessCodeView({
  examInfo,
  onCodeSubmit,
  errorMsg,
}: Props) {
  const [code, setCode] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setLocalError('시험 코드를 입력해 주세요.')
      return
    }
    if (trimmed.length < 4) {
      setLocalError('시험 코드는 4자리 이상입니다.')
      return
    }
    setLocalError(null)
    onCodeSubmit(trimmed)
  }

  const displayError = errorMsg || localError

  return (
    <div className="exam-code-container">
      <div className="exam-code-card">
        <div className="exam-code-badge">
          <span>시험 진행 중</span>
        </div>

        <h2 className="exam-code-title">{examInfo.examName}</h2>
        <p className="exam-code-subtitle">
          교수자가 안내한 <strong>시험 코드</strong>를 입력하여 응시 준비를 시작하세요.
        </p>

        <form onSubmit={handleSubmit} className="exam-code-form">
          <div className="exam-code-input-wrap">
            <label htmlFor="exam-access-code" className="sr-only">
              시험 코드
            </label>
            <input
              id="exam-access-code"
              type="text"
              autoFocus
              autoComplete="off"
              className="exam-code-input mono"
              placeholder="시험 코드 입력"
              value={code}
              maxLength={10}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setLocalError(null)
              }}
            />
          </div>

          {displayError && (
            <div className="exam-code-error" role="alert">
              ⚠️ {displayError}
            </div>
          )}

          <button type="submit" className="exam-code-btn">
            <span>응시 안내 및 동의로 이동</span>
            <ArrowRightIcon size={18} />
          </button>
        </form>

        <div className="exam-code-footer-info">
          <div className="footer-item">
            <span className="footer-label">제한시간</span>
            <strong className="mono">{examInfo.durationMinutes || 50}분</strong>
          </div>
          <div className="footer-divider" />
          <div className="footer-item">
            <span className="footer-label">문항 수</span>
            <strong className="mono">{examInfo.questionCount}문항 (4지선다)</strong>
          </div>
        </div>

        <div className="exam-code-secure-notice">
          <ShieldIcon size={14} />
          <span>시험 코드는 관리자 서버 검증을 통해 보호되며, 불일치 시 입장이 승인되지 않습니다.</span>
        </div>
      </div>
    </div>
  )
}
