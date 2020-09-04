import {exampleData} from './example_data.js'

function load() {
    let text = null
    if (localStorage.getItem("uml")) {
        text = localStorage.getItem("uml")
    } else {
        text = exampleData()
    }
    return text
}

function loadExample() {
    return exampleData()
}

function save(text) {
    localStorage.setItem('uml', text);
}


export {load, loadExample, save}