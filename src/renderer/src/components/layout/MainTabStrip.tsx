import { useState } from 'react'
import { TABS } from '@shared/constants/filterRegistry'
import type { MainTabStripProps } from '../../interfaces/layoutProps'
import { useTabOverflow } from '../../hooks/useTabOverflow'
import { Button } from '../common/Button'

export function MainTabStrip({ selectedTab, onSelectTab }: MainTabStripProps) {
  const { containerRef, measureRef, visible } = useTabOverflow(TABS.length)
  const [open, setOpen] = useState(false)
  const shown = TABS.slice(0, visible)
  const hidden = TABS.slice(visible)
  const hiddenSelected = hidden.some((t) => t.key === selectedTab)

  return (
    <div className="main-tabs" ref={containerRef}>
      <div className="main-tabs-measure" ref={measureRef} aria-hidden="true">
        {TABS.map((t) => (
          <span key={t.key} className="main-tab">
            {t.label}
          </span>
        ))}
      </div>
      <div className="main-tabs-row" role="tablist" aria-label="Main tabs">
        {shown.map((t) => (
          <Button key={t.key} role="tab" aria-selected={t.key === selectedTab} className={`main-tab ${t.key === selectedTab ? 'active' : ''}`} title={t.description} onClick={() => onSelectTab(t.key)}>
            {t.label}
          </Button>
        ))}
        {hidden.length > 0 && (
          <div className="tab-overflow">
            <Button className={`main-tab overflow ${hiddenSelected ? 'active' : ''}`} aria-label="More tabs" aria-expanded={open} onClick={() => setOpen(!open)}>
              »
            </Button>
            {open && (
              <div className="menu-dropdown overflow-list" role="menu">
                {hidden.map((t) => (
                  <Button
                    key={t.key}
                    role="menuitem"
                    className={`menu-item ${t.key === selectedTab ? 'active' : ''}`}
                    onClick={() => {
                      setOpen(false)
                      onSelectTab(t.key)
                    }}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
