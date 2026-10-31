import { useEffect, useState } from 'react'
import {
  ArrowLeftRight,
  Database,
  RotateCcw,
  ShoppingBasket,
  type LucideIcon,
} from 'lucide-react'

type GroupId = 'orders' | 'returns' | 'transfer' | 'database'
type NavigationGroup = {
  id: GroupId
  label: string
  icon: LucideIcon
  items: string[]
}

const navigationGroups: NavigationGroup[] = [
  {
    id: 'orders',
    label: 'Beställningar',
    icon: ShoppingBasket,
    items: ['Reno Urgent', 'Reno Kvant', 'Isuzu', 'VO manuell', 'VO VOR', 'Kodat', 'Däck'],
  },
  {
    id: 'returns',
    label: 'Returer',
    icon: RotateCcw,
    items: ['Reno', 'VO', 'Isuzu', 'Diverse'],
  },
  {
    id: 'transfer',
    label: 'Import/Export',
    icon: ArrowLeftRight,
    items: ['Import', 'Export'],
  },
  {
    id: 'database',
    label: 'Databas',
    icon: Database,
    items: ['FakturaRE', 'PacklistaRE', 'Orderdatabas', 'Lagerplatser'],
  },
]

function Sidebar({
  activeGroup,
  onSelectGroup,
}: {
  activeGroup: GroupId
  onSelectGroup: (group: NavigationGroup) => void
}) {
  return (
    <aside className="portal-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          NV
        </div>
        <div className="brand-copy">
          <span className="brand-eyebrow">Nordväst</span>
          <span className="brand-name">Inköpsportal</span>
        </div>
      </div>

      <div className="sidebar-section-label">Huvudmeny</div>
      <nav className="sidebar-nav" aria-label="Huvudnavigation">
        {navigationGroups.map(({ id, label, icon: Icon, ...group }, index) => (
          <button
            className={`nav-group-button${activeGroup === id ? ' is-current' : ''}`}
            key={id}
            type="button"
            aria-current={activeGroup === id ? 'page' : undefined}
            aria-keyshortcuts={`Alt+${index + 1}`}
            title={`Alt+${index + 1}`}
            onClick={() => onSelectGroup({ id, label, icon: Icon, ...group })}
          >
            <Icon className="nav-group-icon" size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" aria-hidden="true" />
        <span>Portal</span>
        <span className="sidebar-version">v1.0</span>
      </div>
    </aside>
  )
}

function App() {
  const [activeGroup, setActiveGroup] = useState<NavigationGroup>(navigationGroups[0])
  const [activeItem, setActiveItem] = useState(navigationGroups[0].items[0])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (!event.altKey || event.ctrlKey || event.metaKey) return

      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.matches('input, textarea, select'))
      ) {
        return
      }

      const digit = event.code.match(/^(?:Digit|Numpad)([1-9])$/)?.[1]
      if (!digit) return

      const index = Number(digit) - 1
      if (event.shiftKey) {
        const item = activeGroup.items[index]
        if (!item) return

        event.preventDefault()
        setActiveItem(item)
        return
      }

      const group = navigationGroups[index]
      if (!group) return

      event.preventDefault()
      setActiveGroup(group)
      setActiveItem(group.items[0])
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [activeGroup])

  function selectGroup(group: NavigationGroup) {
    setActiveGroup(group)
    setActiveItem(group.items[0])
  }

  return (
    <div className="portal-layout">
      <Sidebar activeGroup={activeGroup.id} onSelectGroup={selectGroup} />
      <main className="workspace">
        <nav className="workspace-tabs" role="tablist" aria-label={`${activeGroup.label} flikar`}>
          {activeGroup.items.map((item, index) => {
            const isActive = activeItem === item

            return (
              <button
                className={`workspace-tab${isActive ? ' is-active' : ''}`}
                key={item}
                type="button"
                role="tab"
                id={`tab-${activeGroup.id}-${index}`}
                aria-selected={isActive}
                aria-keyshortcuts={`Alt+Shift+${index + 1}`}
                title={`Alt+Shift+${index + 1}`}
                onClick={() => setActiveItem(item)}
              >
                {item}
              </button>
            )
          })}
        </nav>
      </main>
    </div>
  )
}

export default App
