import { useState } from 'react'
import type { CrawlListDialogProps } from '../../interfaces/dialogProps'
import { useCrawlList } from '../../hooks/useCrawlList'
import { api } from '../../services/ipc/api'
import { formatBytes } from '../../utils/formatCell'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const RESUMABLE = new Set(['paused', 'stopped', 'crawling', 'failed'])

export function CrawlListDialog({ activeCrawlId, running, onOpen, onContinue, onClose }: CrawlListDialogProps) {
  const { crawls, reload } = useCrawlList(true)
  const [error, setError] = useState<string | null>(null)

  const remove = async (id: string) => {
    if (!window.confirm('Delete this crawl? This cannot be undone.')) return
    try {
      await api.deleteCrawl(id)
      setError(null)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <Modal title="Crawls" onClose={onClose}>
      {error && <div className="error-banner">{error}</div>}
      {crawls.length === 0 ? (
        <p className="grid-empty">No saved crawls yet. Enter a URL and press Start.</p>
      ) : (
        <table className="simple">
          <thead>
            <tr>
              <th>Start URL</th>
              <th>Mode</th>
              <th>State</th>
              <th>URLs</th>
              <th>Size</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {crawls.map((c) => (
              <tr key={c.id}>
                <td className="wrap">{c.startUrl}</td>
                <td>{c.mode}</td>
                <td>{c.state}</td>
                <td>{c.urlCount.toLocaleString()}</td>
                <td>{formatBytes(c.fileSizeBytes)}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</td>
                <td>
                  <Button onClick={() => onOpen(c)}>Open</Button>{' '}
                  {RESUMABLE.has(c.state) && !running && <Button onClick={() => onContinue(c)}>Resume</Button>}{' '}
                  <Button disabled={running && c.id === activeCrawlId} onClick={() => void remove(c.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  )
}
