const version = "1.0.0"


const targetSite = "http://www.airchina.com.cn"
const reportUrl = "http://150.109.147.131:8000/api/v1/airlines/report/airchina/"


const delay = 1000
const maxNumChromium = 4
const production = true
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
  slowMo: production ? 0 : 20
}

module.exports = {
  production,
  targetSite,
  chromiumArgs,
  maxNumChromium,
  listenPort,
  version,
  reportUrl,
  delay
}
