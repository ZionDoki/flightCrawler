const chalk = require('chalk');
const { targetSite, maxTries, chromiumArgs } = require('./config/project.config');

async function crawler (context, params, auth) {
  let 
    start = params[0],
    end = params[1],
    time = params[2];

  let tries = maxTries;
  let lastErr = null;

  let page = await context.newPage()
  await page.setRequestInterception(true)
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7'
  });

  page.on("dialog", async(dia) => {
    try {
      dia.dismiss()
    } catch(err) {
      console.log("" + err)
    }
  });

  page.on("request", (req) => {
    if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType == 'image') {
      req.abort()
    } else {
      req.continue();
    }
  });

  try {
    if (!!auth) {
      page.authenticate({
        username: auth[0],
        password: auth[1]
      })
    }
    await page.goto(targetSite)
    await page.type("#deptDateShowGo", time, {delay: 0})
    
    // 点击并输入出发城市
    await page.click("#\\30 ")
    await page.type("#\\30 ", start, {delay: 0})
    await page.$$eval("ul.cityslide>li", (eles, start) => {
      eles.map(item => {
        console.log(item)
        if (item.getAttribute("locationcd") == start) item.click()
      })
    }, start)
    await page.$$eval("body > div.citySelector", (eles) => {
      eles[0].style.display = "none"
    })
    // await page.waitFor(200000)
    // 点击并输入到达城市
    await page.click("#\\31 ")
    await page.type("#\\31 ", end, {delay: 0})
    await page.$$eval("ul.cityslide>li", (eles, end) => {
      eles.map(item => {
        console.log(item)
        if (item.getAttribute("locationcd") == end) item.click()
      })
    }, end)
    
    await page.$eval("#deptDateShowGo", (e) => {
      e.click()
    })
    let frames = await page.frames()
    for (let index in frames) {
      await frames[index].$eval("#dpOkInput", (e) => {
        e.click()
      }).catch(err => {
      })
    }
    await page.$eval("#portalBtn", (e) => {
      e.click()
    });
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.waitForSelector("#top_logo > a > img", { visible: true })
    ])
    let haveFlight;
    let nextButton = await page.$("#pgButtonNext");
    if (!!nextButton) {
      haveFlight = await page.$eval("#pgButtonNext", (e) => {
        if (e.style.display != "none") {
          return { status: true }
        } else {
          return { status: false }
        }
      });
      nextButton.dispose();
    } else {
      haveFlight = { status: false }
    }

    
    haveFlight['params'] = params;
    
    await page.close()
    return haveFlight
  } catch (err) {
    await page.close()
    return { status: false, params, error: (err + "").indexOf("#deptDateShowGo") != -1 ? "Error: Two many requst" : err + "" }
  }
  

}
module.exports = {
  crawler
}

