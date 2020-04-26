const url = require('url');
const chalk = require('chalk');
const express = require('express');
const cluster = require('cluster');
const puppeteer = require('puppeteer');

const { report } = require('./api/report');
const { crawler } = require('./flightCrawler');
const { chromiumArgs, maxNumChromium, listenPort, version } = require('./config/project.config');

const app = express();
const waitForCrawl = [];
const workerList = [];
let preLoads = 0;
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
        preLoads += 1
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

        if ((idleWokerIndex == -1) && (preLoads <= maxNumChromium)) {
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
    console.log(chalk.bold(chalk.bgBlue(`> ZionCrawler Ver ${version}  `)))
    app.listen(listenPort)
    console.log(chalk.bold(chalk.blue(`  > Started HTTP Server on ${listenPort} \n  > Process id: ${process.pid}`)))

  } else {
    console.log(chalk.green(chalk.bold(`    > Subprocess id: ${process.pid}`)))
    try {
      process.on("message", async (msg) => {
        if (msg.type == "startTask") {
          let browser = await puppeteer.connect({
            browserWSEndpoint: process.env.WS
          });
          let res = await crawler(browser, msg.data, auth=process.env.AUTH ? process.env.AUTH.split(':') : null);
          if (res.status) {
            console.log(chalk.green(`From ${res.params[0]} to ${res.params[1]} on ${res.params[2]} is: `), chalk.blueBright("有票"));
            let reportRes = await report(res.params[0], res.params[1], res.params[2], 1);
            console.log(reportRes.data);
          } else if(Object.keys(res).includes("error")) {
            console.log(chalk.green(`From ${res.params[0]} to ${res.params[1]} on ${res.params[2]} is: `), chalk.red(`${res.error}`));
          } else {
            console.log(chalk.green(`From ${res.params[0]} to ${res.params[1]} on ${res.params[2]} is: `), chalk.redBright("没票"));
            let reportRes = await report(res.params[0], res.params[1], res.params[2], 0);
            console.log(reportRes.data);
          }
          process.send({
            type: "getTask"
          });
        }
      })
    } catch (err) {
      console.log(chalk.bold(chalk.red(`[子进程错误]: ${err + ""}`)))
    }
  }
})();
