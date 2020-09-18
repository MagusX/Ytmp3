const fs = require('fs');
const cfgPath = './data/config.json';
const cfg = require(cfgPath);

module.exports = {
  changeDestination: destination => {
    if (fs.existsSync(destination)) {
      cfg['download-path'] = destination;
      fs.writeFile(cfgPath, JSON.stringify(cfg, null, 2), err => {
        if (err) console.error(err);
        else console.log(`Download folder: ${destination}`);
      });
    } else console.log('Folder doesn\'t exist');
  },

  openDownloads: () => {
    console.log(cfg['download-path']);
    require('child_process').exec(`start ${cfg['download-path']}`);
  } 
}