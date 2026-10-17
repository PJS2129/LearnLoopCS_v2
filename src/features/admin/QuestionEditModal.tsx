import { useState } from 'react'
import Modal from '../../components/Modal'
import type { ExamQuestion } from './types'
import { STANDARD_DOMAINS, STANDARD_LEVELS } from './validator'

interface QuestionEditModalProps {
  question: ExamQuestion
  onClose: () => void
  onSave: (updated: ExamQuestion) => void
}

export default function QuestionEditModal({
  question,
  onClose,
  onSave,
}: QuestionEditModalProps) {
  const [no, setNo] = useState(question.no)
  const [domain, setDomain] = useState(question.domain)
  const [level, setLevel] = useState(question.level)
  const [concept, setConcept] = useState(question.concept || '')
  const [qText, setQText] = useState(question.question)
  const [choices, setChoices] = useState<string[]>([...question.choices])
  const [answer, setAnswer] = useState<number>(question.answer)
  const [source, setSource] = useState(question.source || '')
  const [explanation, setExplanation] = useState(question.explanation || '')
  const [review, setReview] = useState<boolean>(Boolean(question.review))

  const handleChoiceChange = (index: number, value: string) => {
    const updated = [...choices]
    updated[index] = value
    setChoices(updated)
  }

  const handleSave = () => {
    onSave({
      no: Number(no),
      domain,
      level,
      concept: concept.trim(),
      question: qText.trim(),
      choices: choices.map((c) => c.trim()),
      answer: Number(answer),
      source: source.trim(),
      explanation: explanation.trim(),
      review,
    })
    onClose()
  }

  return (
    <Modal
      title={`${question.no}번 문항 수정`}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            저장 후 재검사
          </button>
        </>
      }
    >
      <div className="question-edit-form" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="form-row">
          <div className="form-group" style={{ flex: '0 0 100px' }}>
            <label htmlFor="edit-no">문항 번호 (no)</label>
            <input
              id="edit-no"
              type="number"
              className="form-input"
              value={no}
              onChange={(e) => setNo(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-domain">영역 (domain)</label>
            <select
              id="edit-domain"
              className="form-select"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              {STANDARD_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              {!STANDARD_DOMAINS.includes(domain as (typeof STANDARD_DOMAINS)[number]) && (
                <option value={domain}>[잘못된 영역] {domain}</option>
              )}
            </select>
          </div>

          <div className="form-group" style={{ flex: '0 0 120px' }}>
            <label htmlFor="edit-level">난이도 (level)</label>
            <select
              id="edit-level"
              className="form-select"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {STANDARD_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
              {!STANDARD_LEVELS.includes(level as (typeof STANDARD_LEVELS)[number]) && (
                <option value={level}>[잘못된 난이도] {level}</option>
              )}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="edit-concept">핵심 개념 (concept)</label>
          <input
            id="edit-concept"
            type="text"
            className="form-input"
            value={concept}
            placeholder="예: 폰 노이만 프로그램 내장 방식"
            onChange={(e) => setConcept(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-question">질문 (question)</label>
          <textarea
            id="edit-question"
            className="form-textarea"
            rows={3}
            value={qText}
            onChange={(e) => setQText(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>선택지 4개 (choices) 및 정답 (answer)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[0, 1, 2, 3].map((idx) => {
              const choiceNum = idx + 1
              const isSelected = answer === choiceNum
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                    border: `1px solid ${isSelected ? '#93C5FD' : '#E2E8F0'}`,
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: isSelected ? '#1D4ED8' : '#475569',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <input
                      type="radio"
                      name="answer-radio"
                      checked={isSelected}
                      onChange={() => setAnswer(choiceNum)}
                    />
                    {choiceNum}번 정답
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder={`${choiceNum}번 선택지 내용`}
                    value={choices[idx] ?? ''}
                    onChange={(e) => handleChoiceChange(idx, e.target.value)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="edit-source">근거 자료 (source)</label>
            <input
              id="edit-source"
              type="text"
              className="form-input"
              value={source}
              placeholder="예: 01. 디지털세상 p.8"
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          <div
            className="form-group"
            style={{
              flex: '0 0 160px',
              justifyContent: 'center',
              display: 'flex',
              paddingTop: '20px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                color: review ? '#92400E' : '#475569',
              }}
            >
              <input
                type="checkbox"
                checked={review}
                onChange={(e) => setReview(e.target.checked)}
              />
              review: AI 검토 권장
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="edit-explanation">해설 (explanation)</label>
          <textarea
            id="edit-explanation"
            className="form-textarea"
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
