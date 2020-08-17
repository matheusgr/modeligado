import {parse} from './parser.js'
import fs from 'fs'


fs.readFile('diagram.txt', 'utf8', function (err, data) {
    if (err) {
        return console.log(err)
    }
    console.log(parse(data))
});
