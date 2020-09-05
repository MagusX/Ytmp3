const https = require('https');

const verifyRange = (items, range) => {
  let { start, stop } = (typeof(range) === 'object') ? range : {start: 0, stop: items.length};
  start = (start === '') ? 0 : parseInt(start, 10);
  stop = (stop === '') ? items.length : parseInt(stop, 10);
  return [start, stop];
}

const parseURLs = (items, URLs, range) => {
  const [start, stop] = verifyRange(items, range);
  items.forEach(video => {
    const { title, position, resourceId } = video.snippet;
    if (title !== 'Private video' && position >= start && position <= stop) {
      URLs.push({
        id:resourceId.videoId,
        index: position
      });
    }
  });

  return new Promise((resolve, reject) => {
    if (URLs.length !== 0) {
      resolve('Valid');
    }
    reject(new Error('Invalid'));
  });
}

const getPageToken = apiRes => {
  return (typeof(apiRes) !== 'undefined' && apiRes.hasOwnProperty('nextPageToken')) ? apiRes.nextPageToken : '';
}

const getAPIRes = async (playlistId, prevApiRes, api_key, URLs, range) => {
  return new Promise((resolve, reject) => {
    https.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${api_key}&maxResults=50&pageToken=${getPageToken(prevApiRes)}`, res => {
      res.setEncoding('utf-8');
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', async () => {
        apiRes = await JSON.parse(data);
        parseURLs(apiRes.items, URLs, range)
        .then(msg => {
          resolve(apiRes);
        })
        .catch(err => {
          reject(err);
        });
      });
    });
  });
}

module.exports = {
  getURLs: async (playlistId, range) => {
    let URLs = [];
    let apiRes;
    const api_key = 'AIzaSyCPuak_xz0_qEyST0yj9T0DIFkUtBhfCuo';
    while (true) {
      apiRes = await getAPIRes(playlistId, apiRes, api_key, URLs, range);
      if (!apiRes.hasOwnProperty('nextPageToken')) return URLs;
    }
  }
}

//token = apiRes.nextPageToken
//index = items[i].snippet.position
//id = items[i].snippet.resourceId.videoId