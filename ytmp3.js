const { getURLs } = require('./listURLs');
const { downloadEvent, downloadSingle } = require('./singleFile');
const logUpdate = require('log-update');
const { changeDestination, openDownloads } = require('./options');

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
    const maxDownloads = 3;
    throttleDownload(urls, maxDownloads, progressPool);
  });
}

downloadEvent.on('downloading', (progressPool) => {
  let log = '';
  for(let [key, value] of progressPool) {
    let {current, total} = value;
    log += `${key} [${current}/${total}] ${Math.floor((current / total) * 100)}%\n`;
  }
  logUpdate(log);
});

const helpCmd = () => {
  console.log(`node ytmp3 [args]\n
options:
${' ddir'.padEnd(20)}Show and open download directory
${' <video-id>'.padEnd(20)}Download video with ID

flags: [--list] <arg> [[-r] <arg>,<arg>]
${' --list'.padEnd(20)}Download playlist with ID
${' -r'.padEnd(20)}Range of downloads -r start,stop
  `);
}

(() => {
  // {id: filename, {total: , current: }}
  let progressPool = new Map();
  const args = process.argv;
  const argsLen = process.argv.length;
  switch (argsLen) {
    case 3:
      if (args[2] === 'ddir') {
        openDownloads();
      } else if (args[2] === 'help') {
        helpCmd();
      } else {
        downloadSingle(args[2], progressPool);
      }
      break;
    case 4: {
      if (args[2] === '--list') {
        downloadList(args[3], progressPool);
      } else if (args[2] === '--cdir') {
        changeDestination(args[3]);
      }
      break;
    } case 6: {
      console.log('*Disclaimer: possible 1% data loss*');
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
