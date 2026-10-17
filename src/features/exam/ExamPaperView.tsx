import { useState } from 'react'
import {
  ClockIcon,
  ExamIcon,
  ShieldIcon,
} from '../../components/Icon'
import type { StudentProfile } from '../../lib/types'
import {
  loadStoredAnswers,
  loadStoredFlags,
  saveStoredAnswers,
  saveStoredFlags,
  saveSubmission,
} from './examStorage'
import ExamOmrNav from './ExamOmrNav'
import ExamQuestionCard from './ExamQuestionCard'
import ExamSubmitModal from './ExamSubmitModal'
import type {
  ExamInfo,
  ExamSession,
  FlaggedMap,
  StudentExamQuestion,
  UserAnswers,
} from './types'
import { useExamTimer } from './useExamTimer'

interface Props {
  examInfo: ExamInfo
  session: ExamSession
  profile: StudentProfile
  questions: StudentExamQuestion[]
  onSubmitComplete?: (submittedAt: string) => void
}

export default function ExamPaperView({
  examInfo,
  session,
  profile,
  questions,
  onSubmitComplete,
}: Props) {
  // 로컬 저장소에서 기존 답안 및 깃발 복원
  const [answers, setAnswers] = useState<UserAnswers>(() =>
    loadStoredAnswers(examInfo.examId, session.uid),
  )
  const [flags, setFlags] = useState<FlaggedMap>(() =>
    loadStoredFlags(examInfo.examId, session.uid),
  )

  // 미답변 문항 하이라이트 (제출 시도 시)
  const [highlightedUnanswered, setHighlightedUnanswered] = useState<number[]>([])
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false)

  // 타이머 훅 연동
  const timer = useExamTimer(session.individualEndAt, () => {
    setIsExpiredModalOpen(true)
  })

  // 답안 변경 시 localStorage 자동 보관
  const handleSelectChoice = (qNo: number, choiceNo: number) => {
    if (timer.isExpired) return
    setAnswers((prev) => {
      const next = { ...prev, [qNo]: choiceNo }
      saveStoredAnswers(examInfo.examId, session.uid, next)
      return next
    })
    // 미답변 하이라이트 해제
    setHighlightedUnanswered((prev) => prev.filter((n) => n !== qNo))
  }

  // 깃발 토글
  const handleToggleFlag = (qNo: number) => {
    if (timer.isExpired) return
    setFlags((prev) => {
      const next = { ...prev, [qNo]: !prev[qNo] }
      saveStoredFlags(examInfo.examId, session.uid, next)
      return next
    })
  }

  // 문항 스크롤 이동
  const handleScrollToQuestion = (qNo: number) => {
    const el = document.getElementById(`exam-q-${qNo}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // 제출 버튼 클릭
  const handleClickSubmit = () => {
    const unanswered: number[] = []
    for (const q of questions) {
      if (answers[q.no] === undefined) {
        unanswered.push(q.no)
      }
    }
    setHighlightedUnanswered(unanswered)
    setIsSubmitModalOpen(true)
  }

  // 제출 확정 시 접수 화면으로 전환
  const handleConfirmSubmit = () => {
    const now = new Date()
    const nowStr = now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    saveSubmission(examInfo.examId, session.uid, nowStr)
    onSubmitComplete?.(nowStr)
  }

  const totalCount = questions.length
  const answeredCount = Object.keys(answers).length
  const isAllAnswered = answeredCount >= totalCount && totalCount > 0

  return (
    <div className="exam-paper-container">
      {/* 상단 고정 바 (Sticky Header) */}
      <header className="exam-sticky-bar" role="banner">
        <div className="exam-sticky-inner">
          <div className="exam-sticky-left">
            <span className="exam-sticky-title">{examInfo.examName}</span>
            <span className="exam-sticky-student mono">
              {profile.name} ({profile.studentId})
            </span>
          </div>

          <div className="exam-sticky-right">
            {/* 진행 상태 배지 */}
            <div
              className={`exam-progress-badge ${isAllAnswered ? 'is-complete' : ''}`}
            >
              <ExamIcon size={16} />
              <span className="mono">
                {answeredCount} / {totalCount} 완료
              </span>
            </div>

            {/* 타이머 배지 */}
            <div
              className={`exam-timer-badge ${
                timer.isWarning1Min
                  ? 'is-danger-pulse'
                  : timer.isWarning5Min
                  ? 'is-warning'
                  : ''
              } ${timer.isExpired ? 'is-expired' : ''}`}
              title="남은 시험 시간"
            >
              <ClockIcon size={16} />
              <span className="mono timer-digits">
                {timer.isExpired ? '시간 종료' : timer.formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* 5분 전/1분 전 안내 띠 */}
        {timer.isWarning1Min && !timer.isExpired && (
          <div className="exam-sticky-warning-banner is-danger">
            🚨 시험 종료까지 1분 남았습니다! 작성 중인 답안을 확인하세요.
          </div>
        )}
        {timer.isWarning5Min && !timer.isWarning1Min && (
          <div className="exam-sticky-warning-banner is-warning">
            ⏳ 시험 종료 5분 전입니다. OMR 현황을 확인하고 미답변 문항을 체크하세요.
          </div>
        )}
      </header>

      {/* 시험지 본문 영역 (가운데 정렬 약 900px + 우측 OMR) */}
      <div className="exam-paper-layout">
        <main className="exam-paper-main" role="main">
          {/* 시험지 헤더 카드 */}
          <section className="exam-header-card">
            <div className="exam-header-top-line" />
            <div className="exam-header-content">
              <div className="exam-header-dept-badge">
                장안대학교 컴퓨터공학과
              </div>
              <h1 className="exam-header-title">{examInfo.examName}</h1>
              <p className="exam-header-subtitle">
                {examInfo.examDate || '2026.4.22.(수) 11:30'} | 컴퓨터공학개론 (총 {totalCount}문항 / 문항당 2.5점 / 100점 만점)
              </p>

              {/* 응시자 정보 (읽기 전용) */}
              <div className="exam-header-student-strip">
                <div className="strip-item">
                  <span className="strip-label">성명</span>
                  <strong className="strip-val">{profile.name}</strong>
                </div>
                <div className="strip-divider" />
                <div className="strip-item">
                  <span className="strip-label">학번</span>
                  <strong className="strip-val mono">{profile.studentId}</strong>
                </div>
                <div className="strip-divider" />
                <div className="strip-item">
                  <span className="strip-label">분반</span>
                  <strong className="strip-val">{profile.section}</strong>
                </div>
              </div>

              {/* 노란 유의사항 박스 */}
              <div className="exam-header-notice-box">
                <ShieldIcon size={16} />
                <div className="notice-content">
                  <strong>유의사항:</strong> 각 문항의 질문을 주의 깊게 읽고 가장 알맞은 답을 하나만 선택하세요.
                  문항 카드의 🚩 깃발 버튼을 누르면 다시 검토할 문항으로 표시됩니다.
                </div>
              </div>
            </div>
          </section>

          {/* 문항 목록 */}
          <section className="exam-questions-section" aria-label="시험 문항">
            {questions.map((q) => (
              <ExamQuestionCard
                key={q.no}
                question={q}
                selectedChoice={answers[q.no]}
                isFlagged={Boolean(flags[q.no])}
                isHighlightedUnanswered={highlightedUnanswered.includes(q.no)}
                onSelectChoice={handleSelectChoice}
                onToggleFlag={handleToggleFlag}
              />
            ))}
          </section>

          {/* 하단 최종 제출 영역 */}
          <section className="exam-submit-bottom-card">
            <p className="submit-prompt-text">
              모든 답안을 꼼꼼하게 검토하셨나요?
            </p>
            <p className="submit-subtext">
              [시험지 최종 제출하기]를 누르면 미답변 문항 여부를 검사한 후 제출이 진행됩니다.
            </p>
            <button
              type="button"
              className="exam-final-submit-btn"
              onClick={handleClickSubmit}
              disabled={timer.isExpired}
            >
              <ShieldIcon size={20} />
              <span>시험지 최종 제출하기</span>
            </button>
          </section>
        </main>

        {/* 데스크톱 OMR 패널 */}
        <ExamOmrNav
          totalQuestions={totalCount}
          answers={answers}
          flags={flags}
          onScrollToQuestion={handleScrollToQuestion}
        />
      </div>

      {/* 미답변 확인 및 제출 모달 */}
      {isSubmitModalOpen && (
        <ExamSubmitModal
          unansweredList={highlightedUnanswered}
          totalCount={totalCount}
          onClose={() => setIsSubmitModalOpen(false)}
          onNavigateToQuestion={handleScrollToQuestion}
          onConfirmSubmit={handleConfirmSubmit}
        />
      )}

      {/* 시간 종료 안내 모달 */}
      {isExpiredModalOpen && (
        <div className="exam-modal-backdrop" role="dialog" aria-modal="true">
          <div className="exam-modal-card">
            <div className="exam-modal-icon-wrap" aria-hidden="true">
              ⏰
            </div>
            <h3 className="exam-modal-title">시험 시간이 종료되었습니다</h3>
            <p className="exam-modal-text">
              시험 제한시간(또는 시험 마감 시각)이 종료되어 답안지가 잠겼습니다.
            </p>
            <div className="exam-modal-actions">
              <button
                type="button"
                className="exam-modal-btn is-primary"
                onClick={() => setIsExpiredModalOpen(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
