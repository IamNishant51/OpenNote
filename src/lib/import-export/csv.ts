import Papa from "papaparse";

export function parseCSV(content: string): string[][] {
  const result = Papa.parse<string[]>(content, { skipEmptyLines: true });
  if (result.errors.length > 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }
  return result.data;
}

export function serializeToCSV(data: string[][]): string {
  return Papa.unparse(data);
}

export function csvToTableBlock(data: string[][]): Record<string, unknown> {
  if (data.length === 0) {
    return {
      type: "paragraph",
      content: "Empty CSV",
      children: [],
    };
  }
  const headers = data[0];
  const rows = data.slice(1);

  return {
    type: "table",
    content: {
      headers: headers.map((h) => h.trim()),
      rows: rows.map((row) =>
        headers.map((_, i) => (row[i] || "").trim()),
      ),
    },
    children: [],
  };
}

export function tableToCSV(
  headers: string[],
  rows: string[][],
): string {
  return Papa.unparse([headers, ...rows]);
}
