export type Row = Record<string, string | number | boolean | null | undefined>;

function toCSVValue(val: unknown): string {
  if (val == null) return '';
  const s = String(val);
  // escape quotes and wrap if needed
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function rowsToCSV(rows: Row[], headers?: string[]): string {
  if (rows.length === 0) {
    return headers && headers.length > 0 ? headers.join(',') + '\n' : '';
  }
  const cols = headers && headers.length > 0 ? headers : Object.keys(rows[0]);
  const out: string[] = [];
  out.push(cols.join(','));
  for (const r of rows) {
    out.push(cols.map((c) => toCSVValue((r as any)[c])).join(','));
  }
  return out.join('\n');
}

export function downloadBlob(filename: string, mime: string, data: BlobPart | BlobPart[]) {
  const blob = new Blob(Array.isArray(data) ? data : [data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadExcel(rows: Row[], sheetName = 'Export', filename = 'export.xlsx') {
  try {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadBlob(filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', wbout);
  } catch (e) {
    // Fallback to CSV if xlsx is not available
    const csv = rowsToCSV(rows);
    downloadBlob(filename.replace(/\.xlsx$/i, '') + '.csv', 'text/csv;charset=utf-8', csv);
  }
}
