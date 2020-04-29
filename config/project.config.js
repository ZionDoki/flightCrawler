const version = "1.0.0"


const targetSite = "http://www.airchina.com.cn"
const reportUrl = "http://150.109.147.131:8000/api/v1/airlines/report/airchina/"

const delay = 1000
const maxNumChromium = 1
const production = false
const listenPort = 3000
const chromiumArgs = {
  headless: production,
  ignoreHTTPSErrors: true,
  args: [
    '--blink-settings=imagesEnabled=false',
    '--no-sandbox', 
    '--disable-setuid-sandbox',
    '--enable-resource-load-scheduler=false',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ],
  defaultViewport: {
    width: 1920,
    height: 1080,
  },
  // slowMo: production ? 0 : 20
}

const proxy = `http://0418fq50t1m:0418fq50t1m@${production ? "127.0.0.1" : "150.109.147.131"}:800/`

module.exports = {
  production,
  targetSite,
  chromiumArgs,
  maxNumChromium,
  listenPort,
  version,
  reportUrl,
  proxy,
  delay
}
