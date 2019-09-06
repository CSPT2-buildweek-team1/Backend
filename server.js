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
const Stack = require('./stack.js')

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

const graph = new Array(500)
let timer = 1;
let cooldown = 16000;
let nextDir = '';
let prevMove = '';
counter = 0;
let currentRoom = null
let prevRoom = null
const cb = (error, response, body)   =>  {
    let data = JSON.parse(body)
    nextDir = data.exits[0]
    currentRoom = data.room_id
    if(graph[currentRoom] === undefined)    {
        graph[currentRoom] = {
            room_id: data.room_id,
            title: data.title,
            description: data.description,
            coordinates: data.coordinates,
            elevation: data.elevation,
            terrain: data.terrain,
            players: data.players,
            items: data.items,
            exits: {}
        }
        data.exits.forEach(exit =>  {
            graph[currentRoom].exits[exit] = '?'
        })
    }
    if(prevMove !== '') {
        if (prevMove === 'n')   {
            graph[prevRoom].exits.n = currentRoom
            graph[currentRoom].exits.s = prevRoom
        } else if (prevMove === 's') {
            graph[prevRoom].exits.s = currentRoom
            graph[currentRoom].exits.n = prevRoom
        } else if (prevMove === 'e'){
            graph[prevRoom].exits.e = currentRoom
            graph[currentRoom].exits.w = prevRoom
        }   else {
            graph[prevRoom].exits.w = currentRoom
            graph[currentRoom].exits.e = prevRoom
        }
    }
    prevMove = nextDir
    prevRoom = currentRoom
    console.log(graph)
    counter++
    timer = 0
    timeout(cooldown)
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

            }   else {
                move(nextDir)
            }
        }, coolDown)

    }
timeout(cooldown)
setInterval(function()  {
    console.log(timer)
    timer++
}, 1000)
