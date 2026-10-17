import { ShieldIcon, ClockIcon } from '../../components/Icon'
import type { StudentProfile } from '../../lib/types'
import type { ExamInfo } from './types'

interface Props {
  examInfo: ExamInfo
  profile: StudentProfile
  submittedAt: string
  receiptId?: string
}

export default function ExamReceiptView({
  examInfo,
  profile,
  submittedAt,
  receiptId,
}: Props) {
  return (
    <div className="exam-receipt-container">
      <div className="exam-receipt-card">
        {/* 상단 Navy -> Blue -> Gold 그라데이션 라인 */}
        <div className="exam-receipt-gradient-line" />

        <div className="exam-receipt-body">
          {/* 큰 초록 체크 원 */}
          <div className="exam-receipt-check-circle" aria-hidden="true">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 className="exam-receipt-title">시험 답안이 정상적으로 접수되었습니다</h2>
          <p className="exam-receipt-desc">
            답안지 제출이 완료되어 안전하게 저장되었습니다. 제출된 답안은 이후 수정할 수 없습니다.
          </p>

          {/* 접수 정보 표 */}
          <div className="exam-receipt-table-box">
            <table className="exam-receipt-table">
              <tbody>
                <tr>
                  <th scope="row">접수 번호</th>
                  <td className="mono"><strong>{receiptId || `REC-${examInfo.examId}`}</strong></td>
                </tr>
                <tr>
                  <th scope="row">응시 과목</th>
                  <td>컴퓨터공학개론</td>
                </tr>
                <tr>
                  <th scope="row">시험명</th>
                  <td><strong>{examInfo.examName}</strong></td>
                </tr>
                <tr>
                  <th scope="row">시험 일시</th>
                  <td>{examInfo.examDate || '2026.4.22.(수) 11:30'}</td>
                </tr>
                <tr>
                  <th scope="row">제출 학생</th>
                  <td>
                    {profile.name} <span className="mono">({profile.studentId} / {profile.section})</span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">제출 시각</th>
                  <td className="mono">
                    <ClockIcon size={14} />
                    <span>{submittedAt}</span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">제출 상태</th>
                  <td>
                    <span className="exam-receipt-lock-badge">
                      <ShieldIcon size={14} />
                      <span>제출 완료 (수정 불가)</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 점수 미표시 및 성적 공개 안내 박스 */}
          <div className="exam-receipt-notice-box">
            <ShieldIcon size={18} />
            <div className="notice-text">
              <strong>안내:</strong> 점수는 표시되지 않습니다. 성적은 교수자가 검토 및 채점 결과를 공개한 뒤 본 <strong>[시험]</strong> 탭에서 확인하실 수 있습니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
