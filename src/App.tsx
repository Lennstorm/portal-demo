import { useState, type ReactNode } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Bell, CalendarDays, Check, ChevronDown, ClipboardList, Database, FileSpreadsheet, FileUp, Package, ShoppingBasket, Truck, type LucideIcon } from 'lucide-react'

type PageId = 'today' | 'orders' | 'database' | 'import' | 'export'
type Column<Row> = { label: string; render: (row: Row) => ReactNode }
type TodayItem = { id: string; name: string; sku: string; supplier: string; stock: string; quantity: number; price: number; urgency: 'Kritisk' | 'Bevaka' | 'Låg' }
type Order = { id: string; number: string; supplier: string; date: string; articles: number; total: number; status: 'Levererad' | 'Skickad' | 'Utkast' }
type OrderLine = { id: string; article: string; sku: string; supplier: string; order: string; date: string; quantity: number; unit: string }

const pages: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Beställa idag', icon: ShoppingBasket },
  { id: 'orders', label: 'Beställningslista', icon: ClipboardList },
  { id: 'database', label: 'Databas', icon: Database },
  { id: 'import', label: 'Import', icon: ArrowUpFromLine },
  { id: 'export', label: 'Export', icon: ArrowDownToLine },
]

const copy: Record<PageId, { title: string; description: string }> = {
  today: { title: 'Att beställa idag', description: 'En samlad överblick över artiklar som behöver fyllas på.' },
  orders: { title: 'Beställningslista', description: 'Följ dina senaste order och se vad som är på väg in.' },
  database: { title: 'Artikelregister', description: 'En rad per beställd artikel, samlat på ett ställe.' },
  import: { title: 'Importera underlag', description: 'Lägg till artiklar och beställningsrader från en fil.' },
  export: { title: 'Exportera data', description: 'Förbered CSV-underlag för uppföljning och rapportering.' },
}

const items: TodayItem[] = [
  { id: 'a1', name: 'Kaffebönor, mellanrost', sku: 'KA-2048', supplier: 'Berg & Bönor', stock: '2 kg', quantity: 12, price: 189, urgency: 'Kritisk' },
  { id: 'a2', name: 'Havredryck Barista', sku: 'ME-1102', supplier: 'Matgrossisten', stock: '6 l', quantity: 24, price: 22, urgency: 'Kritisk' },
  { id: 'a3', name: 'Pappersmugg 30 cl', sku: 'EM-3091', supplier: 'Emballagebolaget', stock: '48 st', quantity: 200, price: 2, urgency: 'Bevaka' },
  { id: 'a4', name: 'Diskmedel, oparfymerat', sku: 'ST-0825', supplier: 'Städproffsen', stock: '3 st', quantity: 8, price: 46, urgency: 'Bevaka' },
  { id: 'a5', name: 'Te, Earl Grey', sku: 'KA-2180', supplier: 'Berg & Bönor', stock: '18 st', quantity: 30, price: 54, urgency: 'Låg' },
  { id: 'a6', name: 'Servett, naturvit', sku: 'EM-3020', supplier: 'Emballagebolaget', stock: '5 pkt', quantity: 20, price: 39, urgency: 'Låg' },
]

const orders: Order[] = [
  { id: 'o1', number: 'INK-2026-0418', supplier: 'Berg & Bönor', date: '28 okt 2026', articles: 4, total: 3420, status: 'Utkast' },
  { id: 'o2', number: 'INK-2026-0417', supplier: 'Matgrossisten', date: '27 okt 2026', articles: 8, total: 6280, status: 'Skickad' },
  { id: 'o3', number: 'INK-2026-0416', supplier: 'Emballagebolaget', date: '24 okt 2026', articles: 6, total: 2195, status: 'Levererad' },
  { id: 'o4', number: 'INK-2026-0415', supplier: 'Städproffsen', date: '22 okt 2026', articles: 3, total: 1840, status: 'Levererad' },
  { id: 'o5', number: 'INK-2026-0414', supplier: 'Berg & Bönor', date: '20 okt 2026', articles: 5, total: 3975, status: 'Levererad' },
]

const lines: OrderLine[] = [
  { id: 'l1', article: 'Kaffebönor, mellanrost', sku: 'KA-2048', supplier: 'Berg & Bönor', order: 'INK-2026-0418', date: '28 okt 2026', quantity: 12, unit: 'kg' },
  { id: 'l2', article: 'Havredryck Barista', sku: 'ME-1102', supplier: 'Matgrossisten', order: 'INK-2026-0417', date: '27 okt 2026', quantity: 24, unit: 'liter' },
  { id: 'l3', article: 'Pappersmugg 30 cl', sku: 'EM-3091', supplier: 'Emballagebolaget', order: 'INK-2026-0416', date: '24 okt 2026', quantity: 200, unit: 'st' },
  { id: 'l4', article: 'Diskmedel, oparfymerat', sku: 'ST-0825', supplier: 'Städproffsen', order: 'INK-2026-0415', date: '22 okt 2026', quantity: 8, unit: 'st' },
  { id: 'l5', article: 'Te, Earl Grey', sku: 'KA-2180', supplier: 'Berg & Bönor', order: 'INK-2026-0414', date: '20 okt 2026', quantity: 30, unit: 'fp' },
  { id: 'l6', article: 'Servett, naturvit', sku: 'EM-3020', supplier: 'Emballagebolaget', order: 'INK-2026-0416', date: '24 okt 2026', quantity: 20, unit: 'fp' },
  { id: 'l7', article: 'Rengöringsduk, grön', sku: 'ST-0852', supplier: 'Städproffsen', order: 'INK-2026-0415', date: '22 okt 2026', quantity: 15, unit: 'st' },
]

const money = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 })

function DataTable<Row extends { id: string }>({ rows, columns }: { rows: Row[]; columns: Column<Row>[] }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[700px] border-collapse text-left text-sm"><thead><tr className="border-b border-[#e9ede8] bg-[#f8f9f7]">{columns.map((col, index) => <th key={index} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#718078]">{col.label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[#edf0ec] last:border-0 hover:bg-[#fbfcfa]">{columns.map((col, index) => <td key={index} className="px-5 py-4 align-middle text-[#3d4c46]">{col.render(row)}</td>)}</tr>)}</tbody></table></div>
}

function Status({ label }: { label: TodayItem['urgency'] | Order['status'] }) {
  const styles: Record<typeof label, string> = { Kritisk: 'bg-[#fff0e8] text-[#b74e27]', Bevaka: 'bg-[#fff6dc] text-[#8e6a14]', Låg: 'bg-[#eaf4e9] text-[#47774d]', Levererad: 'bg-[#eaf4e9] text-[#47774d]', Skickad: 'bg-[#e9f1f8] text-[#466b8a]', Utkast: 'bg-[#f0f1ee] text-[#68736d]' }
  return <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold ${styles[label]}`}><span className="size-1.5 rounded-full bg-current" />{label}</span>
}

function Panel<Row extends { id: string }>({ title, note, count, rows, columns }: { title: string; note: string; count: string; rows: Row[]; columns: Column<Row>[] }) {
  return <section className="overflow-hidden rounded-md border border-[#e3e9e2] bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9ede8] px-5 py-4"><div><h2 className="font-[Manrope] text-base font-bold text-[#25352f]">{title}</h2><p className="mt-1 text-xs text-[#7b8780]">{note}</p></div><span className="rounded bg-[#f0f3ef] px-2.5 py-1 text-xs font-semibold text-[#64736a]">{count}</span></div><DataTable rows={rows} columns={columns} /><div className="border-t border-[#e9ede8] px-5 py-3 text-xs text-[#78847d]">Demodata · Senast uppdaterad 28 okt 2026</div></section>
}

function TodayPage() {
  const columns: Column<TodayItem>[] = [
    { label: 'Artikel', render: (item) => <div><p className="font-semibold text-[#25352f]">{item.name}</p><p className="mt-0.5 text-xs text-[#87918b]">{item.sku}</p></div> },
    { label: 'Leverantör', render: (item) => item.supplier },
    { label: 'Lagerstatus', render: (item) => item.stock },
    { label: 'Att beställa', render: (item) => <span className="font-semibold text-[#25352f]">{item.quantity} st</span> },
    { label: 'À-pris', render: (item) => money.format(item.price) },
    { label: 'Prioritet', render: (item) => <Status label={item.urgency} /> },
  ]
  return <><div className="mb-6 grid grid-cols-1 divide-y divide-[#e3e9e2] overflow-hidden rounded-md border border-[#e3e9e2] bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Metric icon={Package} label="Artiklar att fylla på" value="06" detail="2 behöver beställas snart" /><Metric icon={Truck} label="Leverantörer" value="04" detail="Samlat i 3 orderutkast" /><Metric icon={ShoppingBasket} label="Preliminärt ordervärde" value="5 924 kr" detail="Exklusive frakt och moms" /></div><Panel title="Påfyllnadsförslag" note="Sorterat efter lagernivå" count="6 artiklar" rows={items} columns={columns} /></>
}

function Metric({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return <div className="flex items-center gap-4 px-5 py-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f0f4ed] text-[#52715d]"><Icon size={18} /></div><div><p className="text-xs font-medium text-[#78847d]">{label}</p><p className="mt-0.5 font-[Manrope] text-xl font-bold leading-tight text-[#25352f]">{value}</p><p className="mt-1 text-[11px] text-[#8b958f]">{detail}</p></div></div>
}

function OrdersPage() {
  const columns: Column<Order>[] = [
    { label: 'Ordernummer', render: (order) => <span className="font-semibold text-[#395b49]">{order.number}</span> },
    { label: 'Leverantör', render: (order) => order.supplier },
    { label: 'Skapad', render: (order) => order.date },
    { label: 'Artiklar', render: (order) => `${order.articles} rader` },
    { label: 'Ordersumma', render: (order) => <span className="font-semibold text-[#25352f]">{money.format(order.total)}</span> },
    { label: 'Status', render: (order) => <Status label={order.status} /> },
  ]
  return <Panel title="Senaste beställningar" note="Fiktiva order för demo" count="5 order" rows={orders} columns={columns} />
}

function DatabasePage() {
  const columns: Column<OrderLine>[] = [
    { label: 'Artikel', render: (line) => <div><p className="font-semibold text-[#25352f]">{line.article}</p><p className="mt-0.5 text-xs text-[#87918b]">{line.sku}</p></div> },
    { label: 'Leverantör', render: (line) => line.supplier },
    { label: 'Ordernummer', render: (line) => <span className="font-medium text-[#395b49]">{line.order}</span> },
    { label: 'Beställd', render: (line) => line.date },
    { label: 'Antal', render: (line) => <span className="font-semibold text-[#25352f]">{line.quantity} {line.unit}</span> },
  ]
  return <Panel title="Beställda artiklar" note="En rad per artikel från samtliga order" count="7 rader" rows={lines} columns={columns} />
}

function ImportPage() {
  const sources = [{ title: 'Artiklar', description: 'Produktregister och leverantörsuppgifter', file: 'artiklar_mall.csv', icon: Package }, { title: 'Beställningsrader', description: 'Historiska inköp och artikelrader', file: 'bestallningsrader_mall.csv', icon: ClipboardList }]
  return <div className="grid gap-4 lg:grid-cols-2">{sources.map(({ title, description, file, icon: Icon }) => <section key={title} className="overflow-hidden rounded-md border border-[#e3e9e2] bg-white"><div className="flex items-center gap-3 border-b border-[#edf0ec] px-5 py-4"><div className="flex size-10 items-center justify-center rounded-md bg-[#eff4ec] text-[#52715d]"><Icon size={18} /></div><div><h2 className="font-[Manrope] text-base font-bold text-[#25352f]">{title}</h2><p className="mt-1 text-xs text-[#7b8780]">{description}</p></div></div><div className="p-5"><div className="flex min-h-48 flex-col items-center justify-center rounded border border-dashed border-[#cbd6cc] bg-[#fafbf9] px-5 text-center"><div className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#eaf2e6] text-[#557760]"><FileUp size={20} /></div><p className="font-semibold text-[#34443c]">Släpp en CSV-fil här</p><p className="mt-1.5 text-xs text-[#86918a]">eller välj en fil från datorn</p><span className="mt-4 inline-flex items-center gap-2 rounded border border-[#d9e0d9] bg-white px-3 py-2 text-xs font-semibold text-[#4c6254]"><FileSpreadsheet size={14} /> Välj fil</span></div><div className="mt-4 flex items-center justify-between gap-2 text-xs text-[#7b8780]"><span>Accepterat: .csv</span><span className="inline-flex items-center gap-1.5 font-medium text-[#55745d]"><ArrowDownToLine size={14} /> {file}</span></div></div></section>)}<Notice>Filpanelerna visar importflödet visuellt. Ingen fil laddas upp eller sparas.</Notice></div>
}

function ExportPage() {
  const exports = [{ title: 'Beställningslista', description: 'Ordernummer, leverantör, status och ordersumma.', count: '5 order', icon: ClipboardList }, { title: 'Artikelregister', description: 'Beställda artiklar med antal, datum och leverantör.', count: '7 rader', icon: Database }, { title: 'Påfyllnadsförslag', description: 'Artiklar att beställa och föreslagen kvantitet.', count: '6 artiklar', icon: ShoppingBasket }]
  return <div className="grid gap-4 lg:grid-cols-3">{exports.map(({ title, description, count, icon: Icon }) => <section key={title} className="flex min-h-64 flex-col rounded-md border border-[#e3e9e2] bg-white p-5"><div className="flex items-start justify-between"><div className="flex size-10 items-center justify-center rounded-md bg-[#eff4ec] text-[#52715d]"><Icon size={18} /></div><span className="rounded bg-[#edf3e9] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5b775b]">CSV</span></div><h2 className="mt-5 font-[Manrope] text-base font-bold text-[#25352f]">{title}</h2><p className="mt-1.5 text-sm leading-5 text-[#78847d]">{description}</p><div className="mt-4 flex items-center justify-between border-t border-[#edf0ec] pt-3 text-xs text-[#77837c]"><span>{count}</span><span>28 okt 2026</span></div><span className="mt-4 inline-flex w-fit items-center gap-2 rounded border border-[#d9e0d9] bg-[#fbfcfa] px-3 py-2 text-xs font-semibold text-[#4c6254]"><ArrowDownToLine size={14} /> Exportera CSV</span></section>)}<Notice>Exportpanelerna visar tillgängliga underlag. Ingen fil skapas eller laddas ned.</Notice></div>
}

function Notice({ children }: { children: ReactNode }) {
  return <div className="flex items-start gap-3 rounded-md border border-[#dce7d7] bg-[#edf4e9] p-4 text-sm text-[#4d684f] lg:col-span-2"><Check size={17} className="mt-0.5 shrink-0" /><p><span className="font-semibold">Demoläge.</span> {children}</p></div>
}

function App() {
  const [active, setActive] = useState<PageId>('today')
  const current = copy[active]
  return <div className="min-h-screen bg-[#f2f4f1] text-[#25352f]"><header className="bg-[#152521] text-white"><div className="mx-auto max-w-[1440px] px-5 pt-5 sm:px-8"><div className="flex items-center justify-between gap-4 pb-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-md bg-[#d6ed91] text-[#20372a]"><ShoppingBasket size={20} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#aebdb4]">Nordväst · Intern</p><p className="font-[Manrope] text-lg font-bold leading-tight">Inköpsportal</p></div></div><div className="flex items-center gap-2 sm:gap-4"><span className="hidden items-center gap-2 rounded border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[#d3e2d9] sm:inline-flex"><span className="size-1.5 rounded-full bg-[#c4e879]" /> DEMO-MILJÖ</span><button type="button" aria-label="Aviseringar" className="flex size-9 items-center justify-center rounded text-[#d2ddd6] hover:bg-white/10"><Bell size={17} /></button><div className="flex items-center gap-2 border-l border-white/15 pl-3 sm:pl-4"><div className="flex size-8 items-center justify-center rounded-full bg-[#e6c6a9] text-xs font-bold text-[#45362a]">AN</div><span className="hidden text-xs font-medium text-[#e2e9e4] sm:inline">Anna Nilsson</span><ChevronDown size={14} className="hidden text-[#9cadA3] sm:block" /></div></div></div><nav aria-label="Portalens sidor" className="flex gap-1 overflow-x-auto pt-1">{pages.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={active === id ? 'page' : undefined} onClick={() => setActive(id)} className={`relative -mb-px flex shrink-0 items-center gap-2 rounded-t-md border-x border-t px-3.5 py-3 text-xs font-semibold transition-colors sm:px-4 ${active === id ? 'border-[#f2f4f1] bg-[#f2f4f1] text-[#25352f]' : 'border-transparent bg-white/[0.035] text-[#bbc8c0] hover:bg-white/[0.08] hover:text-white'}`}><Icon size={15} />{label}</button>)}</nav></div></header><main className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 sm:pt-10"><div key={active} className="page-enter"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-[#718078]"><CalendarDays size={13} /> Onsdag 28 oktober 2026 <span className="text-[#c0c9c1]">/</span> Inköp</div><h1 className="font-[Manrope] text-2xl font-extrabold leading-tight text-[#20312a] sm:text-[30px]">{current.title}</h1><p className="mt-2 text-sm text-[#738078]">{current.description}</p></div><div className="hidden items-center gap-2 rounded border border-[#dfe5de] bg-white/70 px-3 py-2 text-xs font-medium text-[#65736a] md:flex"><Check size={14} className="text-[#638b59]" /> All data är fiktiv</div></div>{active === 'today' && <TodayPage />}{active === 'orders' && <OrdersPage />}{active === 'database' && <DatabasePage />}{active === 'import' && <ImportPage />}{active === 'export' && <ExportPage />}<footer className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-[#dfe5de] pt-4 text-[11px] text-[#87928b]"><span>Nordväst · Intern inköpsportal</span><span>Endast demodata · v1.0</span></footer></div></main></div>
}

export default App
