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
const SHA256 = require('crypto-js/sha256')
const sha256 = require('js-sha256')

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

let currentRoom = null


server.get('/graph', (req, res) => {
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

server.get('/',	(req, res)	=>	{
	db('room')
		.then(data	=>	{
			console.log(data)
			res.status(200).json({data: data.sort((item1, item2)	=>	{
				return item1.room_id - item2.room_id
			})})
		})
})

server.get('/init',	(req,	res)	=>	{
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/init/',
		headers: headers
	}, (error, response, body)	=>	{
		const data = JSON.parse(body)
		currentRoom = data.room_id
		res.status(200).json({data: data, exits: graph[data.room_id].exits})
	})
})

server.post('/move',	(req, res)	=>	{
	console.log(req.body)
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/move/',
		headers: headers,
		method: 'POST',
		body: `{"direction":"${req.body.dir}", "next_room_id": "${req.body.predict}"}`
	}, (error, response, body)	=>	{
		const data = JSON.parse(body)
		currentRoom = data.room_id
		res.status(200).json({data: data, exits: graph[currentRoom].exits})
	})
})

server.post('/take',	(req, res)	=>	{
	console.log(req.body)
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/take/',
		headers: headers,
		method: 'POST',
		body: `{"name":"${req.body.item}"}`
	},	(error, response, body)	=>	{
		const data = JSON.parse(body)
		res.status(200).json({data: data, exits: graph[currentRoom].exits})
	})
})
server.post('/drop',	(req, res)	=>	{
	console.log(req.body)
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/drop/',
		headers: headers,
		method: 'POST',
		body: `{"name":"${req.body.item}"}`
	},	(error, response, body)	=>	{
		const data = JSON.parse(body)
		res.status(200).json({data: data, exits: graph[currentRoom].exits})
	})
})
server.post('/sell',	(req, res)	=>	{
	console.log(req.body)
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/sell/',
		headers: headers,
		method: 'POST',
		body: `{"name":"${req.body.item}"}`
	},	(error, response, body)	=>	{
		const data = JSON.parse(body)
		res.status(200).json({data: data, exits: graph[currentRoom].exits})
	})
})
server.post('/sell/confirm',	(req, res)	=>	{
	console.log(req.body)
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/sell/',
		headers: headers,
		method: 'POST',
		body: `{"name":"${req.body.item}", "confirm":"yes"}`
	},	(error, response, body)	=>	{
		const data = JSON.parse(body)
		res.status(200).json({data: data, exits: graph[currentRoom].exits})
	})
})
server.post('/status',	(req, res)	=>	{
	console.log(req.body)
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/status/',
		headers: headers,
		method: 'POST'
	},	(error, response, body)	=>	{
		const data = JSON.parse(body)
		res.status(200).json({data: data, exits: graph[currentRoom].exits})
	})
})
server.post('/changeName',	(req, res)	=>	{
	console.log(req.body)
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/change_name/',
		headers: headers,
		method: 'POST',
		body: `{"name": "${req.body.name}"}`
	},	(error, response, body)	=>	{
		console.log(error)
		console.log(body)
		res.status(200).json({data: body, exits: graph[currentRoom].exits})
	})
})

server.post('/changeName/confirm',	(req, res)	=>	{
	console.log(req.body)
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/adv/change_name/',
		headers: headers,
		method: 'POST',
		body: `{"name": "${req.body.name}", "confirm": "aye"}`
	},	(error, response, body)	=>	{
		console.log(error)
		console.log(body)
		res.status(200).json({data: body, exits: graph[currentRoom].exits})
	})
})

server.post('/mine',	(req, res)	=>	{
	request({
		url: 'https://lambda-treasure-hunt.herokuapp.com/api/bc/last_proof/',
		headers: headers,
	},	(error, response, body)	=>	{
		const data = JSON.parse(body)
		let hash = validProof(data.proof, data.difficulty)
		res.status(200).json({data: body, exits: graph[currentRoom].exits})
	})
})

const graph = new Array(500)
let timer = 1;
let cooldown = 1000;
let nextDir = '';
let prevMove = '';
let counter = 0;
let prevRoom = null
let stack = [];
let moveForward = true;
let moveBackward = ''
let prediction = ''
let searchStack = []

const validProof = (lastProof, difficulty)	=>	{
	let lead0 = []
	for(i = 0; i < difficulty; i++)	{
		lead0.push(0)
	}
	lead0 = lead0.join("")
	let proof = 0
	let thisHash = sha256(escape(lastProof, proof))
	while(thisHash.slice(0,difficulty) !== lead0)	{
		proof++
		thisHash = sha256(escape(lastProof, proof))
		console.log(thisHash)
		console.log(proof)
	}
	return thisHash
}

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
