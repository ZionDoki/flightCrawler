const url = require('url')
const chalk = require('chalk')
const express = require('express')
const cluster = require('cluster')
const puppeteer = require('puppeteer')
const { crawler } = require('./flightCrawler')

const { chromiumArgs, maxNumChromium, listenPort } = require('./config/project.config')

const app = express();
const waitForCrawl = [];
const workerList = [];
/**
 * Find idle worker in list
 * @param {Array} workerList
 * @returns {number} the index of idle worker in workerList 
 */
function haveIdles(workerList) {
  for (let index in workerList) {
    if (workerList[index].status == "idle") return index
  }
  return -1
}

(async()=>{
  if (cluster.isMaster) {

    // let waitForCrawl = new Proxy([], {
    //   set: async (preWoker, prop, value) => {
    //     console.log(prop, value)
    //   } 
    // });
    // 这里实现当 obj 清零的时候，且 wokers 中空闲状态不为空时，下达启动指令

    cluster.on("message", (worker, data) => {
      if (data.type == "getTask") {
        if (waitForCrawl.length != 0 ) {
          worker.send({
            type: "startTask",
            data: waitForCrawl.shift()
          })
        } else {
          // 如果没有任务了，就置为空闲
          for (let index in workerList) {
            if (workerList[index].worker == worker) {
              workerList[index].status = 'idle'
            }
          }
        }
      } 
    })

    app.get("/crawl", async (req, res) => {
      try {

        let { target, proxy } = req.query;
        let auth = null;
        let httpUrl = null;
        targetList = eval(target);
        if (!!proxy) {
          let urlObj = url.parse(proxy);
          auth = urlObj.auth;
          httpUrl = "http://" + urlObj.host;
        }

        if (!target) {
          throw("Incomplete params")
        } else {
          if(targetList.length != 3) throw("Error params")
        }

        waitForCrawl.push(targetList)

        let idleWokerIndex = haveIdles(workerList)

        if ((workerList.length < maxNumChromium) && (idleWokerIndex == -1)) {
          httpUrl ? chromiumArgs.args.push(`--proxy-server=${httpUrl}`) : '';
          const browser = await puppeteer.launch(chromiumArgs);
          let ws = await browser.wsEndpoint();
          browser.disconnect();
          let worker = cluster.fork({'WS': ws, 'AUTH': auth});
          workerList.push({
            worker,
            status: "busy"
          });
          worker.send({
            type: "startTask",
            data: waitForCrawl.shift()  // 创建伴随任务所以无论如何都可以出队
          });
          res.json({
            status: true,
            message: "Created success, task started!"
          })
        } else if (idleWokerIndex != -1) {
          workerList[idleWokerIndex].status = "busy"
          workerList[idleWokerIndex].worker.send({
            type: "startTask",
            data: waitForCrawl.shift()
          })
          res.json({
            status: true,
            message: "Task started!"
          })
        } else {
          res.json({
            status: true,
            message: "Task delivered, queuing.."
          })
        }
      } catch (err) {
        res.json({
          status: false,
          error: err + ""
        })
      }
    });
    
    app.listen(listenPort)
    console.log(chalk.green(`主进程运行在${process.pid}`))

  } else {
    console.log(chalk.green(`子进程运行在${process.pid}`))
    try {
      process.on("message", async (msg) => {
        if (msg.type == "startTask") {
          let browser = await puppeteer.connect({
            browserWSEndpoint: process.env.WS
          });
          let res = await crawler(browser, msg.data, auth=process.env.AUTH ? process.env.AUTH.split(':') : null);
  
          console.log(chalk.green(`From ${res.params[0]} to ${res.params[1]} on ${res.params[2]} is: `), res.status ? chalk.blueBright("有票") : chalk.red("没票"));
  
          process.send({
            type: "getTask"
          });
        }
      })
    } catch (err) {
      console.log(chalk.red(`[子进程错误]: ${err + ""}`))
    }


  }
})();