import { RotateCcwIcon, ShieldIcon } from '../../components/Icon'
import type { ExamErrorKind } from './types'

interface Props {
  errorKind: ExamErrorKind
  errorMsg: string
  examId: string
  onRetry: () => void
}

export default function ExamErrorView({
  errorKind,
  errorMsg,
  examId,
  onRetry,
}: Props) {
  const getErrorContent = () => {
    switch (errorKind) {
      case 'permission':
        return {
          icon: '🛡️',
          badgeText: '접근 권한 오류 (403)',
          badgeClass: 'exam-error-badge-permission',
          title: '시험 정보 접근 권한이 없습니다',
          desc: '학생 계정으로 시험 정보를 읽을 수 있는 보안 규칙이 적용되지 않았거나 승인되지 않은 상태입니다.',
          guideTitle: '조치 방법',
          guideList: [
            '관리자 계정으로 Firestore 보안 규칙(rules)이 최신 배포되었는지 확인하세요.',
            '배포 명령어: firebase deploy --only firestore:rules',
            '로그인 계정이 장안대학교 학생 인증 계정인지 확인하세요.',
          ],
        }
      case 'network':
        return {
          icon: '📡',
          badgeText: '네트워크 연결 오류',
          badgeClass: 'exam-error-badge-network',
          title: '서버와 통신할 수 없습니다',
          desc: '인터넷 연결이 끊겼거나 일시적인 네트워크 장애로 시험 서버에 연결하지 못했습니다.',
          guideTitle: '조치 방법',
          guideList: [
            '와이파이 또는 모바일 네트워크 연결 상태를 확인하세요.',
            '잠시 후 아래 [다시 시도] 버튼을 눌러 상태를 다시 조회하세요.',
          ],
        }
      case 'not_found':
        return {
          icon: '🔍',
          badgeText: '시험 문서 없음 (404)',
          badgeClass: 'exam-error-badge-notfound',
          title: '등록된 시험 정보를 찾을 수 없습니다',
          desc: `요청하신 시험(ID: ${examId})이 아직 개설되지 않았거나 관리자 승인이 완료되지 않았습니다.`,
          guideTitle: '조치 방법',
          guideList: [
            '교수자가 관리자 탭에서 [문항 점검 완료] 및 시험 등록을 마쳤는지 확인하세요.',
            '시험 ID 설정이 올바른지 확인하세요.',
          ],
        }
      case 'unknown':
      default:
        return {
          icon: '⚠️',
          badgeText: '시스템 오류',
          badgeClass: 'exam-error-badge-unknown',
          title: '시험 정보를 불러오지 못했습니다',
          desc: errorMsg || '알 수 없는 오류로 시험 상태를 확인하지 못했습니다.',
          guideTitle: '조치 방법',
          guideList: [
            '브라우저를 새로고침하거나 잠시 후 다시 시도해 주세요.',
            '오류가 지속되면 관리자에게 문의하세요.',
          ],
        }
    }
  }

  const content = getErrorContent()

  return (
    <div className="exam-locked-container">
      <div className="exam-locked-card exam-error-card">
        <div className="exam-locked-icon-wrap" aria-hidden="true">
          {content.icon}
        </div>

        <span className={`exam-locked-badge ${content.badgeClass}`}>
          {content.badgeText}
        </span>

        <h2 className="exam-locked-title exam-error-title">{content.title}</h2>

        <p className="exam-locked-desc">{content.desc}</p>

        {errorMsg && (
          <div className="exam-error-detail-box">
            <span className="exam-error-detail-label">상세 오류 메시지:</span>
            <code className="exam-error-detail-text">{errorMsg}</code>
          </div>
        )}

        <div className="exam-error-guide-box">
          <div className="exam-error-guide-header">
            <ShieldIcon size={16} />
            <strong>{content.guideTitle}</strong>
          </div>
          <ul className="exam-error-guide-list">
            {content.guideList.map((g, idx) => (
              <li key={idx}>{g}</li>
            ))}
          </ul>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="button"
            className="exam-refresh-status-btn exam-retry-btn"
            onClick={onRetry}
          >
            <RotateCcwIcon size={14} />
            <span>다시 시도 (상태 새로고침)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
