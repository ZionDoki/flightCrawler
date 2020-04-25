const fs= require('fs');
const Resumer= require('./resumer');
const puppeteer= require('puppeteer');
const { production } = require('./config/project.config');

const logger = fs.createWriteStream('log.txt', {
  flags: 'a', // 'a' means appending (old data will be preserved)
  cwd: __dirname
});
const resumer = new Resumer();

(async() => {
  const browser= await puppeteer.launch({
    headless: production,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });
  
  console.log('launched');
  let ws= await browser.wsEndpoint();
  logger.write('ws: '+ JSON.stringify(ws));
  logger.write(require('os').EOL);
  logger.end();

  // @Xavatar cp #1123
  await resumer.saveToJSONFile({endpoint: browser.wsEndpoint()}, "ws.json").then(file => {
    console.log("Websocket endpoint JSON has been succesfully saved to %s", file)
  });

  console.log('end');
})();