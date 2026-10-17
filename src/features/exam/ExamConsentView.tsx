import { useState } from 'react'
import {
  CheckIcon,
  ClockIcon,
  ExamIcon,
  ShieldIcon,
} from '../../components/Icon'
import type { StudentProfile } from '../../lib/types'
import type { ExamInfo } from './types'

interface Props {
  examInfo: ExamInfo
  enteredCode: string
  profile: StudentProfile
  onStartExam: () => void
  onBackToCode: () => void
  isStarting: boolean
  errorMsg?: string | null
}

export default function ExamConsentView({
  examInfo,
  enteredCode,
  profile,
  onStartExam,
  onBackToCode,
  isStarting,
  errorMsg,
}: Props) {
  const [agreed, setAgreed] = useState(false)

  const durationMin = examInfo.durationMinutes || 50
  const questionCount = examInfo.questionCount || 40

  return (
    <div className="exam-consent-container">
      <div className="exam-consent-card">
        {/* 상단 라인 및 헤더 */}
        <div className="exam-consent-header">
          <span className="exam-badge-gold">응시 서약 및 유의사항</span>
          <h2 className="exam-consent-title">{examInfo.examName} 응시 안내</h2>
          <p className="exam-consent-desc">
            본 시험은 공정하고 엄격한 평가 환경을 위해 시스템 규칙에 따라 진행됩니다. 아래 내용을 확인 후 동의해 주세요.
          </p>
        </div>

        {/* 응시자 인적사항 확인 박스 */}
        <div className="exam-student-box">
          <div className="student-box-title">응시자 정보 확인</div>
          <div className="student-box-grid">
            <div>
              <span className="s-label">성명</span>
              <strong className="s-val">{profile.name}</strong>
            </div>
            <div>
              <span className="s-label">학번</span>
              <strong className="s-val mono">{profile.studentId}</strong>
            </div>
            <div>
              <span className="s-label">분반</span>
              <strong className="s-val">{profile.section}</strong>
            </div>
            <div>
              <span className="s-label">입력 코드</span>
              <span className="s-val mono code-tag">{enteredCode}</span>
            </div>
          </div>
        </div>

        {/* 주요 응시 규칙 및 유의사항 */}
        <div className="exam-rules-list">
          <div className="rule-item">
            <div className="rule-icon">
              <ClockIcon size={20} />
            </div>
            <div className="rule-content">
              <strong>제한시간 및 입장 기준</strong>
              <p>
                본 시험의 제한시간은 <strong>{durationMin}분</strong>(총 {questionCount}문항)입니다.
                <strong> [시험 시작]</strong>을 누르는 순간 서버 시각이 입장 시각으로 기록되며 타이머가 작동합니다.
              </p>
              <p className="rule-highlight">
                ⚠️ <strong>시험 마감 시각 안내:</strong> 시험 전체 마감 시각이 정해져 있으므로, 늦게 입장한 경우 잔여 시간만큼만 응시할 수 있습니다. (개인 종료 시각 = 입장 시각 + {durationMin}분과 시험 마감 시각 중 빠른 시각)
              </p>
            </div>
          </div>

          <div className="rule-item">
            <div className="rule-icon">
              <ExamIcon size={20} />
            </div>
            <div className="rule-content">
              <strong>답안 보관 및 새로고침</strong>
              <p>
                선택한 답안은 브라우저에 실시간 보관되므로 페이지를 새로고침하거나 실수로 닫아도 복구됩니다.
                단, 타이머는 백그라운드에서도 쉬지 않고 계속 진행됩니다.
              </p>
            </div>
          </div>

          <div className="rule-item">
            <div className="rule-icon">
              <ShieldIcon size={20} />
            </div>
            <div className="rule-content">
              <strong>제출 후 수정 불가 원칙</strong>
              <p>
                [시험지 최종 제출하기]를 누르거나 제한시간이 종료되어 자동 제출되면 어떠한 경우에도 답안을 다시 수정할 수 없습니다.
              </p>
            </div>
          </div>

          {/* 6단계 보조 기능 예고 자리 (준비 중 표시) */}
          <div className="rule-item is-upcoming">
            <div className="rule-icon">
              <span>📹</span>
            </div>
            <div className="rule-content">
              <div className="upcoming-header">
                <strong>응시 집중 보조 기능 (탭 이탈 및 웹캠 감지)</strong>
                <span className="upcoming-chip">6단계 준비 중</span>
              </div>
              <p>
                공정한 응시 환경을 위한 탭 이탈 횟수 기록 및 카메라 화면 이탈 감지 기능은 추후 6단계에서 정식 적용될 예정입니다. (현재 단계에서는 작동하지 않습니다)
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="exam-consent-error" role="alert">
            <strong>입장 오류:</strong> {errorMsg}
          </div>
        )}

        {/* 동의 체크박스 */}
        <label className="exam-consent-checkbox-wrap">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={isStarting}
          />
          <span className="custom-check-box" aria-hidden="true">
            {agreed && <CheckIcon size={14} />}
          </span>
          <span className="consent-text">
            위 유의사항 및 마감 규칙을 모두 확인하였으며, 타인의 도움 없이 정직하게 시험에 응시할 것을 서약합니다.
          </span>
        </label>

        {/* 하단 버튼 */}
        <div className="exam-consent-actions">
          <button
            type="button"
            className="exam-back-btn"
            onClick={onBackToCode}
            disabled={isStarting}
          >
            코드 다시 입력
          </button>
          <button
            type="button"
            className="exam-start-btn"
            disabled={!agreed || isStarting}
            onClick={onStartExam}
          >
            {isStarting ? '입장 세션 생성 중...' : '시험 시작하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
