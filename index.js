const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const port = process.env.PORT || 8080;

///TODO: read params from path
///TODO: fix retry implementation
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

    const retriesConfigs = invocationResults.filter(item => item instanceof Error).map(item => item.config);

    const retriesRequests = retriesConfigs.map(axios);
    const retryResults = await Promise.all(retriesRequests.map(p => p.catch((e)=> e)));

    const finalResults = retryResults.concat(invocationResults.filter(item => !(item instanceof Error)));

    const response = finalResults.map((invocationResult) => {
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
