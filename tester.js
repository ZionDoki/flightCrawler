const axios = require('axios');
const examples = [
  ["LAX","PEK","2020-04-26"],
  ["LAX","PEK","2020-05-03"],
  ["LHR","PEK","2020-05-01"],
  ["YVR","PEK","2020-04-26"],
  ["YVR","PEK","2020-05-03"],
  ["FRA","CTU","2020-04-25"],
  ["FRA","CTU","2020-05-02"],
  ["PEK","SHA","2020-05-02"]
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
        proxy: "http://0418fq50t1m:0418fq50t1m@150.109.147.131:800/"
      }
    }).then(res => {
      console.log(res.data)
    })

    index += 1
  }, interval)
} 



// tester("http://localhost:3000/crawl", [
//   ["LAX","PEK","2020-04-26"],
//   ["LAX","PEK","2020-05-03"],
//   ["LHR","PEK","2020-05-01"],
//   ["YVR","PEK","2020-04-26"],
//   ["YVR","PEK","2020-05-03"],
//   ["FRA","CTU","2020-04-25"],
//   ["FRA","CTU","2020-05-02"],
//   ["PEK","SHA","2020-05-02"]
// ])

intervalTest("http://localhost:3000/crawl", examples, interval = 1000)