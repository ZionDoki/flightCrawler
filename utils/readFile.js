const fs = require('fs');

module.exports = {
  readFile: function(path) {
    let data = fs.readFileSync(path)
    let lines = String(data).split("\r\n")
    let result = lines.map(line => {
      return line.replace(/\r?\n|\r/g, "").split(",").splice(1,3);
    })
    return result
  }
}
