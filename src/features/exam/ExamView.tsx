import { useEffect, useState } from 'react'
import { RotateCcwIcon } from '../../components/Icon'
import { useAuth } from '../../lib/auth'
import ExamAccessCodeView from './ExamAccessCodeView'
import ExamConsentView from './ExamConsentView'
import ExamErrorView from './ExamErrorView'
import ExamLockedView from './ExamLockedView'
import ExamPaperView from './ExamPaperView'
import ExamReceiptView from './ExamReceiptView'
import { clearStoredExamData, loadReceipt, loadSubmission } from './examStorage'
import {
  createExamSession,
  fetchExamInfo,
  fetchExamQuestions,
  fetchExamSession,
  fetchExamSubmission,
} from './examService'
import type {
  ExamErrorKind,
  ExamInfo,
  ExamReceiptData,
  ExamSession,
  ExamTabState,
  StudentExamQuestion,
} from './types'
import './exam.css'

const TARGET_EXAM_ID = 'midterm-2026'

export default function ExamView() {
  const { user, profile } = useAuth()

  const [state, setState] = useState<ExamTabState>('loading')
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null)
  const [session, setSession] = useState<ExamSession | null>(null)
  const [questions, setQuestions] = useState<StudentExamQuestion[]>([])
  const [receiptData, setReceiptData] = useState<ExamReceiptData | null>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)

  // 코드 입력 흐름
  const [enteredCode, setEnteredCode] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<ExamErrorKind>('unknown')

  // 시험 상태 초기화 및 세션 확인
  const initExam = async () => {
    if (!user) return
    setState('loading')
    setErrorMsg(null)

    try {
      // 1. 로컬 저장소 및 Firestore에서 이미 제출한 접수 이력 확인
      const localReceipt = loadReceipt(TARGET_EXAM_ID, user.uid)
      if (localReceipt) {
        setReceiptData(localReceipt)
        setSubmittedAt(localReceipt.submittedAt)
      } else {
        const legacySub = loadSubmission(TARGET_EXAM_ID, user.uid)
        if (legacySub) setSubmittedAt(legacySub)
      }

      // 2. 시험 기본 정보 조회
      let info: ExamInfo | null = null
      try {
        info = await fetchExamInfo(TARGET_EXAM_ID)
      } catch (err) {
        throw new Error(
          `[시험 기본 정보 조회(exams/${TARGET_EXAM_ID})]: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
      setExamInfo(info)

      // 3. Firestore 원격 접수 이력 조회 (기기 변경 또는 캐시 삭제 대비)
      const remoteSub = await fetchExamSubmission(TARGET_EXAM_ID, user.uid)
      if (remoteSub) {
        const fullReceipt: ExamReceiptData = {
          examId: TARGET_EXAM_ID,
          receiptId: remoteSub.receiptId,
          submittedAt: remoteSub.submittedAt,
        }
        setReceiptData(fullReceipt)
        setSubmittedAt(remoteSub.submittedAt)
        setState('submitted')
        return
      } else if (localReceipt) {
        // 서버에는 제출 기록이 없는데 로컬 브라우저에만 구 영수증이 남아있는 경우
        // (관리자가 재응시를 위해 서버에서 초기화한 경우 로컬 캐시 자동 청소)
        console.warn('[ExamView] 서버에 제출 기록이 없으므로 로컬 구 영수증을 클리어합니다.')
        clearStoredExamData(TARGET_EXAM_ID, user.uid)
        setReceiptData(null)
        setSubmittedAt(null)
      }

      // 시험 문서 부재 시 오류 상태로 구분 (준비중으로 오인 방지)
      if (!info) {
        setErrorKind('not_found')
        setErrorMsg(`지정된 시험 문서(ID: ${TARGET_EXAM_ID})를 찾을 수 없습니다.`)
        setState('error')
        return
      }

      // 시험 마감 상태
      if (info.status === 'closed') {
        setState('closed')
        return
      }

      // 시험 준비 중 (finalized, ready 등 아직 열리지 않은 상태)
      if (info.status !== 'open') {
        setState('locked')
        return
      }

      // 4. 이미 생성된 세션이 있는지 확인 (새로고침 또는 재진입)
      let existingSession: ExamSession | null = null
      try {
        existingSession = await fetchExamSession(TARGET_EXAM_ID, user.uid)
      } catch (err) {
        throw new Error(
          `[응시 세션 조회(sessions/${user.uid})]: ${err instanceof Error ? err.message : String(err)}`,
        )
      }

      if (existingSession) {
        setSession(existingSession)

        // 세션이 있으면 문항 조회 후 시험지 화면으로 복원
        let qList: StudentExamQuestion[] = []
        try {
          qList = await fetchExamQuestions(TARGET_EXAM_ID)
        } catch (err) {
          throw new Error(
            `[문항 목록 조회(questions)]: ${err instanceof Error ? err.message : String(err)}`,
          )
        }
        setQuestions(qList)
        setState('paper')
        return
      }

      // 5. 신규 응시자 -> 코드 입력 화면으로
      setState('code_entry')
    } catch (err: unknown) {
      console.error('시험 초기화 실패:', err)
      const error = err as { code?: string; message?: string }
      const rawMsg = err instanceof Error ? err.message : String(err)
      const isPermission =
        error.code === 'permission-denied' ||
        (typeof error.message === 'string' &&
          error.message.includes('permission-denied')) ||
        rawMsg.includes('permission-denied')
      const isUnavailable =
        error.code === 'unavailable' ||
        (typeof error.message === 'string' &&
          (error.message.includes('unavailable') ||
            error.message.includes('network'))) ||
        rawMsg.includes('unavailable')

      if (isPermission) {
        setErrorKind('permission')
        setErrorMsg(
          `접근 권한 거부 (permission-denied)\n${rawMsg}`,
        )
      } else if (isUnavailable) {
        setErrorKind('network')
        setErrorMsg(
          `네트워크 연결 오류: ${rawMsg}`,
        )
      } else {
        setErrorKind('unknown')
        setErrorMsg(rawMsg || '시험 정보를 불러오지 못했습니다.')
      }
      setState('error')
    }
  }

  useEffect(() => {
    initExam()
  }, [user?.uid])

  // 코드 입력 완료 -> 동의 화면으로 전환
  const handleCodeSubmit = (code: string) => {
    setEnteredCode(code)
    setErrorMsg(null)
    setState('consent')
  }

  // 동의 후 [시험 시작하기] 클릭 -> 세션 생성 및 문항 로드
  const handleStartExam = async () => {
    if (!user || !profile || !examInfo) return
    setIsStarting(true)
    setErrorMsg(null)

    try {
      // 세션 생성 (보안 규칙에서 코드 일치, open 상태, 학생 정보 일치 검증)
      const newSession = await createExamSession({
        examId: TARGET_EXAM_ID,
        uid: user.uid,
        profile,
        enteredCode,
        examInfo,
      })
      setSession(newSession)

      // 문항 로드 (세션이 생성되었으므로 규칙 통과)
      const qList = await fetchExamQuestions(TARGET_EXAM_ID)
      setQuestions(qList)

      setState('paper')
    } catch (err) {
      console.error('시험 세션 생성 실패:', err)
      const msg =
        err instanceof Error && err.message.includes('permission-denied')
          ? '시험 코드가 일치하지 않거나 학생 등록 정보가 확인되지 않습니다. 코드를 다시 확인해 주세요.'
          : err instanceof Error
          ? err.message
          : '시험 세션 생성에 실패했습니다.'
      setErrorMsg(msg)
    } finally {
      setIsStarting(false)
    }
  }

  // 코드 다시 입력으로 돌아가기
  const handleBackToCode = () => {
    setErrorMsg(null)
    setState('code_entry')
  }

  if (state === 'loading') {
    return (
      <div className="exam-loading-screen">
        <div className="exam-spinner" aria-hidden="true" />
        <p>시험 상태 및 세션 정보를 확인하는 중입니다...</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <ExamErrorView
        errorKind={errorKind}
        errorMsg={errorMsg || ''}
        examId={TARGET_EXAM_ID}
        onRetry={initExam}
      />
    )
  }

  if (state === 'locked' || state === 'closed') {
    return (
      <div>
        <ExamLockedView examInfo={examInfo} />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className="exam-refresh-status-btn"
            onClick={initExam}
          >
            <RotateCcwIcon size={14} />
            <span>상태 새로고침</span>
          </button>
        </div>
      </div>
    )
  }

  if (state === 'code_entry') {
    return (
      <ExamAccessCodeView
        examInfo={examInfo!}
        onCodeSubmit={handleCodeSubmit}
        errorMsg={errorMsg}
      />
    )
  }

  if (state === 'consent') {
    return (
      <ExamConsentView
        examInfo={examInfo!}
        enteredCode={enteredCode}
        profile={profile!}
        onStartExam={handleStartExam}
        onBackToCode={handleBackToCode}
        isStarting={isStarting}
        errorMsg={errorMsg}
      />
    )
  }

  // 이미 답안을 제출한 경우: 시험지를 숨기고 접수 확인 화면 표시 (시험지 및 풀이 화면 영구 차단)
  if (receiptData || submittedAt || state === 'submitted') {
    if (examInfo && profile) {
      return (
        <ExamReceiptView
          examInfo={examInfo}
          profile={profile}
          submittedAt={receiptData?.submittedAt || submittedAt || ''}
          receiptId={receiptData?.receiptId}
        />
      )
    }
    return (
      <div className="exam-loading-screen">
        <div className="exam-spinner" aria-hidden="true" />
        <p>시험 접수 완료 정보를 불러오는 중입니다...</p>
      </div>
    )
  }

  if (state === 'paper' && session && profile) {
    return (
      <ExamPaperView
        examInfo={examInfo!}
        session={session}
        profile={profile}
        questions={questions}
        onSubmitComplete={(receipt) => {
          setReceiptData(receipt)
          setSubmittedAt(receipt.submittedAt)
          setState('submitted')
        }}
      />
    )
  }

  // 응시 시간 만료 화면 (빈 화면 방지)
  if (state === 'expired') {
    return (
      <div className="exam-locked-container">
        <div className="exam-locked-card">
          <div className="exam-locked-icon-wrap" aria-hidden="true">
            ⏰
          </div>
          <span className="exam-locked-badge status-expired-badge">
            응시 시간 만료
          </span>
          <h2 className="exam-locked-title">시험 응시 시간이 만료되었습니다</h2>
          <p className="exam-locked-desc">
            배정된 시험 제한시간이 경과하여 답안 제출이 마감되었습니다.
            성적이 공개된 후 [내 결과] 화면에서 확인하실 수 있습니다.
          </p>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              className="exam-refresh-status-btn"
              onClick={initExam}
            >
              <RotateCcwIcon size={14} />
              <span>상태 새로고침</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 안전 폴백 (기타 전환 시 빈 화면 방지)
  return (
    <div className="exam-loading-screen">
      <div className="exam-spinner" aria-hidden="true" />
      <p>시험 화면을 불러오는 중입니다...</p>
    </div>
  )
}
