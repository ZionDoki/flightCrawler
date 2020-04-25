const program = require('commander');
const puppeteer = require('puppeteer');
const { targetSite, production, maxTries } = require('./config/project.config');

async function crawler (context, params, maxTries=3, auth, index) {

  let 
    start = params[0],
    end = params[1],
    time = params[2];

  let page = await context.newPage()
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7'
  });

  page.on("dialog", async(dia) => {
    try {
      dia.dismiss()
    } catch(err) {
      console.log("" + err)
    }
  })

  while(maxTries >= 0) {
    try {
      if (!!auth) {
        page.authenticate({
          username: auth.username,
          password: auth.password
        })
      }

      await page.goto(targetSite)
      
      
      await page.waitFor(index * 500)


      // 
      await page.type("#deptDateShowGo", time, {delay: 0})
      
      // 点击并输入出发城市
      await page.click("#\\30 ")
      await page.type("#\\30 ", start, {delay: 0})
      await page.$eval("ul.cityslide>li", (ele) => {
        ele.click()
      })
      // 点击并输入到达城市
      await page.click("#\\31 ")
      await page.type("#\\31 ", end, {delay: 0})
      await page.$$eval("ul.cityslide>li", (eles) => {
        eles[1].click()
      })

      await page.$eval("#deptDateShowGo", (e) => {
        e.click()
      })

      let frames = await page.frames()

      for (let index in frames) {
        await frames[index].$eval("#dpOkInput", (e) => {
          e.click()
        }).catch(err => {
          console.log("Next frame")
        })
      }

      await page.$eval("#portalBtn", (e) => {
        e.click()
      });
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }).then(() => {
          page.screenshot('./test.png')
        }),
        page.waitForSelector("#top_logo > a > img", { visible: true })
      ])

      await page.screenshot({
        path: `./${index}_test.png`
      })

      let haveFlight = await page.$eval("#pgButtonNext", (e) => {
        if (e) {
          if (e.style.display != "none") {
            return { status: true }
          } else {
            let res = document.querySelector("body > h2");
            if (!!res) {
              return res.textContent == "错误" ? { status: false, error:"system reject" } : { status: false }
            } else {
              return { status: false }
            }
          }
        } else {
          return { status: false }
        }
      })

      if (!Object.keys(haveFlight).includes("error")) {
        haveFlight['params'] = params
      }
      console.log(haveFlight)
      maxTries = -1
    } catch (err) {
      if (maxTries >= 0) {
        maxTries = maxTries - 1
        console.log("RETRY!" + JSON.stringify(params) + err)
      } else {
        console.log({ status: false, error: "" + err })
      }
    }
    // await page.close()
  }
}

(async () => {

  const defaultParam = {
    targets: [
      ["PEK", "LAX", "2020-04-26"],
      ["PEK", "PVG", "2020-04-26"]
    ],
    proxy: {
      // url: "http://tps156.kdlapi.com:15818",
      // auth: {
      //   username: "t18738412661682",
      //   password: "123456"
      // } 
    }
  }

  program
  .version('0.2.0')
  .option('-t, --target [type]', 'Add target url [string]', JSON.stringify(defaultParam.targets))
  .option('-p, --proxy [type]', 'Add target url [string]', JSON.stringify(defaultParam.proxy))
  .parse(process.argv);

  // const []

  // let wsPromise= new Promise((res, rej)=> {
  //   fs.readFile(__dirname+ '/log.txt', 'utf-8', (err, fileContent)=> {
  //     let ws= '';
  //     if (err) throw err;
  //     const lines= fileContent.split('\n');
  //     let pointer= lines.length;
  //     while (ws === '' && pointer>-1) {
  //       pointer--;
  //       if (lines[pointer].indexOf('ws://')>0) {
  //         let 
  //           startSplit= lines[pointer].indexOf('"ws://'),
  //           endSplit= lines[pointer].lastIndexOf('"');

  //         endSplit++;
  //         ws= lines[pointer].substring(startSplit, endSplit);
  //         ws= JSON.parse(ws);
  //         res(ws);
  //       }
  //     }
  //     rej('no ws found in file');
  //   });
  // });

  // let existingWs = await wsPromise.then(savedWs=> {
  //   console.log('existingWs: ', savedWs);
  //   return savedWs;
  // });

  let targets = eval(program.target)
  let proxy = JSON.parse(program.proxy)

  const browser = await puppeteer.launch({
    // browserWSEndpoint: existingWs,
    args: [
      '--enable-resource-load-scheduler=false',
      proxy.url ? `--proxy-server=${proxy.url}` : '',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ],
    headless: production,
    slowMo: production ? 0 : 50
  });

  let context = await browser.createIncognitoBrowserContext();

  const promiseList = [];

  for (let index in targets) {
    promiseList.push(crawler(context, targets[index], maxTries, proxy.auth ? proxy.auth : null, index))
  }

  await Promise.all(promiseList)
  console.log("shutdown")
  browser.close()

})();
