import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
} from "react";
import {
  ArrowLeftRight,
  ChevronDown,
  Database,
  FileUp,
  Plus,
  RotateCcw,
  ShoppingBasket,
  Trash2,
  type LucideIcon,
} from "lucide-react";

type GroupId =
  | "create-order"
  | "to-order"
  | "orders"
  | "returns"
  | "transfer"
  | "database";
type NavigationGroup = {
  id: GroupId;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  items: string[];
};

const createOrderTabs = ["Reno", "Isuzu", "Volvo", "Kodat", "VOC", "Däck"];
const supplierOrderTabs = ["Osram", "Olja", "Diverse"] as const;
const createOrderItems = [...createOrderTabs, ...supplierOrderTabs];
const ORDER_ENTRY_ROWS_HEIGHT_BREAKPOINT = 900;
const DEFAULT_ORDER_ENTRY_ROW_COUNT = 15;
const COMPACT_ORDER_ENTRY_ROW_COUNT = 10;
const supplierOrderColumns = [
  "Prefix",
  "Artikelnummer",
  "Benämning",
  "Saldo",
  "Reserverat",
  "LP1",
  "Prognos",
  "Spärrkod",
  "Servicekvant",
  "Behov",
] as const;
const orderTabs = [
  "Reno Urgent",
  "Reno Kvant",
  "Isuzu",
  "VO manuell",
  "VO VOR",
  "Kodat",
  "Däck",
];
const orderColumns = [
  "Prefix",
  "Artikelnummer",
  "Benämning",
  "Antal",
  "AO/BO",
  "Behovsdatum",
  "Skapad av",
  "Rest",
  "Notering",
  "LP",
  "Reg.nr.",
] as const;

const invoiceColumns = [
  "Ord.Art.Ref.Ant",
  "Ordernr",
  "Artikelnr",
  "Levererat",
  "Referens",
  "Kollinr.",
  "Fakt.datum",
  "Radbelopp",
  "Inköpspris",
  "Fakturanr",
] as const;

const packingListColumns = [
  "Förv. lev.dat.",
  "Ordernr",
  "ArtikelNr",
  "Order typ",
  "Benämning",
  "Återf. Text",
  "Lev. antal",
  "Vikt (gram)",
  "Styck-pris",
  "Summa",
  "Fraktsedel",
] as const;

const backorderColumns = [
  "Account no",
  "Order",
  "Order type",
  "Ext doc.nr.",
  "Radmärkning",
  "Part no",
  "Description",
  "BO Date",
  "Dealer BO",
  "Total BO for the reference",
  "Order status",
  "Additional information",
  "Estimated Shipment from France",
  "Calculated Delivery date at Dealer",
  "BO",
  "On hold",
  "In progress",
  "Invoiced",
  "Comment for Borås",
] as const;

type OrderColumn = (typeof orderColumns)[number];
type OrderRow = Record<OrderColumn, string>;
type SupplierOrderColumn = (typeof supplierOrderColumns)[number];
type SupplierOrderRow = Record<SupplierOrderColumn, string>;
const orderColumnWidths: Record<OrderColumn, `${number}%`> = {
  Prefix: "4%",
  Artikelnummer: "8%",
  Benämning: "19%",
  Antal: "4%",
  "AO/BO": "7%",
  Behovsdatum: "9%",
  "Skapad av": "15%",
  Rest: "8%",
  Notering: "12%",
  LP: "5%",
  "Reg.nr.": "5%",
};
const supplierOrderColumnWidths: Record<SupplierOrderColumn, `${number}%`> = {
  Prefix: "5%",
  Artikelnummer: "12%",
  Benämning: "22%",
  Saldo: "5%",
  Reserverat: "5%",
  LP1: "4%",
  Prognos: "5%",
  Spärrkod: "5%",
  Servicekvant: "5%",
  Behov: "5%",
};
type InvoiceColumn = (typeof invoiceColumns)[number];
type InvoiceRow = Record<InvoiceColumn, string>;
type PackingListColumn = (typeof packingListColumns)[number];
type PackingListRow = Record<PackingListColumn, string>;
type BackorderColumn = (typeof backorderColumns)[number];
type BackorderRow = Record<BackorderColumn, string>;
type TablePasteFeedback = { message: string; isError: boolean };

function createEmptyRow(): OrderRow {
  return Object.fromEntries(
    orderColumns.map((column) => [column, ""]),
  ) as OrderRow;
}

function createEmptyRows(count: number): OrderRow[] {
  return Array.from({ length: count }, createEmptyRow);
}

function createEmptySupplierOrderRow(): SupplierOrderRow {
  return Object.fromEntries(
    supplierOrderColumns.map((column) => [column, ""]),
  ) as SupplierOrderRow;
}

function createEmptySupplierOrderRows(count: number): SupplierOrderRow[] {
  return Array.from({ length: count }, createEmptySupplierOrderRow);
}

function createEmptyInvoiceRow(): InvoiceRow {
  return Object.fromEntries(
    invoiceColumns.map((column) => [column, ""]),
  ) as InvoiceRow;
}

function createEmptyInvoiceRows(count: number): InvoiceRow[] {
  return Array.from({ length: count }, createEmptyInvoiceRow);
}

function createEmptyPackingListRow(): PackingListRow {
  return Object.fromEntries(
    packingListColumns.map((column) => [column, ""]),
  ) as PackingListRow;
}

function createEmptyPackingListRows(count: number): PackingListRow[] {
  return Array.from({ length: count }, createEmptyPackingListRow);
}

function createEmptyBackorderRow(): BackorderRow {
  return Object.fromEntries(
    backorderColumns.map((column) => [column, ""]),
  ) as BackorderRow;
}

function createEmptyBackorderRows(count: number): BackorderRow[] {
  return Array.from({ length: count }, createEmptyBackorderRow);
}

function getInitialOrderEntryRowCount(): number {
  return window.innerHeight < ORDER_ENTRY_ROWS_HEIGHT_BREAKPOINT
    ? COMPACT_ORDER_ENTRY_ROW_COUNT
    : DEFAULT_ORDER_ENTRY_ROW_COUNT;
}

function parseDelimitedText(text: string): string[][] {
  const firstRecord = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiters = [";", "\t", ","];
  let delimiter = ";";
  let highestCount = -1;

  for (const candidate of delimiters) {
    let count = 0;
    let inQuotes = false;
    for (let index = 0; index < firstRecord.length; index += 1) {
      if (firstRecord[index] === '"') {
        if (inQuotes && firstRecord[index + 1] === '"') {
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (!inQuotes && firstRecord[index] === candidate) {
        count += 1;
      }
    }
    if (count > highestCount) {
      delimiter = candidate;
      highestCount = count;
    }
  }

  const records: string[][] = [];
  let record: string[] = [];
  let value = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (inQuotes && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && character === delimiter) {
      record.push(value.trim());
      value = "";
    } else if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      record.push(value.trim());
      if (record.some((cell) => cell !== "")) records.push(record);
      record = [];
      value = "";
    } else {
      value += character;
    }
  }

  record.push(value.trim());
  if (record.some((cell) => cell !== "")) records.push(record);
  return records;
}

function rowsFromFile<T extends string>(
  text: string,
  columns: readonly T[],
  createRow: () => Record<T, string>,
): Record<T, string>[] {
  const records = parseDelimitedText(text);
  if (records.length === 0) return [];

  const normalizeHeader = (value: string) =>
    value.toLocaleLowerCase("sv-SE").replace(/[^a-zåäö0-9]/g, "");
  const normalizedColumns = columns.map(normalizeHeader);
  const firstRowHeaders = records[0].map(normalizeHeader);
  const hasHeaders = firstRowHeaders.some((header) =>
    normalizedColumns.includes(header),
  );
  const headers = hasHeaders ? firstRowHeaders : normalizedColumns;
  const data = hasHeaders ? records.slice(1) : records;

  return data.map((record) => {
    const row = createRow();
    headers.forEach((header, index) => {
      const columnIndex = normalizedColumns.indexOf(header);
      if (columnIndex !== -1)
        row[columns[columnIndex]] = record[index] ?? "";
    });
    return row;
  });
}

function parseClipboardTable(text: string): string[][] {
  const source = text.replace(/(?:\r\n|\r|\n)$/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (inQuotes && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && character === "\t") {
      row.push(value);
      value = "";
    } else if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value);
  rows.push(row);
  return rows;
}

function applyClipboardTable<Row extends Record<string, string>>(
  pastedRows: string[][],
  startRow: number,
  startColumn: number,
  currentRows: Row[],
  columns: readonly (keyof Row & string)[],
  createRow: () => Row,
): { rows: Row[]; pastedCellCount: number; rejectedCellCount: number } {
  const rows = currentRows.slice();
  let pastedCellCount = 0;
  let rejectedCellCount = 0;

  pastedRows.forEach((pastedRow, rowOffset) => {
    const targetRowIndex = startRow + rowOffset;
    while (rows.length <= targetRowIndex) rows.push(createRow());

    const updatedRow = { ...rows[targetRowIndex] } as Row;
    const writableRow = updatedRow as Record<keyof Row & string, string>;
    pastedRow.forEach((value, columnOffset) => {
      const targetColumn = columns[startColumn + columnOffset];
      if (targetColumn === undefined) {
        rejectedCellCount += 1;
      } else {
        writableRow[targetColumn] = value;
        pastedCellCount += 1;
      }
    });
    rows[targetRowIndex] = updatedRow;
  });

  return { rows, pastedCellCount, rejectedCellCount };
}

const navigationGroups: NavigationGroup[] = [
  {
    id: "create-order",
    label: "Skapa beställning",
    icon: ShoppingBasket,
    shortcut: "s",
    items: createOrderItems,
  },
  {
    id: "to-order",
    label: "Att beställa",
    icon: ShoppingBasket,
    shortcut: "a",
    items: orderTabs,
  },
  {
    id: "orders",
    label: "Beställningar",
    icon: ShoppingBasket,
    shortcut: "b",
    items: orderTabs,
  },
  {
    id: "returns",
    label: "Retur & Reklamation",
    icon: RotateCcw,
    shortcut: "u",
    items: ["Reno", "VO", "Isuzu", "Diverse"],
  },
  {
    id: "transfer",
    label: "Dataflöden",
    icon: ArrowLeftRight,
    shortcut: "i",
    items: ["Importera", "Exportera", "Konvertera"],
  },
  {
    id: "database",
    label: "Register",
    icon: Database,
    shortcut: "k",
    items: [
      "FakturaRE",
      "PacklistaRE",
      "Orderdatabas",
      "Artikeldata",
      "Arbetsorder",
      "Backorderlista RE",
    ],
  },
];

function Sidebar({
  activeGroup,
  onSelectGroup,
}: {
  activeGroup: GroupId;
  onSelectGroup: (group: NavigationGroup) => void;
}) {
  return (
    <aside className="portal-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          <img
            className="brand-image"
            src={`${import.meta.env.BASE_URL}Hel_favicon_invert.ico`}
            alt=""
          />
        </div>
        <div className="brand-copy">
          <span className="brand-eyebrow">Andreas Lennström</span>
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
        {navigationGroups.map(
          ({ id, label, icon: Icon, shortcut, ...group }) => (
            <button
              className={`nav-group-button${activeGroup === id ? " is-current" : ""}`}
              key={id}
              type="button"
              aria-current={activeGroup === id ? "page" : undefined}
              aria-keyshortcuts={
                shortcut ? `Alt+${shortcut.toUpperCase()}` : undefined
              }
              title={shortcut ? `Alt+${shortcut.toUpperCase()}` : undefined}
              onClick={() =>
                onSelectGroup({ id, label, icon: Icon, shortcut, ...group })
              }
            >
              <Icon className="nav-group-icon" size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {shortcut && (
                <kbd className="shortcut-hint">
                  Alt+{shortcut.toUpperCase()}
                </kbd>
              )}
            </button>
          ),
        )}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" aria-hidden="true" />
        <span>Portal</span>
        <span className="sidebar-version">v1.0</span>
      </div>
    </aside>
  );
}

function TablePasteStatus({
  feedback,
}: {
  feedback: TablePasteFeedback | null;
}) {
  if (!feedback) return null;

  return (
    <p
      className={`table-paste-feedback${feedback.isError ? " is-error" : ""}`}
      role={feedback.isError ? "alert" : "status"}
    >
      {feedback.message}
    </p>
  );
}

function App() {
  const [initialOrderEntryRowCount] = useState(getInitialOrderEntryRowCount);
  const [activeGroup, setActiveGroup] = useState<NavigationGroup>(
    navigationGroups[0],
  );
  const [activeItem, setActiveItem] = useState(navigationGroups[0].items[0]);
  const [orderRows, setOrderRows] = useState<Record<string, OrderRow[]>>(() =>
    Object.fromEntries(
      createOrderTabs.map((tab) => [
        tab,
        createEmptyRows(initialOrderEntryRowCount),
      ]),
    ),
  );
  const [supplierOrderRows, setSupplierOrderRows] = useState<
    Record<string, SupplierOrderRow[]>
  >(() =>
    Object.fromEntries(
      supplierOrderTabs.map((tab) => [
        tab,
        createEmptySupplierOrderRows(initialOrderEntryRowCount),
      ]),
    ),
  );
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>(() =>
    createEmptyInvoiceRows(15),
  );
  const [packingListRows, setPackingListRows] = useState<PackingListRow[]>(() =>
    createEmptyPackingListRows(15),
  );
  const [backorderRows] = useState<BackorderRow[]>(() =>
    createEmptyBackorderRows(15),
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileMessage, setFileMessage] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pasteFeedback, setPasteFeedback] =
    useState<TablePasteFeedback | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cellInputRefs = useRef(new Map<string, HTMLInputElement>());
  const pendingInputFocus = useRef<string | null>(null);
  const workspaceTabRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingTabFocus = useRef<{ groupId: GroupId; item: string } | null>(
    null,
  );

  useEffect(() => {
    if (!pendingInputFocus.current) return;
    cellInputRefs.current.get(pendingInputFocus.current)?.focus();
    pendingInputFocus.current = null;
  }, [orderRows, supplierOrderRows, invoiceRows, packingListRows]);

  useEffect(() => {
    const pendingFocus = pendingTabFocus.current;
    if (
      !pendingFocus ||
      pendingFocus.groupId !== activeGroup.id ||
      pendingFocus.item !== activeItem
    ) {
      return;
    }

    workspaceTabRefs.current
      .get(`${pendingFocus.groupId}:${pendingFocus.item}`)
      ?.focus();
    pendingTabFocus.current = null;
  }, [activeGroup, activeItem]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.key === "Escape" &&
        target instanceof HTMLInputElement &&
        target.closest(".order-table")
      ) {
        event.preventDefault();
        target.blur();
        return;
      }

      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.matches("input, textarea, select"))
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "q") {
        const firstTableInput = document.querySelector<HTMLInputElement>(
          ".order-entry .order-table input",
        );
        if (!firstTableInput) return;
        event.preventDefault();
        firstTableInput.focus();
        return;
      }

      const group = navigationGroups.find(({ shortcut }) => shortcut === key);
      if (group) {
        event.preventDefault();
        if (activeGroup.id === group.id && activeItem === group.items[0]) {
          workspaceTabRefs.current
            .get(`${group.id}:${group.items[0]}`)
            ?.focus();
          return;
        }

        pendingTabFocus.current = {
          groupId: group.id,
          item: group.items[0],
        };
        setPasteFeedback(null);
        setActiveGroup(group);
        setActiveItem(group.items[0]);
        return;
      }

      const digit = event.code.match(/^(?:Digit|Numpad)([1-9])$/)?.[1];
      if (!digit) return;
      const item = activeGroup.items[Number(digit) - 1];
      if (!item) return;

      event.preventDefault();
      if (activeItem === item) {
        workspaceTabRefs.current
          .get(`${activeGroup.id}:${item}`)
          ?.focus();
        return;
      }

      pendingTabFocus.current = { groupId: activeGroup.id, item };
      setPasteFeedback(null);
      setActiveItem(item);
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [activeGroup, activeItem]);

  function selectGroup(group: NavigationGroup) {
    setPasteFeedback(null);
    setActiveGroup(group);
    setActiveItem(group.items[0]);
  }

  function updateOrderCell(
    rowIndex: number,
    column: OrderColumn,
    value: string,
  ) {
    setOrderRows((currentRows) => ({
      ...currentRows,
      [activeItem]: currentRows[activeItem].map((row, index) =>
        index === rowIndex ? { ...row, [column]: value } : row,
      ),
    }));
  }

  function addOrderRow(focusAfterAdding = false) {
    if (focusAfterAdding) {
      pendingInputFocus.current = `${activeItem}:${currentRows.length}:Prefix`;
    }
    setOrderRows((currentRows) => ({
      ...currentRows,
      [activeItem]: [...currentRows[activeItem], createEmptyRow()],
    }));
  }

  function removeOrderRow(rowIndex: number) {
    setOrderRows((currentRows) => ({
      ...currentRows,
      [activeItem]: currentRows[activeItem].filter(
        (_, index) => index !== rowIndex,
      ),
    }));
  }

  function updateSupplierOrderCell(
    rowIndex: number,
    column: SupplierOrderColumn,
    value: string,
  ) {
    setSupplierOrderRows((currentRows) => ({
      ...currentRows,
      [activeItem]: currentRows[activeItem].map((row, index) =>
        index === rowIndex ? { ...row, [column]: value } : row,
      ),
    }));
  }

  function addSupplierOrderRow(focusAfterAdding = false) {
    if (focusAfterAdding) {
      pendingInputFocus.current = `${activeItem}:${supplierRows.length}:Prefix`;
    }
    setSupplierOrderRows((currentRows) => ({
      ...currentRows,
      [activeItem]: [...currentRows[activeItem], createEmptySupplierOrderRow()],
    }));
  }

  function removeSupplierOrderRow(rowIndex: number) {
    setSupplierOrderRows((currentRows) => ({
      ...currentRows,
      [activeItem]: currentRows[activeItem].filter(
        (_, index) => index !== rowIndex,
      ),
    }));
  }

  function updateInvoiceCell(
    rowIndex: number,
    column: InvoiceColumn,
    value: string,
  ) {
    setInvoiceRows((rows) =>
      rows.map((row, index) =>
        index === rowIndex ? { ...row, [column]: value } : row,
      ),
    );
  }

  function addInvoiceRow(focusAfterAdding = false) {
    if (focusAfterAdding) {
      pendingInputFocus.current = `database:FakturaRE:${invoiceRows.length}:Ord.Art.Ref.Ant`;
    }
    setInvoiceRows((rows) => [...rows, createEmptyInvoiceRow()]);
  }

  function removeInvoiceRow(rowIndex: number) {
    setInvoiceRows((rows) => rows.filter((_, index) => index !== rowIndex));
  }

  function updatePackingListCell(
    rowIndex: number,
    column: PackingListColumn,
    value: string,
  ) {
    setPackingListRows((rows) =>
      rows.map((row, index) =>
        index === rowIndex ? { ...row, [column]: value } : row,
      ),
    );
  }

  function addPackingListRow(focusAfterAdding = false) {
    if (focusAfterAdding) {
      pendingInputFocus.current = `database:PacklistaRE:${packingListRows.length}:Förv. lev.dat.`;
    }
    setPackingListRows((rows) => [...rows, createEmptyPackingListRow()]);
  }

  function removePackingListRow(rowIndex: number) {
    setPackingListRows((rows) => rows.filter((_, index) => index !== rowIndex));
  }

  function handleTablePaste<Row extends Record<string, string>>(
    event: ClipboardEvent<HTMLInputElement>,
    startRow: number,
    startColumn: number,
    rows: Row[],
    columns: readonly (keyof Row & string)[],
    createRow: () => Row,
    updateRows: (updatedRows: Row[]) => void,
  ) {
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !/[\r\n]/.test(text)) return;

    event.preventDefault();
    const result = applyClipboardTable(
      parseClipboardTable(text),
      startRow,
      startColumn,
      rows,
      columns,
      createRow,
    );
    updateRows(result.rows);

    if (result.rejectedCellCount > 0) {
      setPasteFeedback({
        message: `${result.pastedCellCount} celler inklistrade. ${result.rejectedCellCount} celler utanför tabellens kolumner hoppades över.`,
        isError: true,
      });
    } else {
      setPasteFeedback({
        message: `${result.pastedCellCount} celler inklistrade.`,
        isError: false,
      });
    }
  }

  function selectFile(file: File | undefined) {
    if (!file) return;
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      setSelectedFile(null);
      setFileMessage("");
      setFileError("Välj en CSV-, TSV- eller TXT-fil.");
      return;
    }
    setSelectedFile(file);
    setFileMessage("");
    setFileError("");
  }

  async function uploadFile() {
    if (!selectedFile) return;

    try {
      const fileText = await selectedFile.text();
      let importedRowCount: number;
      if (supplierRows) {
        const importedRows = rowsFromFile(
          fileText,
          supplierOrderColumns,
          createEmptySupplierOrderRow,
        );
        importedRowCount = importedRows.length;
        setSupplierOrderRows((currentRows) => ({
          ...currentRows,
          [activeItem]: [
            ...importedRows,
            ...createEmptySupplierOrderRows(
              Math.max(0, initialOrderEntryRowCount - importedRows.length),
            ),
          ],
        }));
      } else {
        const importedRows = rowsFromFile(
          fileText,
          orderColumns,
          createEmptyRow,
        );
        importedRowCount = importedRows.length;
        setOrderRows((currentRows) => ({
          ...currentRows,
          [activeItem]: [
            ...importedRows,
            ...createEmptyRows(
              Math.max(0, initialOrderEntryRowCount - importedRows.length),
            ),
          ],
        }));
      }
      setFileMessage(
        `${importedRowCount} rader importerade från ${selectedFile.name}.`,
      );
      setFileError("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setFileError(
        error instanceof Error
          ? `Filen kunde inte läsas: ${error.message}`
          : "Filen kunde inte läsas.",
      );
      setFileMessage("");
    }
  }

  const currentRows =
    orderRows[activeItem] ?? createEmptyRows(initialOrderEntryRowCount);
  const supplierRows = supplierOrderRows[activeItem];

  return (
    <div className="portal-layout">
      <Sidebar activeGroup={activeGroup.id} onSelectGroup={selectGroup} />
      <main className="workspace">
        <nav
          className="workspace-tabs"
          role="tablist"
          aria-label={`${activeGroup.label} flikar`}
        >
          {activeGroup.items.map((item, index) => {
            const isActive = activeItem === item;

            return (
              <button
                className={`workspace-tab${isActive ? " is-active" : ""}`}
                key={item}
                type="button"
                role="tab"
                id={`tab-${activeGroup.id}-${index}`}
                ref={(element) => {
                  const key = `${activeGroup.id}:${item}`;
                  if (element) workspaceTabRefs.current.set(key, element);
                  else workspaceTabRefs.current.delete(key);
                }}
                aria-selected={isActive}
                aria-keyshortcuts={`Alt+${index + 1}`}
                title={`Alt+${index + 1}`}
                onClick={() => {
                  if (activeItem !== item) setPasteFeedback(null);
                  setActiveItem(item);
                }}
              >
                {item}
              </button>
            );
          })}
        </nav>
        {activeGroup.id === "create-order" && (
          <section
            className="order-entry"
            role="tabpanel"
            aria-labelledby={`tab-create-order-${activeGroup.items.indexOf(activeItem)}`}
          >
            <header className="order-entry-header has-upload-panel">
              <div>
                <h1>{activeItem}</h1>
              </div>
              <div className="order-entry-actions">
                <aside
                  className={`file-upload-panel${isDragging ? " is-dragging" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(event) => {
                    if (
                      !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                      )
                    ) {
                      setIsDragging(false);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    selectFile(event.dataTransfer.files[0]);
                  }}
                >
                  <div className="upload-icon">
                    <FileUp size={21} aria-hidden="true" />
                  </div>
                  <div className="upload-copy">
                    <h2>Importera från fil</h2>
                    {fileError ? (
                      <p
                        className="file-feedback is-error"
                        role="alert"
                        title={fileError}
                      >
                        {fileError}
                      </p>
                    ) : fileMessage ? (
                      <p
                        className="file-feedback"
                        role="status"
                        title={fileMessage}
                      >
                        {fileMessage}
                      </p>
                    ) : selectedFile ? (
                      <p className="selected-file" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                    ) : null}
                  </div>
                  <input
                    ref={fileInputRef}
                    className="visually-hidden"
                    type="file"
                    accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                    aria-label="Välj fil att importera"
                    onChange={(event) => selectFile(event.target.files?.[0])}
                  />
                  <div className="upload-actions">
                    <button
                      className="upload-button"
                      type="button"
                      disabled={!selectedFile}
                      onClick={() => void uploadFile()}
                    >
                      Ladda upp
                    </button>
                    <button
                      className="choose-file-button"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Välj fil
                    </button>
                  </div>
                </aside>
                <button
                  className="upload-button create-order-button"
                  type="button"
                >
                  {supplierRows ? "Skapa beställningsfil" : "Skapa beställning"}
                </button>
              </div>
            </header>

            <div className="order-entry-content">
              <div className="order-table-section">
                <TablePasteStatus feedback={pasteFeedback} />
                <div
                  className={`order-table-scroll${supplierRows ? " supplier-order-table-scroll" : ""}`}
                >
                  {supplierRows ? (
                    <table className="order-table order-entry-table supplier-order-table">
                      <colgroup>
                        {supplierOrderColumns.map((column) => (
                          <col
                            key={column}
                            style={{ width: supplierOrderColumnWidths[column] }}
                          />
                        ))}
                        <col style={{ width: "10%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          {supplierOrderColumns.map((column) => (
                            <th key={column} scope="col">
                              {column}
                            </th>
                          ))}
                          <th
                            className="order-table-action-heading"
                            aria-label="Lägg till rad"
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {supplierRows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {supplierOrderColumns.map((column) => (
                              <td key={column}>
                                <input
                                  aria-label={`${column}, rad ${rowIndex + 1}`}
                                  ref={(element) => {
                                    const refKey = `${activeItem}:${rowIndex}:${column}`;
                                    if (element)
                                      cellInputRefs.current.set(
                                        refKey,
                                        element,
                                      );
                                    else cellInputRefs.current.delete(refKey);
                                  }}
                                  value={row[column]}
                                  className={
                                    row[column] ? "has-content" : undefined
                                  }
                                  onPaste={(event) =>
                                    handleTablePaste(
                                      event,
                                      rowIndex,
                                      supplierOrderColumns.indexOf(column),
                                      supplierRows,
                                      supplierOrderColumns,
                                      createEmptySupplierOrderRow,
                                      (updatedRows) =>
                                        setSupplierOrderRows((currentRows) => ({
                                          ...currentRows,
                                          [activeItem]: updatedRows,
                                        })),
                                    )
                                  }
                                  onChange={(event) =>
                                    updateSupplierOrderCell(
                                      rowIndex,
                                      column,
                                      event.target.value,
                                    )
                                  }
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === "Tab" &&
                                      !event.shiftKey &&
                                      rowIndex === supplierRows.length - 1 &&
                                      column ===
                                        supplierOrderColumns[
                                          supplierOrderColumns.length - 1
                                        ]
                                    ) {
                                      event.preventDefault();
                                      addSupplierOrderRow(true);
                                    }
                                  }}
                                />
                              </td>
                            ))}
                            <td className="order-table-action-cell">
                              <div className="order-row-actions">
                                <button
                                  className="remove-row-cell"
                                  type="button"
                                  aria-label={`Ta bort rad ${rowIndex + 1}`}
                                  title={`Ta bort rad ${rowIndex + 1}`}
                                  onClick={() =>
                                    removeSupplierOrderRow(rowIndex)
                                  }
                                >
                                  <Trash2 size={16} aria-hidden="true" />
                                </button>
                                {rowIndex === supplierRows.length - 1 && (
                                  <button
                                    className="add-row-cell"
                                    type="button"
                                    aria-label="Lägg till rad"
                                    title="Lägg till rad"
                                    onClick={() => addSupplierOrderRow()}
                                  >
                                    <Plus size={17} aria-hidden="true" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="order-table order-entry-table">
                      <colgroup>
                        {orderColumns.map((column) => (
                          <col
                            key={column}
                            style={{ width: orderColumnWidths[column] }}
                          />
                        ))}
                        <col style={{ width: "4%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          {orderColumns.map((column) => (
                            <th key={column} scope="col">
                              {column}
                            </th>
                          ))}
                          <th
                            className="order-table-action-heading"
                            aria-label="Lägg till rad"
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {currentRows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {orderColumns.map((column) => (
                              <td key={column}>
                                <input
                                  aria-label={`${column}, rad ${rowIndex + 1}`}
                                  ref={(element) => {
                                    const refKey = `${activeItem}:${rowIndex}:${column}`;
                                    if (element)
                                      cellInputRefs.current.set(
                                        refKey,
                                        element,
                                      );
                                    else cellInputRefs.current.delete(refKey);
                                  }}
                                  value={row[column]}
                                  className={
                                    row[column] ? "has-content" : undefined
                                  }
                                  onPaste={(event) =>
                                    handleTablePaste(
                                      event,
                                      rowIndex,
                                      orderColumns.indexOf(column),
                                      currentRows,
                                      orderColumns,
                                      createEmptyRow,
                                      (updatedRows) =>
                                        setOrderRows((existingRows) => ({
                                          ...existingRows,
                                          [activeItem]: updatedRows,
                                        })),
                                    )
                                  }
                                  onChange={(event) =>
                                    updateOrderCell(
                                      rowIndex,
                                      column,
                                      event.target.value,
                                    )
                                  }
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === "Tab" &&
                                      !event.shiftKey &&
                                      rowIndex === currentRows.length - 1 &&
                                      column ===
                                        orderColumns[orderColumns.length - 1]
                                    ) {
                                      event.preventDefault();
                                      addOrderRow(true);
                                    }
                                  }}
                                />
                              </td>
                            ))}
                            <td className="order-table-action-cell">
                              <div className="order-row-actions">
                                <button
                                  className="remove-row-cell"
                                  type="button"
                                  aria-label={`Ta bort rad ${rowIndex + 1}`}
                                  title={`Ta bort rad ${rowIndex + 1}`}
                                  onClick={() => removeOrderRow(rowIndex)}
                                >
                                  <Trash2 size={16} aria-hidden="true" />
                                </button>
                                {rowIndex === currentRows.length - 1 && (
                                  <button
                                    className="add-row-cell"
                                    type="button"
                                    aria-label="Lägg till rad"
                                    title="Lägg till rad"
                                    onClick={() => addOrderRow()}
                                  >
                                    <Plus size={17} aria-hidden="true" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
        {activeGroup.id === "database" && activeItem === "FakturaRE" && (
          <section
            className="order-entry"
            role="tabpanel"
            aria-labelledby={`tab-database-${activeGroup.items.indexOf(activeItem)}`}
          >
            <header className="order-entry-header">
              <div>
                <p className="order-entry-eyebrow">Register</p>
                <h1>FakturaRE</h1>
              </div>
            </header>
            <div className="order-table-section">
              <TablePasteStatus feedback={pasteFeedback} />
              <div className="order-table-scroll">
                <table className="order-table invoice-table">
                  <thead>
                    <tr>
                      {invoiceColumns.map((column) => (
                        <th key={column} scope="col">
                          {column}
                        </th>
                      ))}
                      <th
                        className="order-table-action-heading"
                        aria-label="Åtgärder"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {invoiceColumns.map((column) => (
                          <td key={column}>
                            <input
                              aria-label={`${column}, rad ${rowIndex + 1}`}
                              ref={(element) => {
                                const refKey = `database:FakturaRE:${rowIndex}:${column}`;
                                if (element)
                                  cellInputRefs.current.set(refKey, element);
                                else cellInputRefs.current.delete(refKey);
                              }}
                              value={row[column]}
                              className={
                                row[column] ? "has-content" : undefined
                              }
                              onPaste={(event) =>
                                handleTablePaste(
                                  event,
                                  rowIndex,
                                  invoiceColumns.indexOf(column),
                                  invoiceRows,
                                  invoiceColumns,
                                  createEmptyInvoiceRow,
                                  setInvoiceRows,
                                )
                              }
                              onChange={(event) =>
                                updateInvoiceCell(
                                  rowIndex,
                                  column,
                                  event.target.value,
                                )
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Tab" &&
                                  !event.shiftKey &&
                                  rowIndex === invoiceRows.length - 1 &&
                                  column ===
                                    invoiceColumns[invoiceColumns.length - 1]
                                ) {
                                  event.preventDefault();
                                  addInvoiceRow(true);
                                }
                              }}
                            />
                          </td>
                        ))}
                        <td className="order-table-action-cell">
                          <div className="order-row-actions">
                            <button
                              className="remove-row-cell"
                              type="button"
                              aria-label={`Ta bort rad ${rowIndex + 1}`}
                              title={`Ta bort rad ${rowIndex + 1}`}
                              onClick={() => removeInvoiceRow(rowIndex)}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                            {rowIndex === invoiceRows.length - 1 && (
                              <button
                                className="add-row-cell"
                                type="button"
                                aria-label="Lägg till rad"
                                title="Lägg till rad"
                                onClick={() => addInvoiceRow()}
                              >
                                <Plus size={17} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        {activeGroup.id === "database" && activeItem === "PacklistaRE" && (
          <section
            className="order-entry"
            role="tabpanel"
            aria-labelledby={`tab-database-${activeGroup.items.indexOf(activeItem)}`}
          >
            <header className="order-entry-header">
              <div>
                <p className="order-entry-eyebrow">Register</p>
                <h1>PacklistaRE</h1>
              </div>
            </header>
            <div className="order-table-section">
              <TablePasteStatus feedback={pasteFeedback} />
              <div className="order-table-scroll">
                <table className="order-table packing-list-table">
                  <thead>
                    <tr>
                      {packingListColumns.map((column) => (
                        <th key={column} scope="col">
                          {column}
                        </th>
                      ))}
                      <th
                        className="order-table-action-heading"
                        aria-label="Åtgärder"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {packingListRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {packingListColumns.map((column) => (
                          <td key={column}>
                            <input
                              aria-label={`${column}, rad ${rowIndex + 1}`}
                              ref={(element) => {
                                const refKey = `database:PacklistaRE:${rowIndex}:${column}`;
                                if (element)
                                  cellInputRefs.current.set(refKey, element);
                                else cellInputRefs.current.delete(refKey);
                              }}
                              value={row[column]}
                              className={
                                row[column] ? "has-content" : undefined
                              }
                              onPaste={(event) =>
                                handleTablePaste(
                                  event,
                                  rowIndex,
                                  packingListColumns.indexOf(column),
                                  packingListRows,
                                  packingListColumns,
                                  createEmptyPackingListRow,
                                  setPackingListRows,
                                )
                              }
                              onChange={(event) =>
                                updatePackingListCell(
                                  rowIndex,
                                  column,
                                  event.target.value,
                                )
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Tab" &&
                                  !event.shiftKey &&
                                  rowIndex === packingListRows.length - 1 &&
                                  column ===
                                    packingListColumns[
                                      packingListColumns.length - 1
                                    ]
                                ) {
                                  event.preventDefault();
                                  addPackingListRow(true);
                                }
                              }}
                            />
                          </td>
                        ))}
                        <td className="order-table-action-cell">
                          <div className="order-row-actions">
                            <button
                              className="remove-row-cell"
                              type="button"
                              aria-label={`Ta bort rad ${rowIndex + 1}`}
                              title={`Ta bort rad ${rowIndex + 1}`}
                              onClick={() => removePackingListRow(rowIndex)}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                            {rowIndex === packingListRows.length - 1 && (
                              <button
                                className="add-row-cell"
                                type="button"
                                aria-label="Lägg till rad"
                                title="Lägg till rad"
                                onClick={() => addPackingListRow()}
                              >
                                <Plus size={17} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        {activeGroup.id === "database" &&
          activeItem === "Backorderlista RE" && (
            <section
              className="order-entry"
              role="tabpanel"
              aria-labelledby={`tab-database-${activeGroup.items.indexOf(activeItem)}`}
            >
              <header className="order-entry-header has-action">
                <div>
                  <p className="order-entry-eyebrow">Register</p>
                  <h1>Backorderlista RE</h1>
                </div>
                <button
                  className="upload-button"
                  type="button"
                  disabled
                  title="Importfunktionen är tillfälligt avstängd"
                >
                  <FileUp size={16} aria-hidden="true" />
                  Importera Excel-fil
                </button>
              </header>
              <div className="order-table-section">
                <div className="order-table-scroll">
                  <table className="order-table backorder-table">
                    <thead>
                      <tr>
                        {backorderColumns.map((column) => (
                          <th key={column} scope="col">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {backorderRows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {backorderColumns.map((column) => (
                            <td key={column}>
                              <input
                                aria-label={`${column}, rad ${rowIndex + 1}`}
                                value={row[column]}
                                readOnly
                                className={
                                  row[column] ? "has-content" : undefined
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
      </main>
    </div>
  );
}

export default App;
