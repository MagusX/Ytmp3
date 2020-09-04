const fs = require('fs');
const https = require('https');
const { EventEmitter } = require('events');

const event = new EventEmitter();

const getDownloadURL = (data, len) => {
  const urlStartIndex = data.indexOf('btn btn-success btn-lg" href="') + 30;
  const urlEndIndex = urlStartIndex + data.substring(urlStartIndex, len).indexOf('"');
  return data.substring(urlStartIndex, urlEndIndex);
}

const getFileName = (data, len) => {
  const nameStartIndex = data.indexOf('Title:') + 11;
  const nameEndIndex = nameStartIndex + data.substring(nameStartIndex, len).indexOf('</p>');
  return data.substring(nameStartIndex, nameEndIndex);
}

const getError = (status, err) => {
  if (status !== 200) {
    console.error(err);
    return true;
  }
  return false;
}

const downloadFile = (data, dataLen) => {
  https.get(getDownloadURL(data, dataLen), res => {
    if (getError(res.statusCode, 'Cannot download file')) return;
    const fileName = getFileName(data, dataLen);
    const path = `test/${fileName.replace(/[:*?"<>|,\/\\]/g, '')}.mp3`;
    fs.closeSync(fs.openSync(path, 'w'));
    let mp3File = fs.createWriteStream(path);
    res.pipe(mp3File);
    
    let size = 0;
    res.on('data', chunk => {
      size += chunk.length;
    });
    res.on('end', () => {
      console.log(`${fileName} COMPLETED. SIZE: ${size} BYTES`);
      event.emit('completed');
    });
  });
}

//download 1 file
module.exports = {
  downloadEvent: event,
  downloadSingle: id => {
    console.log(id);
    https.get(`https://www.320youtube.com/v6/watch?v=${id}`, res => {
      if (getError(res.statusCode, 'Cannot GET 320youtube.com')) return;
    
      let data = '';
      res.setEncoding('utf-8');
      res.on('data', chunk => {
        data += chunk;
      });
    
      res.on('end', () => {
        const dataLen = data.length;
        downloadFile(data, dataLen);
      });
    });
  }
};
