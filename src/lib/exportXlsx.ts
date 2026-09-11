import * as XLSX from "xlsx";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export interface ExportSheet {
  name: string;
  rows: object[];
}

function sanitizeSheetName(name: string) {
  return name.replace(/[\\/?*[\]:]/g, "").slice(0, 31);
}

export async function exportWorkbook(filename: string, sheets: ExportSheet[]) {
  const usableSheets = sheets.filter((s) => s.rows.length > 0);
  if (usableSheets.length === 0) return false;

  const path = await save({
    defaultPath: filename,
    filters: [{ name: "Excel", extensions: ["xlsx"] }],
  });
  if (!path) return false;

  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  for (const sheet of usableSheets) {
    let name = sanitizeSheetName(sheet.name) || "Relatorio";
    while (usedNames.has(name)) name = `${name.slice(0, 28)}_2`;
    usedNames.add(name);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheet.rows), name);
  }

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  await writeFile(path, new Uint8Array(buffer));
  return true;
}
