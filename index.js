const { getURLs } = require('./listURLs');
const { downloadSingle } = require('./singleFile');

getURLs('PLtMGvj8XVUwYryZq62kXL8xdoqwHTa6Gr')
.then(urls => {
  urls.forEach(url => {
    console.log(`|${url.id}, ${url.index}|`);
    downloadSingle(url.id);
  });
});
