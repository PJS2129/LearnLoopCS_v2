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
  onStartExam: (stream: MediaStream | null, cameraAgreed: boolean) => void
  onBackToCode: () => void
  isStarting: boolean
  errorMsg?: string | null
  previewMode?: boolean
}

export default function ExamConsentView({
  examInfo,
  enteredCode,
  profile,
  onStartExam,
  onBackToCode,
  isStarting,
  errorMsg,
  previewMode = false,
}: Props) {
  const [agreed, setAgreed] = useState(false)
  const [cameraAgreed, setCameraAgreed] = useState(false)
  const [isRequestingCamera, setIsRequestingCamera] = useState(false)

  const handleStartClick = async () => {
    if (previewMode) {
      onStartExam(null, false)
      return
    }

    let stream: MediaStream | null = null
    if (cameraAgreed && navigator.mediaDevices?.getUserMedia) {
      setIsRequestingCamera(true)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: { ideal: 15 } },
          audio: false,
        })
      } catch (err) {
        console.warn('[ExamConsentView] 카메라 권한 거부 또는 장치 없음 (정상 계속 진행):', err)
      } finally {
        setIsRequestingCamera(false)
      }
    }
    onStartExam(stream, cameraAgreed && stream !== null)
  }

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

          {/* 6단계 응시 집중 보조 기능 안내 */}
          <div className="rule-item">
            <div className="rule-icon">
              <span>📹</span>
            </div>
            <div className="rule-content">
              <strong>응시 집중 보조 장치 (웹캠 안내)</strong>
              <p>
                공정한 평가 환경을 위해 <strong>웹캠 얼굴 감지 보조 기능(선택)</strong>을 지원합니다.
              </p>
              <p className="rule-sub-note">
                • <strong>개인정보 보호:</strong> 웹캠 영상 및 사진은 서버로 전송되거나 저장되지 않으며 기기 내부에서 얼굴 유무 감지용으로만 일시 작동합니다.<br />
                • <strong>자동 불이익 없음:</strong> 기록은 교수자의 사후 확인 자료로만 쓰이며, 시스템에 의한 자동 감점이나 강제 종료는 없습니다.<br />
                • <strong>카메라 미동의/미사용:</strong> 카메라를 거부하거나 지원하지 않는 기기에서도 시험 응시는 정상 허용됩니다.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="exam-consent-error" role="alert">
            <strong>입장 오류:</strong> {errorMsg}
          </div>
        )}

        {/* 카메라 사용 동의 체크 (선택) */}
        <label className="exam-consent-checkbox-wrap" style={{ marginBottom: '12px' }}>
          <input
            type="checkbox"
            checked={cameraAgreed}
            onChange={(e) => setCameraAgreed(e.target.checked)}
            disabled={isStarting}
          />
          <span className="custom-check-box" aria-hidden="true">
            {cameraAgreed && <CheckIcon size={14} />}
          </span>
          <span className="consent-text">
            <strong>(선택)</strong> 웹캠을 통한 응시 보조 기능(얼굴 이탈 및 다수 인원 알림) 사용에 동의합니다. (미동의 시에도 응시 가능)
          </span>
        </label>

        {/* 필수 응시 서약 체크박스 */}
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
            <strong>(필수)</strong> 위 유의사항 및 마감 규칙을 모두 확인하였으며, 타인의 도움 없이 정직하게 시험에 응시할 것을 서약합니다.
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
            disabled={!agreed || isStarting || isRequestingCamera}
            onClick={handleStartClick}
          >
            {isRequestingCamera
              ? '카메라 권한 확인 중...'
              : isStarting
              ? '입장 세션 생성 중...'
              : '시험 시작하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
