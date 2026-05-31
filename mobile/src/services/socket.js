import { io } from 'socket.io-client';
import { BASE_URL } from '../api';

let socket = null;
const listeners = new Map();

export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io(BASE_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 3000,
  });

  socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
  socket.on('disconnect', () => console.log('[Socket] Disconnected'));

  socket.on('price_update', (data) => {
    listeners.forEach((cb) => cb(data));
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const addPriceListener = (key, callback) => {
  listeners.set(key, callback);
};

export const removePriceListener = (key) => {
  listeners.delete(key);
};
