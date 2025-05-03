// Mock implementation for xlsx library
// This file provides fallback implementations for xlsx functions
// in case they fail to install during the build process

// Define types to avoid using 'any'
interface Workbook {
  SheetNames: string[];
  Sheets: Record<string, Worksheet>;
}

interface Worksheet {
  data: unknown[];
  [key: string]: unknown;
}

export const utils = {
  json_to_sheet: (data: unknown[]): Worksheet => ({ data }),
  book_new: (): Workbook => ({ SheetNames: [], Sheets: {} }),
  book_append_sheet: (workbook: Workbook, worksheet: Worksheet, name: string): Workbook => {
    workbook.SheetNames.push(name);
    workbook.Sheets[name] = worksheet;
    return workbook;
  },
};

export const writeFile = (workbook: Workbook, filename: string): boolean => {
  console.log(`Mock XLSX: Would write workbook to ${filename}`);
  return true;
};

export default {
  utils,
  writeFile,
};
