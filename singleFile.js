const fs = require('fs');
const https = require('https');
const { EventEmitter } = require('events');
const dldata = require('./log/data.json');

const event = new EventEmitter();

const getDownloadURL = (data, len) => {
  const urlStartIndex = data.indexOf('btn btn-success btn-lg" href="') + 30;
  const urlEndIndex = urlStartIndex + data.substring(urlStartIndex, len).indexOf('"');
  return data.substring(urlStartIndex, urlEndIndex);
}

const parseValue = (field, offset, data, len) => {
  const startIndex = data.indexOf(field) + offset;
  const endIndex = startIndex + data.substring(startIndex, len).indexOf('</p>');
  return data.substring(startIndex, endIndex);
}

const getFileName = (data, len) => (
  parseValue('Title:', 11, data, len)
)

const getFileSize = (data, len) => (
  parseFloat(parseValue('Size:', 10, data, len))
)

const bytesToMB = bytes => (
  (bytes / 1048576).toFixed(2)
)

const getError = (status, err) => {
  if (status !== 200) {
    console.error(err);
    return true;
  }
  return false;
}

const downloadFile = (data, dataLen, progressPool) => {
  https.get(getDownloadURL(data, dataLen), async res => {
    if (getError(res.statusCode, 'Cannot download file')) return;
    const fileName = getFileName(data, dataLen);
    const path = `${dldata['download-path']}/${fileName.replace(/[:*?"<>|,\/\\]/g, '')}.mp3`;
    fs.closeSync(fs.openSync(path, 'w'));
    let mp3File = fs.createWriteStream(path);
    res.pipe(mp3File);
    
    let total = getFileSize(data, dataLen);
    let size = 0;
    res.on('data', async chunk => {
      size += chunk.length;
      await progressPool.set(fileName, {
        total: total,
        current: bytesToMB(size)
      });
      event.emit('downloading', progressPool);
    });
    res.on('end', () => {
      event.emit('completed');
    });
  });
}

//download 1 file
module.exports = {
  downloadEvent: event,
  downloadSingle: (id, progress) => {
    try {
      https.get(`https://www.320youtube.com/v6/watch?v=${id}`, res => {
        res.on('error', err => {
          console.log(`Error with 320youtube id: ${err}`);
        });
        if (getError(res.statusCode, 'Cannot GET 320youtube.com')) return;
      
        let data = '';
        res.setEncoding('utf-8');
        res.on('data', chunk => {
          data += chunk;
        });
      
        res.on('end', () => {
          const dataLen = data.length;
          downloadFile(data, dataLen, progress);
        });
      });
    } catch(err) {
      console.log(`Error with 320youtube id: ${err}`);
    }
  }
};
