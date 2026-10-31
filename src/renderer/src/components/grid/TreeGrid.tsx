import type { TreeGridProps } from '../../interfaces/gridProps'
import { TreeNode } from './TreeNode'

export function TreeGrid({ crawlId, filterKey, tick, selectedId, onSelect }: TreeGridProps) {
  if (!crawlId) return <div className="grid tree-grid"><div className="grid-empty">Enter a URL above and press Start to crawl a site.</div></div>
  return (
    <div className="grid tree-grid" role="tree" aria-label="URL tree">
      <TreeNode crawlId={crawlId} filterKey={filterKey} tick={tick} parentPath="" level={0} selectedId={selectedId} onSelect={onSelect} />
    </div>
  )
}
