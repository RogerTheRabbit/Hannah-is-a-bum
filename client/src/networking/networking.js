import React, { createContext } from 'react';
import socket from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { addParticipant, setRoom } from '../redux/lobby/lobbyActions';
import dotenv from "dotenv";

dotenv.config();

const IP = process.env.REACT_APP_IP;
const PORT = process.env.REACT_APP_PORT;

export const WebSocketContext = createContext(null)

const PROTOCOL = {
	TEST: "test",
	NEW_USER: "new_user",
	JOIN_ROOM: "join_room",
	JOIN_SUCCESSFUL: "join_successful",
	USER_JOINED: "user_joined",
	USER_LEFT: "user_left"
};

export default ({ children }) => {
    let io;
    let ws;

    const dispatch = useDispatch();

    const joinRoom = (userName, roomCode, roomPassword) => {
        io.emit(PROTOCOL.JOIN_ROOM, {
            userName: userName,
            roomCode: roomCode,
            roomPassword: roomPassword,
        });
    }

    const disconnect = () => {
        io.disconnect();
    }

    if (!io) {
        io = socket.connect("http://" + IP + ":" + PORT);

        io.on("connect", () => {
            console.log("Connected to server");
        });

        io.on(PROTOCOL.JOIN_SUCCESSFUL, (room) => {
            dispatch(setRoom(room));
        });

        io.on(PROTOCOL.USER_JOINED, (newParticipant) => {
            console.log("User joined:", newParticipant);
            dispatch(addParticipant(newParticipant))
        })

        io.on(PROTOCOL.USER_LEFT, (msg) => 
            console.log(msg)
        );

        io.on("disconnect", (msg) => {
            console.log("Disconnected: ", msg);
            dispatch(setRoom(null));
        });

        io.on(PROTOCOL.TEST, (data) => {
            console.log(data);
        });

        ws = {
            io: io,
            joinRoom,
            disconnect,
        }
    }

    return (
        <WebSocketContext.Provider value={ws}>
            {children}
        </WebSocketContext.Provider>
    )
}
