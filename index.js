const fs = require('fs');
const https = require('https');

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
  https.get(getDownloadURL(data, dataLen), async res => {
    if (getError(res.statusCode, 'Cannot download file')) return;
    const fileName = await getFileName(data, dataLen);
    fs.closeSync(fs.openSync(`${fileName}.mp3`, 'w'));
    let mp3File = fs.createWriteStream(`${fileName}.mp3`);
    res.pipe(mp3File);      
  });
}

//download 1 file
const url = 'eAauqaT5XZ8'; //process.argv[2];
https.get(`https://www.320youtube.com/v6/watch?v=${url}`, res => {
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