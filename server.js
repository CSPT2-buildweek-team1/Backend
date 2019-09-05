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

let cooldown = 16000;
let counter = 0;
let nextDir = '';
const cb = (error, response, body)   =>  {
    let data = JSON.parse(body)
    console.log("line 37: ",cooldown)
    nextDir = data.exits[0]
    counter++
}
const init = () =>  {
    request({
        url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/init/',
        headers: headers
    }, cb)
}

const move = (dir) =>  {
    request({
        url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/move/',
        headers: headers,
        method: 'POST',
        body: `{"direction":"${dir}"}`
    },  cb)
}

    const timeout = (coolDown)  =>  {
        return setTimeout(function()   {
            if(counter === 0)   {
                init()
                timeout(cooldown)
            }   else {
                move(nextDir)
                timeout(cooldown)
            }
        }, coolDown)

    }
timeout(cooldown)
