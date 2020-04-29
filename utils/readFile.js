const fs = require('fs');

module.exports = {
  readFile: function(path) {
    let data = fs.readFileSync(path)
    let lines = String(data).split("\n")
    let result = lines.map(line => {
      return line.split(",").splice(1,3);
    })
    return result
  }
}
