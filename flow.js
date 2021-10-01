function createButton (parent, emoji, action) {
  const node = document.createElement('BUTTON')
  node.innerHTML = emoji
  node.onclick = action
  parent.appendChild(node)
}

function clickControl (flowDiv, clickHistory) {
  if (!flowDiv) {
    return
  }
  const ulNode = document.createElement('UL')
  clickHistory.subscribe((data, obj) => {
    const node = document.createElement('LI')

    createButton(node, '❌', x => ulNode.removeChild(node))
    createButton(node, '🢁', x => node.previousElementSibling?.before(node))
    createButton(node, '🢃', x => node.nextElementSibling?.after(node))

    const textnode = document.createTextNode(data.className + ' ' + data.name)

    node.appendChild(textnode)
    ulNode.appendChild(node)
  })
  flowDiv.appendChild(ulNode)
}

export { clickControl }
