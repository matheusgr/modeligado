import http from 'http'
import serveHandler from 'serve-handler'
import puppeteer from 'puppeteer'
import pkg4 from 'csv'
import { createReadStream } from 'fs'

const csv = pkg4

async function createUML (browser, code, fname) {
  const page = await browser.newPage()
  await page.goto('http://localhost:8080/edit.html')
  await page.$eval('#text', (el, value) => el.value = value, code)
  const input = await page.$('#text')
  await input.type(' ')
  await page.waitForTimeout(2000)
  const error = await page.evaluate(el => el.textContent, await page.$('#error'))
  if (error !== 'No errors detected...') {
    console.log(fname, error)
    return
  }
  await page.screenshot({ path: fname, clip: { x: 2000, y: 112, width: 2000, height: 2000 } })
  await page.close()
}

const processFile = async () => {
  const records = []
  const parser = createReadStream('./projeto.csv')
    .pipe(csv.parse({
      from_line: 2
    }))

  const server = http.createServer((req, res) => serveHandler(req, res, {
    public: '../' // folder of files to serve
  })).listen(8080)

  const browser = await puppeteer.launch({ defaultViewport: { width: 4000, height: 2000 } })

  for await (const record of parser) {
    await createUML(browser, record[1], record[0] + '.png')
  }

  await browser.close()
  server.close()
  return records
}

processFile()
