const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const port = process.env.PORT || 8080;

///TODO: read params from path
///TODO: implement retry
///TODO: implement request throttling via queue

/*
POST /batch
[{
  verb: "PUT",
  url: "url123",
  payload: updateModel
}]
Response
[{url: "url123", status: 200}]
*/

const readRequestConfigs = (request) => {
    return request.body.map((item) => {
        return {
            method: item.verb,
            url: item.url,
            data: item.payload,
        }
    });
};

app.use(bodyParser.json());
app.get('/', (req, res) => res.send('It works'));

app.post('/batch', async (req, res) => {
    const requestConfigs = readRequestConfigs(req);
    const requests = requestConfigs.map(axios);

    const invocationResults = await Promise.all(requests.map(p => p.catch((e)=> e)));

    const response = invocationResults.map((invocationResult) => {
        const url = invocationResult.config.url;
        return {
            url,
            status: invocationResult instanceof Error ? invocationResult.response.status : invocationResult.status
        };
    });

    res.status(200);
    return res.json(response);
});

app.listen(port, function () {
    console.log("Running on port " + port);
});
