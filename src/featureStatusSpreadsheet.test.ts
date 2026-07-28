import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      i += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function loadFeatureStatusRows(): Record<string, string>[] {
  const csv = readFileSync("knowledge/feature-status.csv", "utf8").trim();
  const [headerLine, ...lines] = csv.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

describe("feature status spreadsheet", () => {
  it("keeps one canonical tracked row per user story", () => {
    const rows = loadFeatureStatusRows();
    const ids = rows.map((row) => row.id);

    expect(rows.length).toBeGreaterThan(30);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("US-001");
  });

  it("has no untested or failing user stories after the current pass", () => {
    const rows = loadFeatureStatusRows();

    expect(rows.filter((row) => row.test_status === "not-tested")).toEqual([]);
    expect(rows.filter((row) => row.test_status === "tested-fail")).toEqual([]);
  });

  it("requires fixed issues to be retested", () => {
    const fixedRows = loadFeatureStatusRows().filter((row) => row.fix_status === "completed");

    expect(fixedRows.length).toBeGreaterThan(0);
    expect(fixedRows.every((row) => row.retest_status === "tested-pass")).toBe(true);
  });
});
