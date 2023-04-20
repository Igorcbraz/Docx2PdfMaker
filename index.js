const jsdom = require('jsdom')
const { JSDOM } = jsdom
const { window } = new JSDOM('')

const mammoth = require('mammoth')
const htmlToPdfmake = require('html-to-pdfmake')

async function ConvertToPdf (data, type, options) {
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
        return {
          ...item,
          table: {
            body: makeRowHaveTheSameNumberOfColumns(item.table.body)
          }
        }
      }

      return item
    })

  const dd = {
    info: {
      title: 'DocumentoTeste.pdf',
      author: '(WebGR) empresa'
    },
    pageMargins: [10, 25, 10, 60],
    content: convertedContent
  }

  return dd
}

// function to make all rows have the same number of columns
function makeRowHaveTheSameNumberOfColumns (table) {
  const formatTable = table.map(row => {
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

  return formatTable
}

module.exports = { ConvertToPdf }
