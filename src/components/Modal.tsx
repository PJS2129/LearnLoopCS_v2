import type { ReactNode } from 'react'
import './modal.css'

interface ModalProps {
  title: string
  children: ReactNode
  actions?: ReactNode
  onClose?: () => void
}

// 브라우저 기본 alert/confirm 대신 쓰는 커스텀 모달
export default function Modal({ title, children, actions, onClose }: ModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}
