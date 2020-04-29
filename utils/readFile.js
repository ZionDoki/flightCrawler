const fs = require('fs');

module.exports = {
  readFile: function() {
    let data = fs.readFileSync('test.ini')
    let lines = String(data).split("\n")
    let result = lines.map(line => {
      return line.split(",").splice(1,3);
    })
    return result
  }
}
