import {exampleData} from './example_data.js'

function load(buttons) {
    let text = null
    if (localStorage.getItem("uml")) {
        text = localStorage.getItem("uml")
        buttons.save.disabled = true
    } else {
        buttons.clear.disabled = true
        clear(buttons)
        text = exampleData()
    }
    return text
}

function clear(buttons) {
    buttons.load.disabled = true
    buttons.clear.disabled = true
    localStorage.clear();
}

function save(text, buttons) {
    buttons.save.disabled = true
    buttons.load.disabled = false
    buttons.clear.disabled = false
    localStorage.setItem('uml', text);
}

export {load, clear, save}