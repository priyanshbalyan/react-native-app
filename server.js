/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const { URL } = require('url');

function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (error) {
    return false;
  }
}

function unpick(object, keys) {
    const newObject = {};
    for (let [key, value] of Object.entries(object)) {
        if (keys.includes(key)) continue;
        newObject[key] = value;
    }
    return newObject;
}

app.use(express.json());

app.all('/api/:rest*', async (req, res) => {
  const url = req.params.rest + (req.params[0] || '');
  if(!isValidUrl(url)) return res.status(500).send('Invalid url');

  const headers = unpick(req.headers, ['user-agent', 'host', 'accept-encoding', 'connection']);
  const requestOptions = {
    method: req.method,
    body: Object.keys(req.body) > 0 ? JSON.stringify(req.body) : undefined,
    headers: headers 
  };

  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) return res.status(response.status).send(response.error);
    
    const contentType = response.headers.get('content-type');

    if (contentType.includes('application/json')) {
        const jsonData = await response.json();
        res.status(response.status).json(jsonData);
        return;
    }
    res.writeHead(200, { 
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="downloaded-file.bin'
    });
    
    for await (const data of response.body) {
      res.write(data);
    }

    res.status(response.status).end();
  } catch(error) {
    console.log('ERROR OCCURED:', error.message);
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
