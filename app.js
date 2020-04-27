const url = require('url');
const chalk = require('chalk');
const express = require('express');
const cluster = require('cluster');
const puppeteer = require('puppeteer');
const { report } = require('./api/report');
const { crawler } = require('./flightCrawler');
const { sleep } = require("./utils")
const { 
  chromiumArgs, 
  maxNumChromium, 
  listenPort, 
  version, 
  delay 
} = require('./config/project.config');


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

function messageHandler(worker, data) {
      
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
}

(async()=>{
  if (cluster.isMaster) {

    cluster.on('exit', (worker) => {
      worker.removeAllListeners();
      workerList.shift();
      preLoads = workerList.length;
      console.log(chalk.gray(`    > Subprocess id ${chalk.bold(worker.process.pid)} worker died `));
    });

    cluster.on("message", messageHandler)

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

        waitForCrawl.push(targetList);

        let idleWokerIndex = haveIdles(workerList);

        if ((idleWokerIndex == -1) && (preLoads <= maxNumChromium)) {
          if (httpUrl) {
            chromiumArgs.args.push(`--proxy-server=${httpUrl}`)
            console.log(chalk.bgGreen(chalk.bold(`    > Start proxy: ${httpUrl}`)))
          } 
          await sleep
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
    chromiumArgs['browserWSEndpoint'] = process.env.WS;
    console.log(chalk.green(chalk.bold(`    > Subprocess id: ${process.pid}`)))
    try {
      process.on("message", async (msg) => {
        if (msg.type == "startTask") {
          let browser = await puppeteer.connect(chromiumArgs);
          await sleep(delay);

          let res = await crawler(browser, msg.data, auth=(process.env.AUTH != 'null') ? process.env.AUTH.split(':') : null);

          if (res.status) {
            console.log(chalk.green(`        - From ${res.params[0]} to ${res.params[1]} on ${res.params[2]} is: ${chalk.bold(chalk.bgGreen(chalk.white(" 有票 ")))}`));
            let reportRes = await report(res.params[0], res.params[1], res.params[2], 1);
            console.log(reportRes.data);
          } else if(Object.keys(res).includes("error")) {
            console.log(chalk.bgGreen(`        - From ${res.params[0]} to ${res.params[1]} on ${res.params[2]} is: `), chalk.red(`${res.error}`));
          } else {
            console.log(chalk.green(`        - From ${res.params[0]} to ${res.params[1]} on ${res.params[2]} is: ${chalk.bold(chalk.bgRedBright(chalk.white(" 没票 ")))}`), );
            let reportRes = await report(res.params[0], res.params[1], res.params[2], 0);
            console.log(reportRes.data);
          }


          if (process.memoryUsage().rss < 62914560) {
            // 这一段忘了写有可能造成内存泄漏
            await browser.disconnect()
            process.send({
              type: "getTask"
            });
          } else {
            await browser.close()
            process.removeAllListeners()
            process.exit()
          }
        }
      })
    } catch (err) {
      console.log(chalk.bold(chalk.red(`[子进程错误]: ${err + ""}`)))
      process.exit()
    }
  }
})();
