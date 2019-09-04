const express = require('express');
const knex = require('knex');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const dbConfig = require('./knexfile');
const server = express();
const db = knex(dbConfig.development);
const PORT = process.env.PORT || 5000;
const axios = require('axios');
const helmet = require('helmet')
const request = require('request')

server.use(express.json());
server.use(helmet());
server.use(cors());
server.use(bodyParser.urlencoded({ extended: false}));
const headers = {
    'Authorization': `Token ${process.env.TOKEN}`
};

const options = {
    url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/init/',
    headers: headers
};

server.listen(PORT, function()  {
    console.log(`\n=== Web API Listening on httpL//localhost:${PORT} ===\n`)
})

server.get("/", (req, res)  =>  {
    request(options, (error, response, body) =>  {

        let data = JSON.parse(body)
        console.log(data.cooldown)
        res.status(200).json({ data: data })
    });
})
