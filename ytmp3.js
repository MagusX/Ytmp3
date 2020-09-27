const https = require('https');
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

let len;
let tail;
let ver = 5;

const throttleDownload = (urls, max=4, progressPool) => {
  len = urls.length;
  tail = (len <= max) ? len : max;

  downloadEvent.on('completed', () => {
    if (tail != len) {
      downloadSingle(urls[tail++].id, progressPool, ver);
    }
  })

  for (let i = 1; i <= tail; i++) {
    downloadSingle(urls[i].id, progressPool, ver);
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
  logUpdate(log + `\nProgress: ${tail}/${len}`);
});

const helpCmd = () => {
  console.log(`node ytmp3 [args]\n
options:
${' ddir'.padEnd(20)}Show and open download directory
${' <video-id>'.padEnd(20)}Download video with ID

flags: [--list] <list-id> [[-r] <start>,<stop>]
${' --list'.padEnd(20)}Download playlist with ID
${' -r'.padEnd(20)}Range of downloads -r start,stop
  `);
}

const scanDownloader = () => {
  return new Promise((resolve, reject) => {
    https.get(`https://www.320youtube.com/v${ver}/watch?v=`, res => {
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode === 200) resolve(true);
        resolve(false);
      })
    });
  });
}

const verifyDownloader = () => {
  return new Promise(async (resolve, reject) => {
    while (true) {
      let res = await scanDownloader();
      if (!res) ver++;
      else {
        resolve(true);
        return;
      }
    }
  });
}

(() => {
  // {id: filename, {total: , current: }}
  let progressPool = new Map();
  const args = process.argv;
  const argsLen = process.argv.length;

  verifyDownloader()
  .then(res => {
    console.log(ver);
    switch (argsLen) {
      case 3:
        if (args[2] === 'ddir') {
          openDownloads();
        } else if (args[2] === 'help') {
          helpCmd();
        } else {
          downloadSingle(args[2], progressPool, ver);
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
  })
})();
