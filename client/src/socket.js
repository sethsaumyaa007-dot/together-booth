import { io } from "socket.io-client";
const socket = io("https://together-booth.onrender.com");

export default socket;