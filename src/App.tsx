import { useEffect, useState } from 'react'
import {
  ArrowLeftRight,
  ChevronDown,
  Database,
  RotateCcw,
  ShoppingBasket,
  type LucideIcon,
} from 'lucide-react'

type GroupId = 'create-order' | 'to-order' | 'orders' | 'returns' | 'transfer' | 'database'
type NavigationGroup = {
  id: GroupId
  label: string
  icon: LucideIcon
  shortcut?: string
  items: string[]
}

const orderTabs = ['Reno Urgent', 'Reno Kvant', 'Isuzu', 'VO manuell', 'VO VOR', 'Kodat', 'Däck']

const navigationGroups: NavigationGroup[] = [
  {
    id: 'create-order',
    label: 'Skapa beställning',
    icon: ShoppingBasket,
    shortcut: 'a',
    items: ['Reno', 'Isuzu', 'Volvo', 'Kodat', 'VOC', 'Däck'],
  },
  {
    id: 'to-order',
    label: 'Att beställa',
    icon: ShoppingBasket,
    items: orderTabs,
  },
  {
    id: 'orders',
    label: 'Beställningar',
    icon: ShoppingBasket,
    shortcut: 'b',
    items: orderTabs,
  },
  {
    id: 'returns',
    label: 'Retur & Reklamation',
    icon: RotateCcw,
    shortcut: 'u',
    items: ['Reno', 'VO', 'Isuzu', 'Diverse'],
  },
  {
    id: 'transfer',
    label: 'Dataflöden',
    icon: ArrowLeftRight,
    shortcut: 'i',
    items: ['Importera', 'Exportera', 'Konvertera'],
  },
  {
    id: 'database',
    label: 'Register',
    icon: Database,
    shortcut: 'k',
    items: ['FakturaRE', 'PacklistaRE', 'Orderdatabas', 'Artikeldata', 'Arbetsorder'],
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
          <img className="brand-image" src="/Hel_favicon_invert.ico" alt="" />
        </div>
        <div className="brand-copy">
          <span className="brand-eyebrow">Anders Andersson</span>
          <label className="brand-location">
            <select
              className="brand-name"
              aria-label="Ort för beställningar"
              defaultValue="Karlstad"
            >
              <option value="Sunne">Sunne</option>
              <option value="Arvika">Arvika</option>
              <option value="Karlstad">Karlstad</option>
              <option value="Torsby">Torsby</option>
              <option value="Filipstad">Filipstad</option>
              <option value="Karlskoga">Karlskoga</option>
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </label>
        </div>
      </div>

      <div className="sidebar-section-label">Huvudmeny</div>
      <nav className="sidebar-nav" aria-label="Huvudnavigation">
        {navigationGroups.map(({ id, label, icon: Icon, shortcut, ...group }) => (
          <button
            className={`nav-group-button${activeGroup === id ? ' is-current' : ''}`}
            key={id}
            type="button"
            aria-current={activeGroup === id ? 'page' : undefined}
            aria-keyshortcuts={shortcut ? `Alt+${shortcut.toUpperCase()}` : undefined}
            title={shortcut ? `Alt+${shortcut.toUpperCase()}` : undefined}
            onClick={() => onSelectGroup({ id, label, icon: Icon, shortcut, ...group })}
          >
            <Icon className="nav-group-icon" size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {shortcut && <kbd className="shortcut-hint">Alt+{shortcut.toUpperCase()}</kbd>}
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
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return

      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.matches('input, textarea, select'))
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const group = navigationGroups.find(({ shortcut }) => shortcut === key)
      if (group) {
        event.preventDefault()
        setActiveGroup(group)
        setActiveItem(group.items[0])
        return
      }

      const digit = event.code.match(/^(?:Digit|Numpad)([1-9])$/)?.[1]
      if (!digit) return
      const item = activeGroup.items[Number(digit) - 1]
      if (!item) return

      event.preventDefault()
      setActiveItem(item)
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
                aria-keyshortcuts={`Alt+${index + 1}`}
                title={`Alt+${index + 1}`}
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
