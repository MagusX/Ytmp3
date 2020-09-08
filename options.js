const fs = require('fs');
const dataPath = './log/data.json';
const dlData = require(dataPath);

module.exports = {
  changeDestination: destination => {
    if (fs.existsSync(destination)) {
      dlData['download-path'] = destination;
      fs.writeFile(dataPath, JSON.stringify(dlData, null, 2), err => {
        if (err) console.error(err);
        else console.log(`Download folder: ${destination}`);
      });
    } else console.log('Folder doesn\'t exist');
  },

  openDownloads: () => {
    console.log(dlData['download-path']);
    require('child_process').exec(`start ${dlData['download-path']}`);
  } 
}