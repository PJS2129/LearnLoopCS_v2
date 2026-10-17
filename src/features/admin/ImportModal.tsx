import { useState, type ChangeEvent, type DragEvent } from 'react'
import Modal from '../../components/Modal'
import type { ExamPackage, ExamQuestion } from './types'
import { validateExamQuestions } from './validator'

interface ImportModalProps {
  onClose: () => void
  onImport: (pkg: ExamPackage) => void
}

export default function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [tab, setTab] = useState<'file' | 'text'>('file')
  const [textInput, setTextInput] = useState('')
  const [parsedPkg, setParsedPkg] = useState<ExamPackage | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processJsonString = (jsonStr: string) => {
    try {
      setParseError(null)
      const data = JSON.parse(jsonStr)
      let pkg: ExamPackage

      // 02-2의 exam.json 형식: { exam, domains, questions: [...] }
      if (data && Array.isArray(data.questions)) {
        pkg = {
          exam: data.exam || '컴퓨터공학개론 시험 문항',
          domains: Array.isArray(data.domains) ? data.domains : [],
          questions: data.questions as ExamQuestion[],
        }
      } else if (Array.isArray(data)) {
        // 배열만 있는 경우
        pkg = {
          exam: '컴퓨터공학개론 시험 문항',
          domains: [],
          questions: data as ExamQuestion[],
        }
      } else {
        throw new Error("JSON 형식이 올바르지 않습니다. 'questions' 배열이 포함되어 있어야 합니다.")
      }

      setParsedPkg(pkg)
    } catch (err) {
      setParsedPkg(null)
      setParseError(
        err instanceof Error
          ? err.message
          : 'JSON을 파싱할 수 없습니다. 형식을 확인해 주세요.',
      )
    }
  }

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setParseError('.json 파일만 업로드할 수 있습니다.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      processJsonString(content)
    }
    reader.onerror = () => {
      setParseError('파일을 읽는 중 오류가 발생했습니다.')
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  const validation = parsedPkg ? validateExamQuestions(parsedPkg.questions) : null

  const handleConfirm = () => {
    if (parsedPkg) {
      onImport(parsedPkg)
      onClose()
    }
  }

  return (
    <Modal
      title="시험 문항 JSON 가져오기"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!parsedPkg}
          >
            초안에 적용하기 ({parsedPkg?.questions.length ?? 0}문항)
          </button>
        </>
      }
    >
      <div className="import-modal-content">
        <div className="import-tab-nav">
          <button
            type="button"
            className={`import-tab-btn ${tab === 'file' ? 'is-active' : ''}`}
            onClick={() => setTab('file')}
          >
            파일 업로드 (.json)
          </button>
          <button
            type="button"
            className={`import-tab-btn ${tab === 'text' ? 'is-active' : ''}`}
            onClick={() => setTab('text')}
          >
            JSON 붙여넣기
          </button>
        </div>

        {tab === 'file' && (
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#1B2B5B' }}>
              exam.json 파일을 마우스로 끌어다 놓거나 클릭하여 선택하세요
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
              02-2 AI 협업 출제 프롬프트에서 생성된 JSON 파일 지원
            </p>
          </div>
        )}

        {tab === 'text' && (
          <div className="form-group">
            <label htmlFor="json-paste-area">JSON 내용 붙여넣기</label>
            <textarea
              id="json-paste-area"
              className="form-textarea"
              style={{ minHeight: '140px', fontFamily: 'monospace', fontSize: '0.82rem' }}
              placeholder='{ "exam": "중간고사", "domains": [...], "questions": [...] }'
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value)
                if (e.target.value.trim()) {
                  processJsonString(e.target.value)
                } else {
                  setParsedPkg(null)
                  setParseError(null)
                }
              }}
            />
          </div>
        )}

        {parseError && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '0.85rem',
            }}
          >
            <strong>파싱 오류:</strong> {parseError}
          </div>
        )}

        {parsedPkg && validation && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 16px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ fontWeight: 600, color: '#1B2B5B', marginBottom: '4px' }}>
              시험명: {parsedPkg.exam} (총 {parsedPkg.questions.length}문항 로드됨)
            </div>
            <div style={{ color: '#475569', fontSize: '0.82rem' }}>
              형식 검사 결과:{' '}
              {validation.errors.length > 0 ? (
                <span style={{ color: '#EF4444', fontWeight: 600 }}>
                  오류 {validation.errors.length}건 발견
                </span>
              ) : (
                <span style={{ color: '#10B981', fontWeight: 600 }}>형식 오류 없음</span>
              )}
              {validation.warnings.length > 0 && (
                <span style={{ color: '#F59E0B', marginLeft: '8px' }}>
                  (경고 {validation.warnings.length}건)
                </span>
              )}
            </div>
            <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#64748B' }}>
              적용 후에도 검토 표에서 문항별로 바로 수정할 수 있습니다.
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
