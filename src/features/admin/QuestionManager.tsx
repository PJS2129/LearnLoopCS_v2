import { useMemo, useState } from 'react'
import Modal from '../../components/Modal'
import {
  clearExamDraft,
  loadExamDraft,
  saveExamDraft,
} from './adminDraftStorage'
import ImportModal from './ImportModal'
import QuestionEditModal from './QuestionEditModal'
import QuestionTable from './QuestionTable'
import type { ExamPackage, ExamQuestion } from './types'
import {
  calculateAnswerDistribution,
  calculateDomainStats,
  calculateLevelStats,
  countReviewQuestions,
  validateExamQuestions,
} from './validator'

export default function QuestionManager() {
  // lazy initializer로 마운트 시 한 번만 localStorage에서 초안 로드
  const [examPackage, setExamPackage] = useState<ExamPackage | null>(() => loadExamDraft())
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false)

  // 초안 변경 시 localStorage 자동 동기화
  const handleUpdatePackage = (newPkg: ExamPackage | null) => {
    setExamPackage(newPkg)
    if (newPkg) {
      saveExamDraft(newPkg)
    } else {
      clearExamDraft()
    }
  }

  // 문항 하나 수정
  const handleSaveQuestion = (updated: ExamQuestion) => {
    if (!examPackage) return
    const updatedQuestions = examPackage.questions.map((q) =>
      q.no === updated.no ? updated : q,
    )
    handleUpdatePackage({
      ...examPackage,
      questions: updatedQuestions,
    })
  }

  // 초안 비우기 확정
  const handleConfirmClear = () => {
    handleUpdatePackage(null)
    setShowClearConfirmModal(false)
  }

  const questions = useMemo(() => examPackage?.questions ?? [], [examPackage])
  const validation = useMemo(() => validateExamQuestions(questions), [questions])
  const domainStats = useMemo(() => calculateDomainStats(questions), [questions])
  const levelStats = useMemo(() => calculateLevelStats(questions), [questions])
  const answerDist = useMemo(() => calculateAnswerDistribution(questions), [questions])
  const reviewCount = useMemo(() => countReviewQuestions(questions), [questions])

  return (
    <div className="question-manager">
      {/* 뷰 헤더 */}
      <div className="admin-view-header">
        <div>
          <h2>문항 관리 (AI 출제 결과 가져오기)</h2>
          <p>
            {examPackage
              ? `${examPackage.exam} — 총 ${questions.length}문항이 등록되어 있습니다.`
              : 'Claude MCP 출제 프롬프트에서 생성된 exam.json 파일을 가져와 검토합니다.'}
          </p>
        </div>

        <div className="admin-action-group">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowImportModal(true)}
          >
            문항 JSON 가져오기
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={!examPackage || questions.length === 0}
            onClick={() => setShowClearConfirmModal(true)}
          >
            초안 비우기
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled
            title="점검 완료 및 정답표 분리 저장은 3-2단계에서 활성화됩니다."
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            점검 완료 (3-2 준비 중)
          </button>
        </div>
      </div>

      {/* 임시 보관 안내 띠 (요구사항 3번) */}
      <div className="admin-notice-banner">
        <span className="icon">ⓘ</span>
        <span>
          초안은 이 브라우저에만 저장됩니다. 공용 PC에서는 작업 후 <strong>[초안 비우기]</strong>를
          눌러 주세요.
        </span>
      </div>

      {/* 문항이 없을 때 빈 화면 */}
      {(!examPackage || questions.length === 0) && (
        <div className="admin-empty-state">
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📋</div>
          <h3>등록된 시험 문항 초안이 없습니다</h3>
          <p>
            Google Drive MCP 출제 프롬프트(<code>docs/prompts/02-2_출제_프롬프트_MCP.md</code>)로
            생성한 <code>exam.json</code> 파일을 가져오세요.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowImportModal(true)}
            >
              문항 JSON 가져오기
            </button>
          </div>
        </div>
      )}

      {/* 문항이 있을 때 대시보드 및 테이블 */}
      {examPackage && questions.length > 0 && (
        <>
          {/* 상단 통계 카드 그리드 */}
          <div className="admin-stats-grid">
            {/* 영역별 문항 수 */}
            <div className="admin-stat-card">
              <div className="admin-stat-card-title">
                <span>영역별 문항 수</span>
                <span className="total-badge">{questions.length}문항</span>
              </div>
              <div className="admin-stat-list">
                {domainStats.map((st) => (
                  <div key={st.domain} className="admin-stat-row">
                    <span className="stat-name">{st.domain}</span>
                    <span className="stat-badge">{st.count}문항</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 난이도별 문항 수 */}
            <div className="admin-stat-card">
              <div className="admin-stat-card-title">
                <span>난이도별 문항 수</span>
                <span className="total-badge">
                  {reviewCount > 0 ? `검토 필요 ${reviewCount}` : '검토 대상 0'}
                </span>
              </div>
              <div className="admin-stat-list">
                {levelStats.map((st) => (
                  <div key={st.level} className="admin-stat-row">
                    <span className="stat-name">난이도 '{st.level}'</span>
                    <span className="stat-badge stat-val">{st.count}문항</span>
                  </div>
                ))}
                <div
                  className="admin-stat-row"
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '6px',
                    marginTop: '2px',
                  }}
                >
                  <span className="stat-name" style={{ color: '#92400e', fontWeight: 600 }}>
                    AI 검토 권장 (review: true)
                  </span>
                  <span
                    className="stat-badge"
                    style={{
                      backgroundColor: reviewCount > 0 ? '#fef3c7' : '#f1f5f9',
                      color: reviewCount > 0 ? '#92400e' : '#64748b',
                      fontWeight: 700,
                    }}
                  >
                    {reviewCount}문항
                  </span>
                </div>
              </div>
            </div>

            {/* 정답 번호(1~4) 분포 */}
            <div className="admin-stat-card" style={{ gridColumn: 'span 1' }}>
              <div className="admin-stat-card-title">
                <span>정답 번호 (1~4) 분포</span>
                <span className="total-badge">편향 점검</span>
              </div>
              <div className="ans-dist-bars">
                {answerDist.map((item) => (
                  <div key={item.answer} className="ans-dist-col">
                    <div className="ans-bar-bg">
                      <div
                        className="ans-bar-fill"
                        style={{ height: `${Math.max(item.ratio, 6)}%` }}
                        title={`${item.answer}번: ${item.count}개 (${item.ratio}%)`}
                      />
                    </div>
                    <div className="ans-dist-label">{item.answer}번</div>
                    <div className="ans-dist-count">{item.count}개</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 유효성 검사 리포트 */}
          <div
            className={`admin-validation-box ${
              validation.errors.length > 0
                ? 'has-errors'
                : validation.warnings.length > 0
                  ? 'has-warnings-only'
                  : 'all-valid'
            }`}
          >
            <h3>
              {validation.errors.length > 0 ? (
                <>⛔ 형식 검사 오류 ({validation.errors.length}건)</>
              ) : validation.warnings.length > 0 ? (
                <>⚠ 형식 검사 통과 (경고 {validation.warnings.length}건)</>
              ) : (
                <>✔ 형식 검사 통과 (오류 없음)</>
              )}
            </h3>

            {validation.errors.length > 0 && (
              <ul className="admin-issue-list">
                {validation.errors.map((err, idx) => (
                  <li key={idx} className="admin-issue-item">
                    {err.no && <span className="issue-no">[{err.no}번 문항]</span>}
                    {err.message}
                  </li>
                ))}
              </ul>
            )}

            {validation.warnings.length > 0 && (
              <ul className="admin-issue-list" style={{ color: '#92400e', marginTop: '6px' }}>
                {validation.warnings.map((warn, idx) => (
                  <li key={idx} className="admin-issue-item">
                    <span className="issue-no">[안내/경고]</span>
                    {warn.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 전체 문항 검토 테이블 */}
          <QuestionTable
            questions={questions}
            issues={validation.errors}
            onEditQuestion={(q) => setEditingQuestion(q)}
          />
        </>
      )}

      {/* JSON 가져오기 모달 */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={(pkg) => handleUpdatePackage(pkg)}
        />
      )}

      {/* 문항별 수정 모달 */}
      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSaveQuestion}
        />
      )}

      {/* 초안 비우기 확인 모달 */}
      {showClearConfirmModal && (
        <Modal
          title="문항 초안 비우기"
          onClose={() => setShowClearConfirmModal(false)}
          actions={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowClearConfirmModal(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                onClick={handleConfirmClear}
              >
                초안 비우기 확인
              </button>
            </>
          }
        >
          <p>현재 브라우저에 임시 보관 중인 문항 초안({questions.length}문항)을 모두 삭제하시겠습니까?</p>
          <p style={{ color: '#EF4444', fontSize: '0.85rem' }}>
            삭제한 후에는 복구할 수 없습니다. 확정 전까지 다시 작성하거나 가져와야 합니다.
          </p>
        </Modal>
      )}
    </div>
  )
}
