const fs= require('fs');
const puppeteer= require('puppeteer');

class Resumer {
  constructor() {}

  /**
  * Write JSON object to specified target file
  * @param {String} jsonObj
  * @param {String} targetFile
  */
  async saveToJSONFile(jsonObj, targetFile) {

    if( !/^\//.test(targetFile) )
      targetFile = targetFile;

    if(!/\.json$/.test(targetFile))
      targetFile+= ".json";

    return new Promise((resolve, reject) => {

    try {
      var data = JSON.stringify(jsonObj);
      console.log("Saving object '%s' to JSON file: %s", JSON.stringify(jsonObj, null, 2), targetFile);
    }
    catch (err) {
      console.log("Could not convert object to JSON string ! " + err);
      reject(err);
    }

     // Try saving the file.
    fs.writeFile(targetFile, data, (err, text) => {
      if(err)
        reject(err);
      else {
        resolve(targetFile);
      }
    });

   });
  }

  /**
   * Retrieve a websocket url and resume existing session
   * @param {string} file
   */
   async resumeSessionFromFile(file) {

    var setSession = (wsEndpointObj) => {
        console.log("Connecting to websocket endpoint: ", wsEndpointObj.endpoint );
        return puppeteer.connect({browserWSEndpoint: wsEndpointObj.endpoint});
    };

    return this.getFileContents(file).then(setSession).then((browser)=>{
      console.log("Successfully connected to previous session, using websocket URL from file '"+file+"' !");
      return browser;
    });
   }

  /**
   * Retrieve a file contents, as a text string or a JSON object if the string is JSON formatted
   * @param {string} file
   */
   async getFileContents(filename) {
     return new Promise((resolve, reject) => {
       fs.readFile(filename, (err, data) => {
          if (err)
            reject(err);
          else {
            console.log("Getting contents from file: %s", filename );
            var jsondata = false;
            try {
              jsondata = JSON.parse(data);
            }
            catch(err) {
              console.log("Data is not in JSON format");
            }
            if(Object(jsondata)===jsondata) {
              console.log("Data is: " + JSON.stringify(jsondata, null, 2));
              resolve(jsondata);
            } else {
              console.log("Data is: " + data);
              // Data passed is a buffer, not a string (when not specifying the encoding)
              resolve(data.toString());
            }
           }
       });
     });
   }
}


module.exports = Resumer;