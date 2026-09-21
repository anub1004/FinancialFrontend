/**
 * Exports data as a CSV file download.
 *
 * @param filename - The name of the downloaded file (include .csv extension)
 * @param headers  - Array of column header strings
 * @param rows     - 2D array of cell values (each inner array = one row)
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: string[][]
): void {
  const escapeCsvCell = (cell: string): string => {
    if (cell == null) return "";
    const str = String(cell);
    // Wrap in quotes if it contains comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
