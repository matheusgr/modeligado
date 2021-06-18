import pkg from 'http-server'
const createServer = pkg.createServer

import pkg1 from 'puppeteer'
const puppeteer = pkg1

async function createUML(code, fname) {
    var server = createServer({"root": ".."})
    server.listen(8080, '127.0.0.1');
    const browser = await puppeteer.launch({"defaultViewport":{"width": 4000, "height": 2000}})
    const page = await browser.newPage()
    await page.goto('http://localhost:8080/edit.html')
    await page.$eval('#text', (el, value) => el.value = value, code)
    const input = await page.$('#text')
    await input.type(" ")
    await page.waitForTimeout(2000)
    await page.screenshot({path: fname, "clip": {"x": 2000, "y": 112, "width": 2000, "height":2000}})
    await browser.close()
    await server.close()
}

import pkg4 from 'csv';
const csv = pkg4;

import {createReadStream, writeFileSync} from 'fs'

const processFile = async () => {
  let records = []
  const parser = createReadStream(`./projeto.csv`)
  .pipe(csv.parse({
    from_line: 2
  }));
  for await (const record of parser) {
    await createUML(record[1], record[0] + ".png")
  }
  return records
}

processFile();