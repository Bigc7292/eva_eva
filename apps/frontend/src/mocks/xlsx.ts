// Mock implementation for xlsx library
// This file provides fallback implementations for xlsx functions
// in case they fail to install during the build process

export const utils = {
  json_to_sheet: (data: any[]) => ({ data }),
  book_new: () => ({ SheetNames: [], Sheets: {} }),
  book_append_sheet: (workbook: any, worksheet: any, name: string) => {
    workbook.SheetNames.push(name)
    workbook.Sheets[name] = worksheet
    return workbook
  },
}

export const writeFile = (workbook: any, filename: string) => {
  console.log(`Mock XLSX: Would write workbook to ${filename}`)
  return true
}

export default {
  utils,
  writeFile,
}
