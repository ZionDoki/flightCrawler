let maxTries = 3
const maxNumChromium = 1
const production = false
const targetSite = "http://www.airchina.com.cn"
const listenPort = 3000
const chromiumArgs = {
  headless: production,
  ignoreHTTPSErrors: true,
  args: [
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
  slowMo: production ? 0 : 50
}

module.exports = {
  production,
  targetSite,
  maxTries,
  chromiumArgs,
  maxNumChromium,
  listenPort
}