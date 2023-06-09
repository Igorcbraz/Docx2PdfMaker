const jsdom = require('jsdom')
const { JSDOM } = jsdom
const { window } = new JSDOM('')

const mammoth = require('mammoth')
const htmlToPdfmake = require('html-to-pdfmake')

async function ConvertToPdf (data, type, options, tableLayout) {
  let input = {}

  if (type === 'path') {
    input = { path: data }
  }
  if (type === 'buffer') {
    input = { buffer: data }
  }
  if (type === 'arraybuffer') {
    input = { arrayBuffer: data }
  }

  const { value, messages } = await mammoth.convertToHtml(input, options)
  const html = value

  console.log(messages)
  if (!html) {
    throw new Error('Erro ao converter o documento')
  }

  const convertedContent = htmlToPdfmake(html, { window })
    .map(item => {
      if (item.nodeName === 'TABLE') {
        const { formatTable, formatWidth } = makeRowHaveTheSameNumberOfColumns(item.table.body)
        return {
          ...item,
          table: {
            widths: formatWidth,
            body: formatTable
          }
        }
      }

      return item
    })

  const dd = {
    content: convertedContent
  }

  return dd
}

// function to make all rows have the same number of columns
function makeRowHaveTheSameNumberOfColumns (table) {
  const formatTable = table.map((row, index) => {
    // make all rows have the same number of columns
    const numberOfColumns = Math.max(...table.map(row => row.length))
    while (row.length < numberOfColumns) {
      const cellInterface = {
        nodeName: 'TD',
        stack: [{}],
        style: ['html-td', 'html-tr', 'html-tbody', 'html-table']
      }
      row.push(cellInterface)
    }
    return row.map(cell => {
      // make all cells "fit" in their columns
      const colSpan = cell.colSpan || 1
      const vSpan = cell.rowSpan || 1
      if (colSpan === 1 && vSpan === 1) {
        return cell
      }
      return {
        ...cell,
        colSpan: colSpan,
        rowSpan: vSpan
      }
    })
  })

  const formatWidth = []
  const numberOfColumns = Math.max(...formatTable.map(row => row.length))
  for (let i = 0; i < numberOfColumns; i++) {
    formatWidth.push('*')
  }

  return { formatTable, formatWidth }
}

module.exports = { ConvertToPdf }
