import { useState, type FormEvent } from 'react'
import { APP_CONFIG } from '../../app/config'
import Modal from '../../components/Modal'
import { useAuth } from '../../lib/auth'
import './auth.css'

export default function RegisterModal() {
  const { register, signOut, user } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [name, setName] = useState('')
  const [section, setSection] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedName = name.trim()
  const idValid = /^[0-9]{4,12}$/.test(studentId)
  const valid = idValid && trimmedName.length >= 2 && trimmedName.length <= 20 && section !== ''

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    setError(null)
    try {
      await register({ studentId, name: trimmedName, section })
    } catch {
      setError('저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
      setSaving(false)
    }
  }

  return (
    <Modal title="처음 한 번만 등록해 주세요">
      <form onSubmit={onSubmit} className="reg-form">
        <p className="reg-help">
          {user?.email} 계정으로 로그인했어요. 등록한 정보는 시험지와 결과에 자동으로 쓰이고,
          등록 후에는 직접 고칠 수 없으니 정확히 입력해 주세요. 잘못 입력했다면 담당 교수님께 알려 주세요.
        </p>

        <label className="reg-field">
          <span>학번</span>
          <input
            id="reg-student-id"
            className="mono"
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
            placeholder="숫자만 입력 (예: 2026001234)"
          />
          {studentId !== '' && !idValid && <small className="reg-error">학번은 숫자 4~12자리예요.</small>}
        </label>

        <label className="reg-field">
          <span>성명</span>
          <input
            id="reg-name"
            autoComplete="name"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </label>

        <fieldset className="reg-field reg-sections">
          <legend>분반</legend>
          <div className="reg-radio-row">
            {APP_CONFIG.sections.map((s) => (
              <label key={s} className={`reg-radio ${section === s ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="section"
                  value={s}
                  checked={section === s}
                  onChange={() => setSection(s)}
                />
                {s}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="reg-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={signOut} disabled={saving}>
            로그아웃
          </button>
          <button id="btn-register" type="submit" className="btn btn-primary" disabled={!valid || saving}>
            {saving ? '저장 중…' : '등록하기'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
