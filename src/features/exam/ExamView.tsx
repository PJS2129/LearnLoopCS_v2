import { useEffect, useState } from 'react'
import { RotateCcwIcon } from '../../components/Icon'
import { useAuth } from '../../lib/auth'
import ExamAccessCodeView from './ExamAccessCodeView'
import ExamConsentView from './ExamConsentView'
import ExamLockedView from './ExamLockedView'
import ExamPaperView from './ExamPaperView'
import ExamReceiptView from './ExamReceiptView'
import { loadSubmission } from './examStorage'
import {
  createExamSession,
  fetchExamInfo,
  fetchExamQuestions,
  fetchExamSession,
} from './examService'
import type {
  ExamInfo,
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
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)

  // 코드 입력 흐름
  const [enteredCode, setEnteredCode] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 시험 상태 초기화 및 세션 확인
  const initExam = async () => {
    if (!user) return
    setState('loading')
    setErrorMsg(null)

    try {
      // 1. 이미 제출한 이력이 있는지 확인
      const existingSubmission = loadSubmission(TARGET_EXAM_ID, user.uid)
      if (existingSubmission) {
        setSubmittedAt(existingSubmission)
      }

      // 2. 시험 기본 정보 조회
      const info = await fetchExamInfo(TARGET_EXAM_ID)
      setExamInfo(info)

      if (!info || info.status !== 'open') {
        setState('locked')
        return
      }

      // 3. 이미 생성된 세션이 있는지 확인 (새로고침 또는 재진입)
      const existingSession = await fetchExamSession(TARGET_EXAM_ID, user.uid)
      if (existingSession) {
        setSession(existingSession)
        // 세션이 있으면 즉시 문항 조회
        const qList = await fetchExamQuestions(TARGET_EXAM_ID)
        setQuestions(qList)
        setState('paper')
        return
      }

      // 3. 신규 응시자 -> 코드 입력 화면으로
      setState('code_entry')
    } catch (err) {
      console.error('시험 초기화 실패:', err)
      setErrorMsg(
        err instanceof Error ? err.message : '시험 정보를 불러오지 못했습니다.',
      )
      setState('locked')
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

  // 이미 답안을 제출한 경우: 시험지를 숨기고 접수 확인 화면 표시
  if (submittedAt && examInfo && profile) {
    return (
      <ExamReceiptView
        examInfo={examInfo}
        profile={profile}
        submittedAt={submittedAt}
      />
    )
  }

  if (state === 'paper' && session && profile) {
    return (
      <ExamPaperView
        examInfo={examInfo!}
        session={session}
        profile={profile}
        questions={questions}
        onSubmitComplete={(timeStr) => setSubmittedAt(timeStr)}
      />
    )
  }

  return null
}
