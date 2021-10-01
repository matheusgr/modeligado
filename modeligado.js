import { Parser } from './parser.js'
import { process } from './convert.js'

function difference (setA, setB) {
  const _difference = new Set(setA)
  for (const elem of setB) {
    _difference.delete(elem)
  }
  return _difference
}

function parse (text, nodeName, linkData) {
  const result = new Parser().parse(text)
  const relates = new Set()
  const classes = new Set()
  for (const node of result) {
    for (const relatedClass of node.relates) {
      relates.add(relatedClass)
    }
    classes.add(node.context.name)
    nodeName.push(node.context)
    linkData.push(...node.relations)
  }
  const missingClasses = []
  for (const missingClass of difference(relates, classes)) {
    missingClasses.push({ name: missingClass, key: missingClass })
  }
  return missingClasses
}

function _saveAs (blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style = 'display: none'
  a.href = url
  a.download = filename

  // IE 11
  if (window.navigator.msSaveBlob !== undefined) {
    window.navigator.msSaveBlob(blob, filename)
    return
  }

  document.body.appendChild(a)
  requestAnimationFrame(function () {
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  })
}

// https://gojs.net/latest/samples/minimalBlob.html
function exportPng (myDiagram, filename) {
  myDiagram.makeImageData({
    size: myDiagram.documentBounds,
    background: 'white',
    returnType: 'blob',
    callback: (blob) => {
      _saveAs(blob, filename)
    }
  })
}

function exportTxt (text, filename) {
  _saveAs(new Blob([text], {
    type: 'text/plain'
  }), filename)
}

function exportJava (umlText, filename) {
  const zip = new JSZip()
  const folder = zip.folder('app')

  const result = process(new Parser().parse(umlText), 'app')
  Object.keys(result).forEach(function (key) {
    const code = result[key]
    folder.file(key + '.java', code)
  })
  zip.generateAsync({ type: 'blob' })
    .then(function (content) {
      _saveAs(content, filename)
    })
}

export { parse, exportPng, exportTxt, exportJava }
