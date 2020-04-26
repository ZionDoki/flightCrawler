const axios = require('axios');
const { reportUrl } = require('../config/project.config')

/**
 * report result
 * @param {string} src 
 * @param {string} dst 
 * @param {string} date 
 * @param {number} result 
 */
function report(src, dst, date, result) {
  return axios.get(reportUrl, {
    params: {
      src,
      dst,
      date,
      result
    }
  })
}

module.exports = {
  report
}
