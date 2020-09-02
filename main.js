import {Parser} from './parser.js'
import {exampleData} from './example_data.js'
import {process} from './convert.js'
console.log(new Parser().parse(exampleData()))
console.log(process(new Parser().parse(exampleData()), "test"))