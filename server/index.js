// Apparently we can't use ES6 imports so we got the old imports.
const express = require("express");
const socket = require("socket.io");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT;
const IP = process.env.IP;
const PROTOCOL = {
	TEST: "test",
	NEW_USER: "new_user",
	CREATE_ROOM: "create_room",
	CREATE_SUCCESSFUL: "create_successful",
	JOIN_ROOM: "join_room",
	JOIN_SUCCESSFUL: "join_successful",
	INVALID_ROOMCODE: "invalid_roomcode",
    INVALID_PASSWORD: "invalid_password",
	USER_JOINED: "user_joined",
	USER_LEFT: "user_left",
	PAUSE_PLAYER: "pause_player",
	PLAY_PLAYER: "play_player",
	SET_PLAYING: "set_playing",
};

let rooms = {};

// App setup
let app = express();

let server = app.listen(PORT, IP, function () {
	console.log("Listening on " + IP + ":" + PORT);
});

// Socket setup
let io = socket(server);

io.on("connection", function (client) {
	console.log("Client[" + client.id + "] connected");
	let roomCode;
	let code;
	client.on(PROTOCOL.CREATE_ROOM, ({userName, roomPassword}) => {
		roomCode = generateRoomCode(5);
		let room = {
			roomCode: roomCode,
			password: roomPassword,
			participants: {},
			messages: [],
		}
		client.join(roomCode);
		rooms[roomCode] = room;
		const newParticipant = { 
			id: client.id,
			userName: userName,
			profilePicture: `https://picsum.photos/id/${Math.trunc(Math.random() * 300)}/50/50`,
		}
		rooms[roomCode].participants[client.id] = newParticipant;
		console.log(rooms);
		client.emit(PROTOCOL.CREATE_SUCCESSFUL, room);
		client.to(roomCode).emit(PROTOCOL.USER_JOINED, newParticipant);

	})

	client.on(PROTOCOL.JOIN_ROOM, ({userName, roomCode:receivedRoomCode, roomPassword}) => {
		roomCode = receivedRoomCode;
		// check that the roomCode is valid
		if (!(roomCode in rooms)){
			client.emit(PROTOCOL.INVALID_ROOMCODE);
		}
		// check if the password is correct
		if (rooms[roomCode].password !== roomPassword){
			client.emit(PROTOCOL.INVALID_PASSWORD);
		} 
		else {
			client.join(roomCode);
			roomCode = roomCode;
			code = roomCode;
			const newParticipant = { 
				id: client.id,
				userName: userName,
				roomCode: roomCode,
				profilePicture: `https://picsum.photos/id/${Math.trunc(Math.random() * 300)}/50/50`,
			}
			rooms[roomCode].participants[client.id] = newParticipant;
			client.emit(PROTOCOL.JOIN_SUCCESSFUL, rooms[roomCode]);
			client.to(roomCode).emit(PROTOCOL.USER_JOINED, newParticipant);
		}
	})

	client.on(PROTOCOL.SET_PLAYING, ({playing, timestamp}) => {
		console.log(playing, timestamp)
		if (playing){
			io.in(roomCode).emit(PROTOCOL.SET_PLAYING, playing);
		} else {
			client.to(roomCode).emit(PROTOCOL.SET_PLAYING, playing, timestamp);
		}
	})

	// when client disconnects
	client.on("disconnect", (reason) => {
		if (roomCode in rooms){
			delete rooms[roomCode].participants[client.id];			
			client.to(roomCode).emit(PROTOCOL.USER_LEFT, client.id, reason);
			if (Object.entries(rooms[roomCode].participants).length === 0){
				delete rooms[roomCode];
			}
		}
		console.log(rooms);
	});
});

function generateRoomCode(length) {
	let result           = '';
	let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let charactersLength = characters.length;
	for ( let i = 0; i < length; i++ ) {
	   result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
