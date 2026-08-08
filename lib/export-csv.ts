export function exportToCsv<T>(
  filename: string,
  data: T[],
  columns: { header: string; key: keyof T | ((row: T) => string) }[]
) {
  if (!data || !data.length) {
    alert('No data available to export.')
    return
  }

  // Generate CSV Header
  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',')

  // Generate Data Rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        let val: string | number = ''
        if (typeof col.key === 'function') {
          val = col.key(row)
        } else {
          const rawVal = row[col.key]
          val = rawVal !== null && rawVal !== undefined ? String(rawVal) : ''
        }
        // Escape double quotes and enclose in double quotes
        return `"${String(val).replace(/"/g, '""')}"`
      })
      .join(',')
  })

  const csvContent = [headerRow, ...dataRows].join('\n')

  // Create Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
