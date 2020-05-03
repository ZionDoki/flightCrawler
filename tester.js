const axios = require('axios');
const { readFile } = require("./utils/readFile");
const { proxy, production } = require('./config/project.config');

let examples = readFile(production ? "/root/ticketmonitor/airchina_slave/airlines.ini" : "./test.ini")

/**
 * 
 * @param {string} path 
 * @param {Array} params 
 */
function tester(path, params) { 
  params.forEach(item => {
    axios.get(path, {
      params: {
        target: item
      }
    }).then(res => {
      console.log(res.data)
    })
  })
}

function intervalTest(path, interval) {
  let index = 0;
  setInterval(() => {
    if (index > (examples.length - 1)) {
      console.log("读取目标文件..");
      examples = readFile(production ? "/root/ticketmonitor/airchina_slave/airlines.ini" : "./test.ini");
      index = 0
    }

    if(examples[index].length != 0 ) {
      axios.get(path, {
        params: {
          target: examples[index],
          proxy,
        }
      }).then(res => {
        console.log(res.data)
      })
    }


    index += 1
  }, interval)
}

intervalTest("http://localhost:3000/crawl", interval = 2000)

