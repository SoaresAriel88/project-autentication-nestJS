import { io } from 'socket.io-client';
import * as readline from 'node:readline';

const username = process.argv[2] || 'Anônimo';
const room = process.argv[3];

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

socket.on('connect', () => {
  console.log(`Conectado como ${username}`);
  socket.emit('chat:join_room', room);
  console.log(`Conectado na sala ${room}`);
  console.log('Socket ID:', socket.id);
  console.log('Digite uma mensagem e aperte Enter:');
});

socket.on(
  'chat:new_message',
  (data: { room: string; author: string; content: string }) => {
    console.log('\nNova mensagem recebida:', data);
  },
);

socket.on('disconnect', () => {
  console.log('Desconectado do socket');
});

socket.on('connect_error', (error) => {
  console.log('Erro ao conectar:', error.message);
});

rl.on('line', (message) => {
  const text = message.trim();

  if (!text) {
    return;
  }

  socket.emit('chat:send_message', {
    room,
    author: username,
    content: text,
  });
});
