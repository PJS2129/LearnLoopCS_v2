import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import {
  ClockIcon,
  ExamIcon,
  RotateCcwIcon,
  ShieldIcon,
} from '../../components/Icon'
import { useAuth } from '../../lib/auth'
import {
  fetchExamOperationData,
  generateRandomAccessCode,
  migrateLegacyExamData,
  resetExamSubmissions,
  saveExamOperation,
  updateExamStatus,
} from './examOperationService'
import type { ExamInfo, ExamPrivateConfig } from './types'

const DEFAULT_EXAM_ID = 'midterm-2026'

interface InitialFormState {
  examDate: string
  startDateTime: string
  durationMinutes: number
  bufferMinutes: number
  accessCode: string
}

export default function ExamOperation() {
  const { user } = useAuth()
  const [examId, setExamId] = useState(DEFAULT_EXAM_ID)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // 시험 상태 및 비공개 설정
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null)
  const [privateConfig, setPrivateConfig] = useState<ExamPrivateConfig | null>(null)
  const [hasLegacyFinalizedBy, setHasLegacyFinalizedBy] = useState(false)

  // 폼 입력 상태
  const [examDate, setExamDate] = useState('2026.4.22.(수) 11:30')
  const [startDateTime, setStartDateTime] = useState('2026-04-22T11:30')
  const [durationMinutes, setDurationMinutes] = useState(50)
  const [bufferMinutes, setBufferMinutes] = useState(10)
  const [accessCode, setAccessCode] = useState('')

  // 저장 여부(isDirty) 추적을 위한 초기 상태 기준
  const [initialState, setInitialState] = useState<InitialFormState | null>(null)

  // 커스텀 모달 상태들
  const [statusConfirmModal, setStatusConfirmModal] = useState<{
    open: boolean
    targetStatus: 'open' | 'closed'
    title: string
    description: string
  }>({
    open: false,
    targetStatus: 'open',
    title: '',
    description: '',
  })

  const [codeRegenModalOpen, setCodeRegenModalOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)

  // 데이터 로드
  const loadData = async (targetId: string) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await fetchExamOperationData(targetId)
      setExamInfo(data.info)
      setPrivateConfig(data.config)
      setHasLegacyFinalizedBy(data.hasLegacyFinalizedBy)

      let loadedExamDate = '2026.4.22.(수) 11:30'
      let loadedStartDateTime = '2026-04-22T11:30'
      let loadedDuration = 50
      let loadedBuffer = 10
      let loadedCode = ''

      if (data.info) {
        if (data.info.examDate) loadedExamDate = data.info.examDate
        if (data.info.durationMinutes) loadedDuration = data.info.durationMinutes
        if (data.info.bufferMinutes !== undefined) loadedBuffer = data.info.bufferMinutes

        const startAt = data.info.startAt as { toDate?: () => Date } | undefined
        if (startAt?.toDate) {
          const d = startAt.toDate()
          const tzOffset = d.getTimezoneOffset() * 60000
          loadedStartDateTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
        }
      }

      if (data.config?.accessCode) {
        loadedCode = data.config.accessCode
      } else {
        loadedCode = generateRandomAccessCode()
      }

      setExamDate(loadedExamDate)
      setStartDateTime(loadedStartDateTime)
      setDurationMinutes(loadedDuration)
      setBufferMinutes(loadedBuffer)
      setAccessCode(loadedCode)

      // 초기 상태 저장
      setInitialState({
        examDate: loadedExamDate,
        startDateTime: loadedStartDateTime,
        durationMinutes: loadedDuration,
        bufferMinutes: loadedBuffer,
        accessCode: loadedCode,
      })
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : '시험 운영 정보 로드에 실패했습니다.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(examId)
  }, [examId])

  // 현재 상태
  const currentStatus = examInfo?.status ?? 'none'
  const isFinalized = currentStatus === 'finalized'
  const isReady = currentStatus === 'ready'
  const isOpen = currentStatus === 'open'
  const isClosed = currentStatus === 'closed'

  // 변경 사항이 있는지 확인 (isDirty)
  // 아직 한 번도 저장되지 않았거나(config에 accessCode가 없거나), 입력값이 변경된 경우
  const isDirty = (() => {
    if (!initialState) return true
    if (!privateConfig?.accessCode) return true
    return (
      examDate !== initialState.examDate ||
      startDateTime !== initialState.startDateTime ||
      durationMinutes !== initialState.durationMinutes ||
      bufferMinutes !== initialState.bufferMinutes ||
      accessCode.trim().toUpperCase() !== initialState.accessCode.trim().toUpperCase()
    )
  })()

  // 시험 코드 재발급 클릭 핸들러
  const handleRegenerateCodeClick = () => {
    if (isOpen) {
      // 이미 열려 있는 상태면 경고 모달 표시
      setCodeRegenModalOpen(true)
    } else {
      setAccessCode(generateRandomAccessCode())
    }
  }

  // 경고 모달에서 승인 시 코드 재발급 실행
  const handleConfirmCodeRegen = () => {
    setAccessCode(generateRandomAccessCode())
    setCodeRegenModalOpen(false)
  }

  // 마감 시각 자동 계산
  const calculatedCloseAt = (() => {
    try {
      const start = new Date(startDateTime)
      if (isNaN(start.getTime())) return null
      const totalMinutes = durationMinutes + bufferMinutes
      return new Date(start.getTime() + totalMinutes * 60 * 1000)
    } catch {
      return null
    }
  })()

  // 운영 설정 저장
  const handleSaveSettings = async () => {
    if (!user) return
    if (!examInfo) {
      setErrorMsg('확정된 시험 정보가 없습니다. 먼저 문항 관리를 완료해 주세요.')
      return
    }

    const trimmedCode = accessCode.trim().toUpperCase()
    if (!trimmedCode || trimmedCode.length < 4) {
      setErrorMsg('시험 코드는 4자리 이상 입력해 주세요.')
      return
    }

    if (isOpen) {
      setErrorMsg('시험이 열려 있는(open) 상태에서는 응시 중인 학생들의 공정성을 위해 일시·제한시간·마감시각 설정을 변경할 수 없습니다. 설정을 변경하려면 먼저 시험을 닫아주세요.')
      return
    }

    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const startDate = new Date(startDateTime)
      await saveExamOperation(
        {
          examId,
          examDate,
          startAt: startDate,
          durationMinutes,
          bufferMinutes,
          accessCode: trimmedCode,
          newStatus: isFinalized ? 'ready' : undefined,
        },
        user,
      )
      setSuccessMsg('운영 설정 및 시험 코드가 정상적으로 저장되었습니다.')
      await loadData(examId)
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : '운영 설정 저장에 실패했습니다.',
      )
    } finally {
      setSaving(false)
    }
  }

  // 구 버전(3-2단계) 데이터 마이그레이션 실행
  const handleMigrateLegacyData = async () => {
    if (!user) return
    setMigrating(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await migrateLegacyExamData(examId, user)
      setSuccessMsg(
        `데이터 구조 이전 완료: 관리자 이메일(${res.migratedEmail})을 exams/${examId}/private/config로 이전하고 공개 문서에서 안전하게 제거했습니다.`,
      )
      await loadData(examId)
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : '데이터 구조 이전에 실패했습니다.',
      )
    } finally {
      setMigrating(false)
    }
  }

  // 상태 전환 트리거 (모달 열기)
  const openStatusConfirmModal = (nextStatus: 'open' | 'closed') => {
    if (nextStatus === 'open') {
      setStatusConfirmModal({
        open: true,
        targetStatus: 'open',
        title: '시험을 개방(열기)하시겠습니까?',
        description: `시험이 [열림] 상태가 되면 학생들은 시험 코드(${accessCode})를 입력하여 응시 세션을 생성하고 시험지에 입장할 수 있습니다.`,
      })
    } else {
      setStatusConfirmModal({
        open: true,
        targetStatus: 'closed',
        title: '시험을 마감(닫기)하시겠습니까?',
        description:
          '시험을 닫으면 신규 학생의 시험 진입 및 코드 입력이 차단됩니다. 이미 입장하여 풀이 중인 학생은 본인의 개인 종료 시각까지 마킹을 계속할 수 있습니다.',
      })
    }
  }

  // 상태 전환 실행
  const handleExecuteStatusChange = async () => {
    if (!user || !examInfo) return
    const target = statusConfirmModal.targetStatus
    setStatusConfirmModal((prev) => ({ ...prev, open: false }))
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      await updateExamStatus(examId, target, user)
      setSuccessMsg(
        target === 'open'
          ? '시험이 개방되었습니다! 학생들에게 시험 코드를 공지하세요.'
          : '시험이 마감(닫힘) 처리되었습니다.',
      )
      await loadData(examId)
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : '상태 전환에 실패했습니다.',
      )
    } finally {
      setSaving(false)
    }
  }

  // [테스트/재응시용] 응시 기록 전체 초기화 실행
  const handleExecuteResetSubmissions = async () => {
    if (!user) return
    setResetting(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await resetExamSubmissions(examId, user)
      setResetModalOpen(false)

      if (res.sheetError) {
        setSuccessMsg(
          `Firestore 학생 세션(${res.deletedSessions}개)과 접수 기록(${res.deletedSubmissions}개)이 성공적으로 초기화되었습니다! 이제 학생 재응시가 가능합니다.\n(참고: 구글 시트 행 자동 삭제 실패 [${res.sheetError}] -> 구글 스프레드시트 [응시결과] 탭에서 기존 2행을 마우스로 직접 삭제해 주세요.)`,
        )
      } else {
        setSuccessMsg(
          `응시 기록 전체 초기화 완료: 시트 행 ${res.deletedSheetRows}개, 학생 세션 ${res.deletedSessions}개, 접수 문서 ${res.deletedSubmissions}개가 모두 삭제되었습니다. 이제 학생들이 처음부터 다시 시험을 치를 수 있습니다.`,
        )
      }
      await loadData(examId)
    } catch (err) {
      setResetModalOpen(false)
      setErrorMsg(
        err instanceof Error ? err.message : '응시 기록 초기화에 실패했습니다.',
      )
    } finally {
      setResetting(false)
    }
  }

  // 상태 라벨 및 배지 렌더링
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'finalized':
        return <span className="admin-status-badge status-finalized">확정됨 (준비 중)</span>
      case 'ready':
        return <span className="admin-status-badge status-ready">준비 완료 (개방 대기)</span>
      case 'open':
        return <span className="admin-status-badge status-open">시험 열림 (응시 중)</span>
      case 'closed':
        return <span className="admin-status-badge status-closed">시험 닫힘 (마감됨)</span>
      default:
        return <span className="admin-status-badge status-closed">미확정</span>
    }
  }

  return (
    <div className="admin-operation-view">
      {/* 상단 헤더: 타이틀 + 현재 상태 배지 */}
      <div className="admin-op-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 className="admin-op-title" style={{ margin: 0 }}>
              시험 운영 및 코드 관리
            </h2>
            {examInfo && renderStatusBadge(currentStatus)}
          </div>
          <p className="admin-op-desc" style={{ marginTop: '6px' }}>
            확정된 문항에 대한 시험 일시, 제한시간 및 비공개 시험 코드를 설정하고 시험을 개방합니다.
          </p>
        </div>

        <div className="admin-op-id-bar">
          <label htmlFor="op-exam-id" className="admin-op-id-label">
            대상 시험 ID:
          </label>
          <input
            id="op-exam-id"
            type="text"
            className="admin-op-id-input mono"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
          />
          <button
            type="button"
            className="admin-op-refresh-btn"
            onClick={() => loadData(examId)}
            title="새로고침"
          >
            <RotateCcwIcon size={16} />
          </button>
        </div>
      </div>

      {/* 이전 버전(3-2단계) 데이터 마이그레이션 알림 배너 */}
      {hasLegacyFinalizedBy && (
        <div className="admin-op-migration-banner" role="alert">
          <div className="migration-banner-content">
            <strong>📌 시험 데이터 구조 이전이 필요합니다:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#78350f' }}>
              현재 <code>exams/{examId}</code> 문서에 관리자 이메일(<code>finalizedBy</code>)이 포함되어 있습니다.
              새 보안 규칙에 따라 학생 화면에 관리자 이메일이 노출되지 않도록 비공개 설정(<code>private/config</code>)으로 이전해 주세요.
            </p>
          </div>
          <button
            type="button"
            className="admin-op-migrate-btn"
            onClick={handleMigrateLegacyData}
            disabled={migrating}
          >
            {migrating ? '이전 처리 중...' : '데이터 구조 이전 실행'}
          </button>
        </div>
      )}

      {/* 에러 및 성공 알림 */}
      {errorMsg && (
        <div className="admin-op-alert is-error" role="alert">
          <strong>오류 발생:</strong> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="admin-op-alert is-success" role="status">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="admin-op-loading">시험 정보를 불러오는 중입니다...</div>
      ) : !examInfo ? (
        <div className="admin-op-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
          <h3>해당 시험({examId}) 정보가 없습니다</h3>
          <p>
            [문항 관리] 메뉴에서 문항을 먼저 점검하고 [점검 완료]를 진행해 주세요.
          </p>
        </div>
      ) : (
        <div className="admin-op-grid">
          {/* 좌측: 상태 제어 카드 (열기/닫기 전환 버튼) */}
          <div className="admin-op-card admin-op-status-card">
            <h3 className="admin-op-card-title">
              <ShieldIcon size={20} />
              <span>시험 상태 제어</span>
            </h3>

            <div className="admin-op-current-status">
              <span className="admin-op-status-label">현재 시험 상태</span>
              {renderStatusBadge(currentStatus)}
            </div>

            <div className="admin-op-meta-summary">
              <div className="admin-op-meta-row">
                <span>시험명</span>
                <strong>{examInfo.examName}</strong>
              </div>
              <div className="admin-op-meta-row">
                <span>총 문항 수</span>
                <span className="mono">{examInfo.questionCount}문항</span>
              </div>
              <div className="admin-op-meta-row">
                <span>시험 코드 상태</span>
                <span className="mono" style={{ fontSize: '0.85rem', color: privateConfig?.accessCode ? '#15803d' : '#b45309', fontWeight: 700 }}>
                  {privateConfig?.accessCode ? '발급 및 저장 완료' : '저장 대기 중'}
                </span>
              </div>
              <div className="admin-op-meta-row">
                <span>관리자 계정</span>
                <span className="mono" style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {privateConfig?.finalizedBy || 'private/config 보관'}
                </span>
              </div>
            </div>

            {/* 상태 전환 버튼: 열린 후에는 [시험 닫기], 열리기 전에는 [시험 열기] */}
            <div className="admin-op-action-buttons">
              {isOpen ? (
                <button
                  type="button"
                  className="admin-op-btn is-danger"
                  onClick={() => openStatusConfirmModal('closed')}
                  disabled={saving}
                >
                  <ExamIcon size={18} />
                  <span>시험 닫기 (마감)</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="admin-op-btn is-primary"
                    onClick={() => openStatusConfirmModal('open')}
                    disabled={saving || isDirty || (!isFinalized && !isReady && !isClosed)}
                    title={
                      isDirty
                        ? '설정을 먼저 저장해야 시험을 열 수 있습니다'
                        : '시험을 개방하여 학생 입장을 허용합니다'
                    }
                  >
                    <ExamIcon size={18} />
                    <span>시험 열기 (개방)</span>
                  </button>

                  {isDirty && (
                    <div className="admin-op-dirty-notice">
                      ⚠️ 설정이나 시험 코드가 변경되었습니다. 먼저 우측 하단의 <strong>[운영 설정 및 시험 코드 저장]</strong>을 완료하세요.
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="admin-op-help-text">
              • [시험 열기]를 실행하면 학생 시험 탭에 코드 입력 창이 활성화됩니다.<br />
              • 학생 화면에는 관리자 이메일이 노출되지 않고 시험 일시 및 문항만 전달됩니다.
            </p>

            {/* 응시 기록 초기화 (테스트 및 재응시 리셋) */}
            <div className="admin-op-reset-section" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dc2626' }}>
                  🔄 테스트·재응시 기록 초기화
                </span>
              </div>
              <button
                type="button"
                className="admin-op-btn"
                style={{
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  padding: '9px 12px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onClick={() => setResetModalOpen(true)}
                disabled={saving || resetting}
              >
                <RotateCcwIcon size={14} />
                <span>응시 기록 전체 초기화 (원클릭 리셋)</span>
              </button>
              <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                구글 시트 응시결과 행과 Firestore의 학생 세션·제출 문서를 모두 삭제하여 다시 응시할 수 있게 합니다.
              </p>
            </div>
          </div>

          {/* 우측: 운영 파라미터 및 시험 코드 설정 폼 */}
          <div className="admin-op-card admin-op-form-card">
            <h3 className="admin-op-card-title">
              <ClockIcon size={20} />
              <span>일시·제한시간 및 시험 코드 설정</span>
            </h3>

            {isOpen && (
              <div className="admin-op-alert is-warning" style={{ margin: '12px 0 16px', fontSize: '0.88rem' }}>
                💡 <strong>시험 열림(open) 상태 안내:</strong> 현재 시험이 열려 있습니다. 일시·제한시간을 변경하여 저장하려면, 응시 중인 학생들의 안전한 마감을 위해 좌측에서 먼저 [시험 닫기]를 실행한 뒤 저장해 주세요.
              </div>
            )}

            <div className="admin-op-form-group">
              <label htmlFor="field-exam-date">화면 표시용 시험 일시</label>
              <input
                id="field-exam-date"
                type="text"
                className="admin-op-input"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                placeholder="예: 2026.4.22.(수) 11:30"
              />
              <span className="admin-op-input-help">학생 시험지 헤더 및 잠금 화면에 노출되는 문자열입니다.</span>
            </div>

            <div className="admin-op-form-group">
              <label htmlFor="field-start-datetime">시험 공식 시작 일시 (기준 시각)</label>
              <input
                id="field-start-datetime"
                type="datetime-local"
                className="admin-op-input mono"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
              />
            </div>

            <div className="admin-op-form-row">
              <div className="admin-op-form-group">
                <label htmlFor="field-duration">제한시간 (분)</label>
                <input
                  id="field-duration"
                  type="number"
                  min="1"
                  max="300"
                  className="admin-op-input mono"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </div>

              <div className="admin-op-form-group">
                <label htmlFor="field-buffer">지각 허용 여유시간 (분)</label>
                <input
                  id="field-buffer"
                  type="number"
                  min="0"
                  max="120"
                  className="admin-op-input mono"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                />
              </div>
            </div>

            {calculatedCloseAt && (
              <div className="admin-op-closeat-banner">
                <strong>📌 계산된 시험 전체 마감 시각 (closeAt):</strong>
                <span className="mono">
                  {calculatedCloseAt.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569' }}>
                  학생의 개인 종료 시각은 <code>min(입장 시각 + {durationMinutes}분, 시험 마감 시각)</code>으로 엄격히 결정됩니다.
                </p>
              </div>
            )}

            {/* 시험 코드 설정 박스 */}
            <div className="admin-op-code-box">
              <div className="admin-op-code-top">
                <label htmlFor="field-access-code">비공개 시험 코드 (6자리)</label>
                <button
                  type="button"
                  className="admin-op-regenerate-btn"
                  onClick={handleRegenerateCodeClick}
                >
                  <RotateCcwIcon size={14} />
                  <span>코드 재발급</span>
                </button>
              </div>
              <div className="admin-op-code-input-wrap">
                <input
                  id="field-access-code"
                  type="text"
                  maxLength={10}
                  className="admin-op-code-input mono"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="예: 6자리 코드"
                />
                <span className="admin-op-code-chip">보안 문서에 격리 저장됨</span>
              </div>
              <p className="admin-op-code-notice">
                이 코드는 관리자 전용 문서(<code>exams/{examId}/private/config</code>)에만 저장되며 학생은 직접 읽을 수 없습니다.
                학생이 입력한 코드와 일치할 때만 보안 규칙을 통해 입장이 승인됩니다.
              </p>
            </div>

            <div className="admin-op-save-bar">
              <button
                type="button"
                className="admin-op-save-btn"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? '저장 중...' : '운영 설정 및 시험 코드 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. 상태 변경 확인 모달 (공통 Modal 컴포넌트 사용) */}
      {statusConfirmModal.open && (
        <Modal
          title={statusConfirmModal.title}
          onClose={saving ? () => {} : () => setStatusConfirmModal((prev) => ({ ...prev, open: false }))}
          actions={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStatusConfirmModal((prev) => ({ ...prev, open: false }))}
                disabled={saving}
              >
                취소
              </button>
              <button
                type="button"
                className={`btn ${statusConfirmModal.targetStatus === 'open' ? 'btn-primary' : 'btn-danger'}`}
                style={
                  statusConfirmModal.targetStatus === 'closed'
                    ? { backgroundColor: '#dc2626', color: '#fff' }
                    : undefined
                }
                onClick={handleExecuteStatusChange}
                disabled={saving}
              >
                {saving
                  ? '처리 중...'
                  : statusConfirmModal.targetStatus === 'open'
                  ? '시험 개방하기'
                  : '시험 닫기'}
              </button>
            </>
          }
        >
          <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>
            <p>{statusConfirmModal.description}</p>
          </div>
        </Modal>
      )}

      {/* 2. 시험 열림 중 코드 재발급 경고 모달 (공통 Modal 컴포넌트 사용) */}
      {codeRegenModalOpen && (
        <Modal
          title="⚠️ 시험 코드 재발급 주의"
          onClose={() => setCodeRegenModalOpen(false)}
          actions={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCodeRegenModalOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: '#dc2626', color: '#fff' }}
                onClick={handleConfirmCodeRegen}
              >
                계속 재발급하기
              </button>
            </>
          }
        >
          <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 10px', color: '#dc2626', fontWeight: 700 }}>
              현재 시험이 [열림] 상태입니다!
            </p>
            <p style={{ margin: 0 }}>
              학생들이 이미 배포된 코드로 접속하고 있을 수 있습니다. 지금 코드를 재발급하고 저장하면, 이전 코드를 받은 학생은 시험에 입장할 수 없게 됩니다. 계속 재발급하시겠습니까?
            </p>
          </div>
        </Modal>
      )}

      {/* 3. 응시 기록 전체 초기화 확인 모달 */}
      {resetModalOpen && (
        <Modal
          title="⚠️ 응시 기록 전체 초기화 (리셋)"
          onClose={resetting ? () => {} : () => setResetModalOpen(false)}
          actions={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setResetModalOpen(false)}
                disabled={resetting}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ backgroundColor: '#dc2626', color: '#fff' }}
                onClick={handleExecuteResetSubmissions}
                disabled={resetting}
              >
                {resetting ? '초기화 처리 중...' : '모든 응시 기록 삭제 및 리셋'}
              </button>
            </>
          }
        >
          <div style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
            <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: '8px', fontSize: '1rem' }}>
              정말로 시험({examId})의 모든 응시 기록을 초기화하시겠습니까?
            </p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0', fontSize: '0.88rem' }}>
              <li>구글 시트 <strong>[응시결과]</strong> 탭에서 해당 시험의 응시 행이 모두 삭제됩니다.</li>
              <li>Firestore의 학생 <strong>응시 세션(sessions)</strong> 및 <strong>접수 확인(submissions)</strong> 문서가 모두 삭제됩니다.</li>
              <li>초기화 후에는 이전에 제출했던 학생도 즉시 처음부터 다시 시험을 치를 수 있습니다.</li>
            </ul>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '12px' }}>
              ※ 이 작업은 취소할 수 없으므로 실제 정규 시험 운영 중에는 주의하세요.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
