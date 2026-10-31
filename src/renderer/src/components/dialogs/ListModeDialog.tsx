import { useState } from 'react'
import type { ListModeDialogProps } from '../../interfaces/dialogProps'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

export function ListModeDialog({ initial, onStart, onClose }: ListModeDialogProps) {
  const [text, setText] = useState(initial.join('\n'))
  const urls = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^https?:\/\//i.test(l))

  const loadFile = async (file: File | undefined) => {
    if (file) setText(await file.text())
  }

  return (
    <Modal
      title="List Mode"
      onClose={onClose}
      footer={
        <>
          <span className="hint">{urls.length.toLocaleString()} valid URLs</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button className="primary" disabled={urls.length === 0} onClick={() => onStart(urls)}>
            Start
          </Button>
        </>
      }
    >
      <div className="config-section">
        <p className="hint">Paste one URL per line, or load a .txt or .csv file. Only URLs that start with http:// or https:// are used.</p>
        <input type="file" accept=".txt,.csv" aria-label="Load URL list file" onChange={(e) => void loadFile(e.target.files?.[0])} />
        <textarea aria-label="URL list" style={{ minHeight: 300, fontFamily: 'var(--mono)' }} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
    </Modal>
  )
}
