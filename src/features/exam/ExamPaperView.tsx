import { useState } from 'react'
import {
  ClockIcon,
  ExamIcon,
  RotateCcwIcon,
  ShieldIcon,
} from '../../components/Icon'
import { useAuth } from '../../lib/auth'
import type { StudentProfile } from '../../lib/types'
import {
  clearPendingSubmission,
  loadStoredAnswers,
  loadStoredFlags,
  savePendingSubmission,
  saveReceipt,
  saveStoredAnswers,
  saveStoredFlags,
} from './examStorage'
import { recordExamSubmission, submitExamToGas } from './examService'
import ExamCameraPreview from './ExamCameraPreview'
import ExamOmrNav from './ExamOmrNav'
import ExamQuestionCard from './ExamQuestionCard'
import ExamSubmitModal from './ExamSubmitModal'
import type {
  ExamInfo,
  ExamReceiptData,
  ExamSession,
  FlaggedMap,
  StudentExamQuestion,
  UserAnswers,
} from './types'
import { useCameraFaceDetector } from './useCameraFaceDetector'
import { useExamTimer } from './useExamTimer'

interface Props {
  examInfo: ExamInfo
  session: ExamSession
  profile: StudentProfile
  questions: StudentExamQuestion[]
  cameraConsent?: boolean
  cameraStream?: MediaStream | null
  onSubmitComplete?: (receipt: ExamReceiptData) => void
  previewMode?: boolean
  correctAnswers?: Record<number, number>
}

export default function ExamPaperView({
  examInfo,
  session,
  profile,
  questions,
  cameraConsent,
  cameraStream,
  onSubmitComplete,
  previewMode = false,
  correctAnswers,
}: Props) {
  const { user } = useAuth()

  // 로컬 저장소에서 기존 답안 및 깃발 복원
  const [answers, setAnswers] = useState<UserAnswers>(() =>
    previewMode ? {} : loadStoredAnswers(examInfo.examId, session.uid),
  )
  const [flags, setFlags] = useState<FlaggedMap>(() =>
    previewMode ? {} : loadStoredFlags(examInfo.examId, session.uid),
  )

  // 미답변 문항 하이라이트 (제출 시도 시)
  const [highlightedUnanswered, setHighlightedUnanswered] = useState<number[]>([])
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [previewSubmitNotice, setPreviewSubmitNotice] = useState(false)

  // 6단계 보조 장치: 카메라 얼굴 감지 훅
  const {
    videoRef: cameraVideoRef,
    activeStream,
    status: cameraStatus,
    faceCount,
    stopCamera,
    flushPendingFaceOut,
  } = useCameraFaceDetector({
    examId: examInfo.examId,
    uid: session.uid,
    stream: cameraStream || null,
    enabled: !previewMode && Boolean(cameraConsent && cameraStream),
  })

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lastSubmitType, setLastSubmitType] = useState<'manual' | 'auto'>('manual')

  // 실제 서버 제출 수행 함수
  const doSubmit = async (submitType: 'manual' | 'auto') => {
    if (previewMode) {
      setPreviewSubmitNotice(true)
      return
    }
    if (!user) return
    setIsSubmitting(true)
    setSubmitError(null)
    setLastSubmitType(submitType)

    // 진행 중인 이탈이 있다면 제출 시점으로 마감하여 Firestore에 기록
    flushPendingFaceOut('답안 제출 시점 마감')

    // 카메라 스트림 즉시 종료 (브라우저 녹색 LED/아이콘 소등)
    stopCamera()

    // 전송 전 답안을 브라우저 로컬 저장소에 안전하게 백업
    savePendingSubmission(examInfo.examId, session.uid, answers)

    try {
      const idToken = await user.getIdToken()
      const result = await submitExamToGas({
        examId: examInfo.examId,
        idToken,
        answers,
        submitType,
      })

      // 제출 완료 기록 (Firestore)
      await recordExamSubmission({
        examId: examInfo.examId,
        uid: session.uid,
        receiptId: result.receiptId,
        submitType,
      })

      const receiptData: ExamReceiptData = {
        examId: examInfo.examId,
        receiptId: result.receiptId,
        submittedAt: result.submittedAt,
        submitType,
      }

      // 로컬 접수 영수증 저장 및 대기 답안 정리
      saveReceipt(examInfo.examId, session.uid, receiptData)
      clearPendingSubmission(examInfo.examId, session.uid)

      setIsSubmitting(false)
      onSubmitComplete?.(receiptData)
    } catch (err) {
      console.error('답안 제출 실패:', err)
      setIsSubmitting(false)
      setSubmitError(
        err instanceof Error
          ? err.message
          : '인터넷 연결이 불안정하여 답안을 제출하지 못했습니다.',
      )
    }
  }

  // 타이머 훅 연동: 시간 종료 시 자동 제출
  const timer = useExamTimer(session.individualEndAt, () => {
    if (previewMode) return
    if (!isSubmitting) {
      flushPendingFaceOut('시간 만료 자동 마감')
      stopCamera()
      doSubmit('auto')
    }
  }, !previewMode)

  // 답안 변경 시 localStorage 자동 보관
  const handleSelectChoice = (qNo: number, choiceNo: number) => {
    if (timer.isExpired || isSubmitting) return
    setAnswers((prev) => {
      const next = { ...prev, [qNo]: choiceNo }
      if (!previewMode) {
        saveStoredAnswers(examInfo.examId, session.uid, next)
      }
      return next
    })
    // 미답변 하이라이트 해제
    setHighlightedUnanswered((prev) => prev.filter((n) => n !== qNo))
  }

  // 깃발 토글
  const handleToggleFlag = (qNo: number) => {
    if (timer.isExpired || isSubmitting) return
    setFlags((prev) => {
      const next = { ...prev, [qNo]: !prev[qNo] }
      if (!previewMode) {
        saveStoredFlags(examInfo.examId, session.uid, next)
      }
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
    if (isSubmitting || timer.isExpired) return
    const unanswered: number[] = []
    for (const q of questions) {
      if (answers[q.no] === undefined) {
        unanswered.push(q.no)
      }
    }
    setHighlightedUnanswered(unanswered)
    setIsSubmitModalOpen(true)
  }

  // 제출 확정 시 서버 제출 실행
  const handleConfirmSubmit = () => {
    setIsSubmitModalOpen(false)
    if (previewMode) {
      setPreviewSubmitNotice(true)
      return
    }
    doSubmit('manual')
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
                correctChoice={previewMode ? correctAnswers?.[q.no] : undefined}
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
            {previewSubmitNotice && (
              <div className="exam-preview-submit-notice" role="status">
                미리보기에서는 답안이 저장·제출되지 않습니다.
              </div>
            )}
          </section>
        </main>

        {/* 데스크톱 OMR 패널 (내장 웹캠 미리보기 포함) */}
        <ExamOmrNav
          totalQuestions={totalCount}
          answers={answers}
          flags={flags}
          onScrollToQuestion={handleScrollToQuestion}
          cameraSlot={
            <ExamCameraPreview
              videoRef={cameraVideoRef}
              status={cameraStatus}
              faceCount={faceCount}
              stream={activeStream}
            />
          }
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

      {/* 제출 중 로딩 모달 */}
      {isSubmitting && (
        <div className="exam-modal-backdrop" role="dialog" aria-modal="true">
          <div className="exam-modal-card">
            <div className="exam-spinner" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
            <h3 className="exam-modal-title">답안을 제출하고 있습니다</h3>
            <p className="exam-modal-text">
              작성하신 답안을 채점 서버로 전송하고 확인하는 중입니다. 잠시만 기다려 주세요...
            </p>
          </div>
        </div>
      )}

      {/* 제출 실패/네트워크 단절 시 로컬 보관 안내 및 재시도 모달 */}
      {submitError && (
        <div className="exam-modal-backdrop" role="dialog" aria-modal="true">
          <div className="exam-modal-card">
            <div className="exam-modal-icon-wrap" aria-hidden="true">
              📡
            </div>
            <h3 className="exam-modal-title">답안 전송 오류</h3>
            <p className="exam-modal-text">
              {submitError}
            </p>
            <div className="exam-header-notice-box" style={{ marginTop: '12px', textAlign: 'left' }}>
              <ShieldIcon size={16} />
              <div className="notice-content">
                <strong>답안 보관 안내:</strong> 학생이 선택한 모든 답안은 이 기기(브라우저)에 안전하게 보관되어 있습니다. 인터넷 연결을 확인하신 후 아래 [다시 제출하기] 버튼을 눌러주세요.
              </div>
            </div>
            <div className="exam-modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="exam-modal-btn is-primary"
                onClick={() => doSubmit(lastSubmitType || 'manual')}
              >
                <RotateCcwIcon size={16} />
                <span>다시 제출하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
