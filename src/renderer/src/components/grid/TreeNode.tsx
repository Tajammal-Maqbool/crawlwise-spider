import { useEffect, useState } from 'react'
import type { TreeRow } from '@shared/interfaces/treeRow'
import type { TreeNodeProps } from '../../interfaces/gridProps'
import { api } from '../../services/ipc/api'
import { ipcErrorMessage } from '../../utils/ipcErrorMessage'
import { Button } from '../common/Button'

const INDENT = 16

export function TreeNode({ crawlId, filterKey, tick, parentPath, level, selectedId, onSelect }: TreeNodeProps) {
  const [rows, setRows] = useState<TreeRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.getTreeRows(crawlId, filterKey, parentPath).then(setRows, (err: unknown) => setError(ipcErrorMessage(err)))
  }, [crawlId, filterKey, parentPath, tick])

  if (error) return <div className="error-banner">{error}</div>
  if (!rows) return <div className="tree-loading" style={{ paddingLeft: level * INDENT + 8 }}>Loading...</div>

  const toggle = (path: string) => {
    const next = new Set(open)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setOpen(next)
  }

  return (
    <>
      {rows.map((r) => (
        <div key={r.path}>
          <Button
            className={`tree-row ${r.isFolder ? 'folder' : ''} ${r.urlId !== null && r.urlId === selectedId ? 'selected' : ''}`}
            style={{ paddingLeft: level * INDENT + 8 }}
            aria-expanded={r.isFolder ? open.has(r.path) : undefined}
            onClick={() => (r.isFolder ? toggle(r.path) : r.urlId !== null && onSelect(r.urlId))}
          >
            <span>
              {r.isFolder ? (open.has(r.path) ? '▾ ' : '▸ ') : ''}
              {r.label}
            </span>
            {r.isFolder && <span className="count">{r.urls.toLocaleString()}</span>}
          </Button>
          {r.isFolder && open.has(r.path) && (
            <TreeNode crawlId={crawlId} filterKey={filterKey} tick={tick} parentPath={r.path} level={level + 1} selectedId={selectedId} onSelect={onSelect} />
          )}
        </div>
      ))}
    </>
  )
}
