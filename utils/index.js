module.exports = {
  sleep: function(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve ? resolve() : ''
      }, ms);
    })
  }
}