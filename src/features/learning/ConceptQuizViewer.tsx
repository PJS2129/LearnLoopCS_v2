import { useEffect, useRef, useState } from 'react'
import {
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  ExamIcon,
  RotateCcwIcon,
} from '../../components/Icon'
import { useAuth } from '../../lib/auth'
import type { ConceptCard, ConceptQuizContent, LearningTab, PracticeQuiz } from '../../lib/types'
import { recordPracticeQuizAttempt } from './learningHistory'
import { recordActivity } from './activity'

interface Props {
  tab: LearningTab
  content: ConceptQuizContent
}

type SubTab = 'cards' | 'quiz'

export default function ConceptQuizViewer({ tab, content }: Props) {
  const { user } = useAuth()
  const [subTab, setSubTab] = useState<SubTab>('cards')
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [targetCardId, setTargetCardId] = useState<string | null>(null)

  const cardRefs = useRef<Record<string, HTMLElement | null>>({})

  // 카드 토글
  const toggleCard = (cardId: string, conceptName: string) => {
    setExpandedCards((prev) => {
      const willExpand = !prev[cardId]
      if (willExpand) {
        recordActivity(
          {
            type: 'activity',
            tab: tab.id,
            activity: 'view_card',
            detail: conceptName,
            duration: 0,
          },
          user?.uid,
          tab.name,
        )
      }
      return { ...prev, [cardId]: willExpand }
    })
  }

  // 오답 시 관련 개념 카드로 이동
  const handleGoToConcept = (cardId?: string) => {
    if (!cardId) return
    setSubTab('cards')
    setExpandedCards((prev) => ({ ...prev, [cardId]: true }))
    setTargetCardId(cardId)
  }

  // 관련 개념 카드 이동 시 스크롤
  useEffect(() => {
    if (subTab === 'cards' && targetCardId) {
      const el = cardRefs.current[targetCardId]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [subTab, targetCardId])

  const quiz: PracticeQuiz | undefined = content.quizzes[currentQuizIndex]
  const isCorrect = isSubmitted && selectedOption !== null && quiz && selectedOption === quiz.answerIndex

  // 정답 제출
  const handleSubmitQuiz = async () => {
    if (selectedOption === null || !quiz || isSubmitted) return
    setIsSubmitted(true)
    const correct = selectedOption === quiz.answerIndex

    if (user?.uid) {
      await recordPracticeQuizAttempt({
        uid: user.uid,
        quizId: quiz.id,
        tabId: tab.id,
        tabName: tab.name,
        selectedOption,
        isCorrect: correct,
      })
    }
  }

  // 다음 문제
  const handleNextQuiz = () => {
    if (currentQuizIndex < content.quizzes.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1)
      setSelectedOption(null)
      setIsSubmitted(false)
    }
  }

  // 다시 풀기
  const handleRetryQuiz = () => {
    setSelectedOption(null)
    setIsSubmitted(false)
  }

  return (
    <div className="concept-quiz-container">
      {/* 상단 서브 탭 바 */}
      <div className="cq-header-card">
        <div className="cq-title-group">
          <span className="cq-area-badge">{content.area}</span>
          <h2 className="cq-main-title">{content.title}</h2>
        </div>
        <div className="cq-subtabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'cards'}
            className={`cq-subtab ${subTab === 'cards' ? 'is-active' : ''}`}
            onClick={() => setSubTab('cards')}
          >
            <BookIcon size={18} />
            <span>개념 카드</span>
            <span className="cq-count-badge">{content.cards.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'quiz'}
            className={`cq-subtab ${subTab === 'quiz' ? 'is-active' : ''}`}
            onClick={() => setSubTab('quiz')}
          >
            <ExamIcon size={18} />
            <span>연습 문제</span>
            <span className="cq-count-badge">{content.quizzes.length}</span>
          </button>
        </div>
      </div>

      {/* 1. 개념 카드 모드 */}
      {subTab === 'cards' && (
        <section className="cq-cards-section" aria-label="개념 카드 목록">
          <p className="cq-section-guide">
            카드를 클릭하면 세부 설명과 실제 예시를 자세히 확인할 수 있어요.
          </p>
          <div className="cq-cards-grid">
            {content.cards.map((card: ConceptCard) => {
              const isOpen = Boolean(expandedCards[card.id])
              const isTarget = targetCardId === card.id
              return (
                <article
                  key={card.id}
                  ref={(el) => {
                    cardRefs.current[card.id] = el
                  }}
                  className={`cq-card ${isOpen ? 'is-open' : ''} ${isTarget ? 'is-highlight' : ''}`}
                  onClick={() => toggleCard(card.id, card.concept)}
                >
                  <header className="cq-card-head">
                    <div className="cq-card-title-wrap">
                      <span className="cq-card-num">CARD</span>
                      <h3 className="cq-card-concept">{card.concept}</h3>
                    </div>
                    <button
                      type="button"
                      className="cq-card-toggle"
                      aria-expanded={isOpen}
                      aria-label={isOpen ? '카드 접기' : '카드 펼치기'}
                    >
                      {isOpen ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
                    </button>
                  </header>

                  <p className="cq-card-summary">{card.summary}</p>

                  {isOpen && (
                    <div className="cq-card-body" onClick={(e) => e.stopPropagation()}>
                      <div className="cq-card-example-box">
                        <strong className="cq-box-label">구체적 예시</strong>
                        <p className="cq-box-text">{card.example}</p>
                      </div>
                      <footer className="cq-card-ref">
                        <span className="cq-ref-label">근거 자료:</span>
                        <span className="cq-ref-text">{card.reference}</span>
                      </footer>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* 2. 연습 문제 모드 */}
      {subTab === 'quiz' && quiz && (
        <section className="cq-quiz-section" aria-label="연습 문제">
          <div className="card cq-quiz-card">
            {/* 문제 상단 바 */}
            <div className="cq-quiz-topbar">
              <span className="cq-quiz-badge">
                문제 {currentQuizIndex + 1} / {content.quizzes.length}
              </span>
              <span className="cq-quiz-type-label">객관식 (4지선다)</span>
            </div>

            {/* 문항 본문 */}
            <h3 className="cq-quiz-question">{quiz.question}</h3>

            {/* 선택지 목록 */}
            <div className="cq-options-list" role="radiogroup" aria-label="보기">
              {quiz.options.map((opt, idx) => {
                const isSelected = selectedOption === idx
                let optState = ''
                if (isSubmitted) {
                  if (idx === quiz.answerIndex) {
                    optState = 'is-correct'
                  } else if (isSelected) {
                    optState = 'is-wrong'
                  }
                } else if (isSelected) {
                  optState = 'is-selected'
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isSubmitted}
                    className={`cq-option-btn ${optState}`}
                    onClick={() => setSelectedOption(idx)}
                  >
                    <span className="cq-option-num">{idx + 1}</span>
                    <span className="cq-option-text">{opt}</span>
                    {isSubmitted && idx === quiz.answerIndex && (
                      <span className="cq-badge-correct" aria-label="정답">
                        <CheckIcon size={16} /> 정답
                      </span>
                    )}
                    {isSubmitted && isSelected && idx !== quiz.answerIndex && (
                      <span className="cq-badge-wrong" aria-label="오답">
                        <CloseIcon size={16} /> 내 선택
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 제출 버튼 (미제출 시) */}
            {!isSubmitted && (
              <div className="cq-submit-area">
                <button
                  type="button"
                  className="btn-primary cq-submit-btn"
                  disabled={selectedOption === null}
                  onClick={handleSubmitQuiz}
                >
                  <CheckIcon size={18} />
                  <span>정답 확인</span>
                </button>
              </div>
            )}

            {/* 해설 및 피드백 (제출 후) */}
            {isSubmitted && (
              <div className={`cq-feedback-card ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
                <div className="cq-feedback-header">
                  <div className="cq-feedback-title">
                    {isCorrect ? (
                      <>
                        <CheckIcon size={22} className="cq-icon-success" />
                        <strong>정답입니다! 훌륭해요.</strong>
                      </>
                    ) : (
                      <>
                        <CloseIcon size={22} className="cq-icon-danger" />
                        <strong>아쉽네요! 정답을 다시 확인해 보세요.</strong>
                      </>
                    )}
                  </div>
                </div>

                <div className="cq-feedback-body">
                  <p className="cq-explanation">
                    <strong>해설:</strong> {quiz.explanation}
                  </p>
                  {quiz.tip && (
                    <div className="cq-tip-box">
                      <strong>💡 핵심 포인트</strong>
                      <p>{quiz.tip}</p>
                    </div>
                  )}
                </div>

                {/* 하단 액션 버튼들 */}
                <div className="cq-feedback-actions">
                  {!isCorrect && quiz.cardId && (
                    <button
                      type="button"
                      className="btn-secondary cq-action-btn"
                      onClick={() => handleGoToConcept(quiz.cardId)}
                    >
                      <BookIcon size={16} />
                      <span>관련 개념 다시 보기</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary cq-action-btn"
                    onClick={handleRetryQuiz}
                  >
                    <RotateCcwIcon size={16} />
                    <span>다시 풀기</span>
                  </button>
                  {currentQuizIndex < content.quizzes.length - 1 && (
                    <button
                      type="button"
                      className="btn-primary cq-action-btn"
                      onClick={handleNextQuiz}
                    >
                      <span>다음 문제</span>
                      <ArrowRightIcon size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
