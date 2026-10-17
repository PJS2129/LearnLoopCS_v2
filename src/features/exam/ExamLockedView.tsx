import { ShieldIcon, ClockIcon } from '../../components/Icon'
import type { ExamInfo } from './types'

interface Props {
  examInfo: ExamInfo | null
}

export default function ExamLockedView({ examInfo }: Props) {
  const isClosed = examInfo?.status === 'closed'

  return (
    <div className="exam-locked-container">
      <div className="exam-locked-card">
        <div className="exam-locked-icon-wrap" aria-hidden="true">
          {isClosed ? '🏁' : '🔒'}
        </div>

        <span className="exam-locked-badge">
          {isClosed ? '시험 마감됨' : '시험 준비 중'}
        </span>

        <h2 className="exam-locked-title">
          {isClosed
            ? '시험이 종료되었습니다'
            : '아직 시험이 열리지 않았습니다'}
        </h2>

        <p className="exam-locked-desc">
          {isClosed
            ? '본 시험의 응시 기간이 마감되었습니다. 성적 공개 후 [내 결과] 화면에서 확인하실 수 있습니다.'
            : '교수자가 시험을 개방하면 시험 코드를 입력하여 입장하실 수 있습니다. 잠시만 기다려 주세요.'}
        </p>

        {examInfo && (
          <div className="exam-locked-info-box">
            <div className="exam-locked-info-row">
              <span className="info-label">시험명</span>
              <strong className="info-val">{examInfo.examName}</strong>
            </div>

            <div className="exam-locked-info-row">
              <span className="info-label">시험 일시</span>
              <span className="info-val">
                <ClockIcon size={14} />
                <span>{examInfo.examDate || '2026.4.22.(수) 11:30'}</span>
              </span>
            </div>

            <div className="exam-locked-info-row">
              <span className="info-label">문항 수 / 제한시간</span>
              <span className="info-val mono">
                총 {examInfo.questionCount}문항 / {examInfo.durationMinutes || 50}분
              </span>
            </div>
          </div>
        )}

        <div className="exam-locked-notice">
          <ShieldIcon size={16} />
          <span>시험이 시작되면 브라우저를 새로고침하거나 탭을 닫아도 잔여 시간이 계속 측정됩니다.</span>
        </div>
      </div>
    </div>
  )
}
