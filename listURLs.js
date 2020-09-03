const https = require('https');

const parseURLs = (items, URLs) => {
  items.forEach(video => {
    if (video.snippet.title !== 'Private video') {
      URLs.push({
        id: video.snippet.resourceId.videoId,
        index: video.snippet.position
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

const getAPIRes = async (playlistId, prevApiRes, api_key, URLs) => {
  return new Promise((resolve, reject) => {
    https.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${api_key}&maxResults=50&pageToken=${getPageToken(prevApiRes)}`, res => {
      res.setEncoding('utf-8');
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', async () => {
        apiRes = await JSON.parse(data);
        parseURLs(apiRes.items, URLs)
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
  getURLs: async playlistId => {
    let URLs = [];
    let apiRes;
    const api_key = 'AIzaSyCPuak_xz0_qEyST0yj9T0DIFkUtBhfCuo';
    while (true) {
      apiRes = await getAPIRes(playlistId, apiRes, api_key, URLs);
      if (!apiRes.hasOwnProperty('nextPageToken')) return URLs;
    }
  }
}

//token = apiRes.nextPageToken
//index = items[i].snippet.position
//id = items[i].snippet.resourceId.videoId