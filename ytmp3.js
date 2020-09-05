const { getURLs } = require('./listURLs');
const { downloadEvent, downloadSingle } = require('./singleFile');
const logUpdate = require('log-update');


//algorithm:
/*
function(url, max):
  len = url.length
  tail = (len < max) ? len : max
  for i -> tail {
    download(url[i])
  }

  while tail != len {
    if (download.emit('done'))
      download(url[tail++])
  }
*/

const throttleDownload = (urls, max=4, progressPool) => {
  const len = urls.length;
  let tail = (len <= max) ? len : max;

  downloadEvent.on('completed', () => {
    if (tail != len) {
      downloadSingle(urls[tail++].id, progressPool);
    }
  })

  for (let i = 0; i < tail; i++) {
    downloadSingle(urls[i].id, progressPool);
  }
}

const downloadList = (playlistId, progressPool, range) => {
  getURLs(playlistId, range)
  .then(urls => {
    const maxDownloads = 4;
    throttleDownload(urls, maxDownloads, progressPool);
  });
}


downloadEvent.on('downloading', (progressPool) => {
  let log = '';
  for(let [key, value] of progressPool) {
    let {current, total} = value;
    if (current - total == 0.01 || total - current == 0.01) {
      log += `${key} [${total}/${total}] 100%\n`;
    } else {
      log += `${key} [${current}/${total}] ${Math.floor((current / total) * 100)}%\n`;
    }
  }
  logUpdate(log);
});

(() => {
  // {id: filename, {total: , current: }}
  console.log('*Disclaimer: possible 1% data loss*');
  let progressPool = new Map();
  const args = process.argv;
  const argsLen = process.argv.length;
  switch (argsLen) {
    case 3:
      downloadSingle(args[2], progressPool);
      break;
    case 4: {
      if (args[2] === '--list') {
        downloadList(args[3], progressPool);
      }
      break;
    } case 6: {
      if (args[2] === '--list' && args[4] === '-r') {
        const [_start, _stop] = args[5].split(',');
        downloadList(args[3], progressPool, {start: _start, stop: _stop});
      } 
      break;
    }
    default:
      console.log('Invalid arguments');
      break;
  }
})();