const axios = require('axios');
const { readFile } = require("./utils/readFile");
const { proxy, production } = require('./config/project.config');

const examples = readFile(production ? "/root/ticketmonitor/airchina_slave/airlines.ini" : "./test.ini")

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

function intervalTest(path, params, interval) {
  let index = 0;
  setInterval(() => {
    if (index > (params.length - 1)) {
      index = 0
    }

    axios.get(path, {
      params: {
        target: params[index],
        proxy,
      }
    }).then(res => {
      console.log(res.data)
    })

    index += 1
  }, interval)
}

intervalTest("http://localhost:3000/crawl", examples, interval = 1000)
98.8
