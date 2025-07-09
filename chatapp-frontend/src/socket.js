// src/socket.js
import { io } from 'socket.io-client';
import { server_url } from '../Service/server_url';

const socket = io(server_url, {
  transports: ['websocket'], // Ensures WebSocket transport
  withCredentials: true      // If your server sets cookies or requires credentials
});

export default socket;
