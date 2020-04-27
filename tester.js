const axios = require('axios');
const { proxy } = require('./config/project.config')

const examples = [
  ["PEK","PVG","2020-05-01"],
  ["LAX","PEK","2020-05-03"],
  ["LAX","PEK","2020-05-10"],
  ["LAX","PEK","2020-05-17"],
  ["LAX","PEK","2020-05-24"],
  ["LAX","PEK","2020-05-31"],
  ["LHR","PEK","2020-04-24"],
  ["LHR","PEK","2020-05-01"],
  ["LHR","PEK","2020-05-08"],
  ["LHR","PEK","2020-05-15"],
  ["LHR","PEK","2020-05-22"],
  ["LHR","PEK","2020-05-29"],
  ["YVR","PEK","2020-05-03"],
  ["YVR","PEK","2020-05-10"],
  ["YVR","PEK","2020-05-17"],
  ["YVR","PEK","2020-05-24"],
  ["FRA","CTU","2020-05-02"],
  ["FRA","CTU","2020-05-09"],
  ["FRA","CTU","2020-05-16"],
  ["FRA","CTU","2020-05-23"],
  ["ICN","PEK","2020-05-01"],
  ["ICN","PEK","2020-05-08"],
  ["ICN","PEK","2020-05-15"],
  ["ICN","PEK","2020-05-22"],
  ["ICN","PEK","2020-05-29"],
  ["CDG","PEK","2020-04-29"],
  ["CDG","PEK","2020-05-06"],
  ["CDG","PEK","2020-05-13"],
  ["CDG","PEK","2020-05-20"],
  ["CDG","PEK","2020-05-27"]
];

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