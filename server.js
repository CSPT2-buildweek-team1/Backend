const express = require('express');
const knex = require('knex');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const dbConfig = require('./knexfile');
const server = express();
const db = knex(dbConfig.production);
const PORT = process.env.PORT || 5000;
const axios = require('axios');
const helmet = require('helmet')
const request = require('request')
const Stack = require('./stack.js')

server.use(express.json());
server.use(helmet());
server.use(cors());
server.use(bodyParser.urlencoded({
	extended: false
}));
const headers = {
	'Authorization': `Token ${process.env.TOKEN}`
};

const options = {
	url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/init/',
	headers: headers
};

server.listen(PORT, function () {
	console.log(`\n=== Web API Listening on httpL//localhost:${PORT} ===\n`)
})

server.get('/', (req, res) => {
	db('room')
		.then(data => {
			res.status(200).json({
				graph: data.map(item => {
					return {
						room_id: item.room_id,
						title: item.title,
						description: item.description,
						coordinates: item.coordinates,
						elevation: item.elevation,
						terrain: item.terrain,
						players: item.players,
						items: item.items,
						exits: JSON.parse(item.exits),
					}
				}).sort((elem1, elem2) => {
					return elem1.room_id > elem2.room_id
				})
			})
		})
})

const graph = new Array(500)
let timer = 1;
let cooldown = 1000;
let nextDir = '';
let prevMove = '';
let counter = 0;
let currentRoom = null
let prevRoom = null
let stack = [];
let moveForward = true;
let moveBackward = ''
let prediction = ''
let searchStack = []

const findNextDir = (exits) => {
	const keys = Object.keys(exits)
	for (i = 0; i < keys.length; i++) {
		if (exits[keys[i]] === "?") {
			moveForward = true
			return keys[i]
		}
	}
	moveForward = false;
	const dir = stack.pop()
	return dir
}

const cb = (error, response, body) => {
	console.log("body", body)


	if (!body.errors && body) {
		let data = JSON.parse(body)
		currentRoom = data.room_id
		counter++
		timer = 1
		if (graph[currentRoom] === undefined) {
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
			if (data.exits) {
				data.exits.forEach(exit => {
					graph[currentRoom].exits[exit] = '?'
				})
			}
		}
		if (prevMove !== '') {
			if (prevMove === 'n') {
				graph[prevRoom].exits.n = currentRoom
				graph[currentRoom].exits.s = prevRoom
				moveBackward = 's'
			} else if (prevMove === 's') {
				graph[prevRoom].exits.s = currentRoom
				graph[currentRoom].exits.n = prevRoom
				moveBackward = 'n'
			} else if (prevMove === 'e') {
				graph[prevRoom].exits.e = currentRoom
				graph[currentRoom].exits.w = prevRoom
				moveBackward = 'w'
			} else {
				graph[prevRoom].exits.w = currentRoom
				graph[currentRoom].exits.e = prevRoom
				moveBackward = 'e'
			}
		}
		console.log(data.exits)

		cooldown = data.cooldown * 1000 + 1000
		if (moveForward === true && moveBackward !== '') {
			stack.push(moveBackward)
		}
		console.log("stack", stack)
		nextDir = findNextDir(graph[currentRoom].exits);
		console.log("nextDir", nextDir)
		prevMove = nextDir
		prevRoom = currentRoom
		counter++
		timer = 1
		if (graph[currentRoom].exits[nextDir] !== "?") {
			prediction = graph[currentRoom].exits[nextDir]
		} else {
			prediction = ""
		}
		console.log("graph length: ", graph.filter(i => {
			return i
		}).length)
		db('room')
			.where({
				room_id: graph[currentRoom].room_id
			})
			.then(data => {
				if (data.length === 0) {
					db('room')
						.insert(graph[currentRoom])
						.then(res => {
							timeout(cooldown)
						})
				} else {
					db('room')
						.where({
							room_id: graph[currentRoom].room_id
						})
						.update(graph[currentRoom])
						.then(res => {
							timeout(cooldown)
						})
				}
			})

	} else {
		nextDir = findNextDir(graph[currentRoom].exits);
		cooldown = 21000
		timeout(cooldown)
	}
}


const init = () => {
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/init/',
		headers: headers
	}, cb)
}

const move = (dir) => {
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/move/',
		headers: headers,
		method: 'POST',
		body: `{"direction":"${dir}"}`
	}, cb)
}

const predictMove = (dir, predict) => {
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/move/',
		headers: headers,
		method: 'POST',
		body: `{"direction":"${dir}", "next_room_id": "${predict}"}`
	}, cb)
}

const timeout = (coolDown) => {
	if (graph.filter(i => {
			return i
		}).length < 500) {
		return setTimeout(function () {
			if (counter === 0) {
				init()
			} else if (prediction) {
				console.log("predictMove")
				predictMove(nextDir, prediction)
			} else {
				move(nextDir)
			}
		}, coolDown)
	} else {
		return null
	}


}
// const dfs = (startRoom, visited = [])  =>  {
//     console.log(visited)
//     const room = graph[startRoom]
//     const keys = Object.keys(room.exits)
//     const directions = []
//     for(let i = 0; i < keys.length; i++)    {
//         if(room.exits[keys[i]] === "?")  {
//             return [keys[i]]
//         }
//     }
//     for(let i = 0; i < keys.length; i++)    {
//         if(visited.includes(room.exits[keys[i]]) === false) {
//             let attempt = dfs(room.exits[keys[i]], visited.concat(startRoom))
//             if(attempt) {
//                 return [keys[i]].concat(attempt)
//             }
//         }
//     }
//     return false
// }

db('room')
	.then(data => {
		let arr = data.map(item => {
			return {
				title: item.title,
				description: item.description,
				coordinates: item.coordinates,
				elevation: item.elevation,
				terrain: item.terrain,
				players: item.players,
				items: item.items,
				exits: JSON.parse(item.exits),
				room_id: item.room_id
			}
		})
		arr = arr.sort((elem1, elem2) => {
			return elem1.room_id > elem2.room_id
		})
		for (i = 0; i < arr.length; i++) {
			graph[arr[i].room_id] = arr[i]
		}
		console.log("Graph length: ", graph.filter(i => {
			return i
		}).length)
		timeout(cooldown)
	})


setInterval(function () {
	console.log(timer)
	timer++
}, 1000)
