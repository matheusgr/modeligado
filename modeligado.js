import {Parser} from './parser.js'

function parse(text, nodeName, linkData) {
    let result = new Parser().parse(text)
    for (let node of result) {
        nodeName.push(node.context)
        linkData.push(...node.relations)
    }
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