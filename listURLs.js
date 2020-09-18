const https = require('https');
const cfg = require('./data/config.json');

const verifyRange = (totalResults, range) => {
  let { start, stop } = (typeof(range) === 'object') ? range : {start: 0, stop: totalResults};
  start = (start === '') ? 0 : parseInt(start, 10);
  stop = (stop === '') ? totalResults : parseInt(stop, 10);
  return [start, stop];
}

const parseURLs = (apiRes, URLs, range) => {
  return new Promise((resolve, reject) => {
    try {
      const { items, pageInfo } = apiRes;
      const [start, stop] = verifyRange(pageInfo.totalResults, range);
      items.forEach(video => {
        const { title, position, resourceId } = video.snippet;
        if (title !== 'Private video' && position >= start && position <= stop) {
          URLs.push({
            id:resourceId.videoId,
            index: position
          });
        }
      });
      resolve('Valid');
    } catch(err) {
      reject(err);
    }
  });
}

const getPageToken = apiRes => {
  return (typeof(apiRes) !== 'undefined' && apiRes.hasOwnProperty('nextPageToken')) ? apiRes.nextPageToken : '';
}

const getAPIRes = async (playlistId, prevApiRes, api_key, URLs, range) => {
  return new Promise((resolve, reject) => {
    https.get(`${cfg['youtube-api-url']}/playlistItems?part=snippet&playlistId=${playlistId}&key=${api_key}&maxResults=50&pageToken=${getPageToken(prevApiRes)}`, res => {
      res.on('error', err => {
        console.log(`Error with googleapis url: ${err}`);
      });
      res.setEncoding('utf-8');
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', async () => {
        apiRes = await JSON.parse(data);
        parseURLs(apiRes, URLs, range)
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
    const api_key = cfg['youtube-api-key'];
    while (true) {
      apiRes = await getAPIRes(playlistId, apiRes, api_key, URLs, range);
      if (!apiRes.hasOwnProperty('nextPageToken')) {
        return URLs;
      }
    }
  }
}

//token = apiRes.nextPageToken
//index = items[i].snippet.position
//id = items[i].snippet.resourceId.videoId