import { APP_NAME } from '@shared/constants/appInfo'
import logoUrl from '../../assets/crawlwiseLogo.svg'
import type { AboutDialogProps } from '../../interfaces/dialogProps'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

export function AboutDialog({ onClose }: AboutDialogProps) {
  return (
    <Modal title={`About ${APP_NAME}`} onClose={onClose} footer={<Button onClick={onClose}>Close</Button>}>
      <img className="about-logo" src={logoUrl} alt={APP_NAME} width={285} height={48} />
      <p>{APP_NAME} {__APP_VERSION__}</p>
      <p className="hint">A desktop website crawler for technical SEO audits. Crawl data stays on this computer.</p>
    </Modal>
  )
}
