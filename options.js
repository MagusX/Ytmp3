const fs = require('fs');
const settingsPath = './settings.json';
const settings = require(settingsPath);

module.exports = {
  changeDestination: destination => {
    if (fs.existsSync(destination)) {
      settings['download-path'] = destination;
      fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), err => {
        if (err) console.error(err);
        else console.log(`Download folder: ${destination}`);
      });
    } else console.log('Folder doesn\'t exist');
  },

  openDownloads: () => {
    console.log(settings['download-path']);
    require('child_process').exec(`start ${settings['download-path']}`);
  } 
}