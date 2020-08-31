import {Parser} from './parser.js'

function difference(setA, setB) {
    let _difference = new Set(setA)
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return _difference
}

function parse(text, nodeName, linkData) {
    let result = new Parser().parse(text)
    let relates = new Set()
    let classes = new Set()
    for (let node of result) {
        for (let relatedClass of node.relates) {
            relates.add(relatedClass)
        }
        classes.add(node.context.name)
        nodeName.push(node.context)
        linkData.push(...node.relations)
    }
    let missingClasses = []
    for (let missingClass of difference(relates, classes)) {
        missingClasses.push({"name": missingClass, "key": missingClass})
    }
    return missingClasses
}

// https://gojs.net/latest/samples/minimalBlob.html
function exportPng(myDiagram, filename) {
    myDiagram.makeImageData({ size: myDiagram.documentBounds, background: "white", returnType: "blob", callback: (blob) => {
        console.log(blob);
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.style = "display: none";
        a.href = url;
        a.download = filename;

        // IE 11
        if (window.navigator.msSaveBlob !== undefined) {
            window.navigator.msSaveBlob(blob, filename);
            return;
        }

        document.body.appendChild(a);
        requestAnimationFrame(function() {
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
    } })
}

export {parse, exportPng}