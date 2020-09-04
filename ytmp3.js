const { getURLs } = require('./listURLs');
const { downloadEvent, downloadSingle } = require('./singleFile');

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

const throttleDownload = (urls, max=4) => {
  const len = urls.length;
  let tail = (len <= max) ? len : max;

  downloadEvent.on('completed', () => {
    if (tail != len) {
      downloadSingle(urls[tail++].id);
    }
  })

  for (let i = 0; i < tail; i++) {
    downloadSingle(urls[i].id);
  }
}

const downloadList = playlistId => {
  getURLs(playlistId)
  .then(urls => {
    const maxDownloads = 4;
    throttleDownload(urls, maxDownloads);
  });
}

(() => {
  const args = process.argv;
  const argsLen = process.argv.length;
  switch (argsLen) {
    case 3:
      downloadSingle(args[2])
      break;
    case 4: {
      if (args[2] === '--list')
      downloadList(args[3]);
      break;
    }
    default:
      console.log('Invalid arguments');
      break;
  }
})();