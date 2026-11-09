import artikeldata from "./register/artikeldata.json";
import arbetsorder from "./register/arbetsorder.json";
import backorderlistaRE from "./register/backorderlista-re.json";
import fakturaRE from "./register/faktura-re.json";
import orderdatabas from "./register/orderdatabas.json";
import packlistaRE from "./register/packlista-re.json";

export type RegisterDataset = {
  columns: string[];
  rows: Record<string, string>[];
};

export const registerDatasets: Record<string, RegisterDataset> = {
  FakturaRE: fakturaRE,
  PacklistaRE: packlistaRE,
  Orderdatabas: orderdatabas,
  Artikeldata: artikeldata,
  Arbetsorder: arbetsorder,
  "Backorderlista RE": backorderlistaRE,
};

for (const [name, dataset] of Object.entries(registerDatasets)) {
  const columnSet = new Set(dataset.columns);
  if (columnSet.size !== dataset.columns.length || dataset.rows.length === 0) {
    throw new Error(
      `Mockdata för ${name} har ogiltiga kolumner eller saknar rader.`,
    );
  }

  dataset.rows.forEach((row, rowIndex) => {
    const rowKeys = Object.keys(row);
    if (
      rowKeys.length !== dataset.columns.length ||
      dataset.columns.some((column) => typeof row[column] !== "string") ||
      rowKeys.some((column) => !columnSet.has(column))
    ) {
      throw new Error(
        `Mockdata för ${name}, rad ${rowIndex + 1}, matchar inte tabellens kolumner.`,
      );
    }
  });
}
