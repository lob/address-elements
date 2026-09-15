const express = require('express');
var path = require('path');
var fs = require('fs');
const app = express();

app.use('/src', express.static('src'));

app.get('/', (req, res) => {
  // You can replace this file with any example html file
  const html = fs.readFileSync(path.join(__dirname, '/vanilla_css_styles.html'), 'utf8');
  if (!process.env.LOB_PUBLIC_KEY) {
    console.warn('LOB_PUBLIC_KEY is not set, serving the demo with its placeholder key. Set LOB_PUBLIC_KEY to your live_pub_* key to test against the real API.');
  }
  res.send(html.replace('live_pub_xxx', process.env.LOB_PUBLIC_KEY || 'live_pub_xxx'));
});

app.listen(8080, error => {
  if (error) {
    throw error;
  }
  console.log('Listening on port 8080!');
});
