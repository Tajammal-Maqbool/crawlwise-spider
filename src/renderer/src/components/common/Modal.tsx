import { useId, useRef } from 'react'
import type { ModalProps } from '../../interfaces/dialogProps'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { Button } from './Button'

export function Modal({ title, onClose, footer, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useFocusTrap(dialogRef, onClose)
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header>
          <h2 id={titleId}>{title}</h2>
          <Button aria-label="Close" onClick={onClose}>
            {'✕'}
          </Button>
        </header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  )
}
