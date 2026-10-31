import { useState } from 'react'
import { DEFAULT_CONFIG } from '@shared/constants/defaultConfig'
import type { ConfigDialogProps } from '../../interfaces/dialogProps'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import { CONFIG_SECTIONS } from './configSections'

export function ConfigDialog({ config, initialSection, onSave, onClose }: ConfigDialogProps) {
  const [draft, setDraft] = useState(config)
  const [section, setSection] = useState(CONFIG_SECTIONS.some((s) => s.key === initialSection) ? initialSection : CONFIG_SECTIONS[0].key)
  const active = CONFIG_SECTIONS.find((s) => s.key === section) ?? CONFIG_SECTIONS[0]
  const Section = active.component
  return (
    <Modal
      title="Configuration"
      onClose={onClose}
      footer={
        <>
          <Button onClick={() => setDraft({ ...DEFAULT_CONFIG, mode: draft.mode, startUrl: draft.startUrl, listUrls: draft.listUrls })}>Restore Defaults</Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button className="primary" onClick={() => onSave(draft)}>
            OK
          </Button>
        </>
      }
    >
      <div className="config-layout">
        <div className="config-nav" role="tablist">
          {CONFIG_SECTIONS.map((s) => (
            <Button key={s.key} role="tab" aria-selected={s.key === section} className={`tree-item ${s.key === section ? 'selected' : ''}`} onClick={() => setSection(s.key)}>
              {s.label}
            </Button>
          ))}
        </div>
        <Section key={section} config={draft} onChange={setDraft} />
      </div>
    </Modal>
  )
}
