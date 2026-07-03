import { io } from 'socket.io-client';
import * as readline from 'node:readline';

type SendMessagePayload = {
  room: string;
  author: string;
  content: string;
};

type SocketAckResponse = {
  success: boolean;
  message: string;
};
type SocketTypingStart = {
  room: string;
  author: string;
};

const username = process.argv[2]?.trim() || 'Anônimo';
const room = process.argv[3]?.trim();
let isInRoom = false;
if (!room) {
  console.log('Informe a sala ao iniciar o client.');
  console.log('Exemplo: npx tsx scripts/chat-client.ts Ariel conversation:1');
  process.exit(1);
}

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

socket.on('connect', () => {
  console.log(`Conectado como ${username}`);
  console.log('Socket ID:', socket.id);

  socket.emit('chat:join_room', room, (response: SocketAckResponse) => {
    if (!response.success) {
      console.log(`Erro: ${response.message}`);
      return;
    }

    console.log(response.message);
    isInRoom = true;
    console.log('Digite uma mensagem e aperte Enter:');
  });
});

socket.on('chat:new_message', (data: SendMessagePayload) => {
  console.log(`\n${data.author}: ${data.content}`);
});
socket.on('chat:user_typing', (data: SocketTypingStart) => {
  console.log(`\n${data.author} Está digitando...`);
});
socket.on('chat:user_stop_typing', (data: SocketTypingStart) => {
  console.log(`\n${data.author} Parou de digitar`);
});

socket.on('disconnect', () => {
  console.log('Desconectado do socket');
});

socket.on('connect_error', (error) => {
  console.log('Erro ao conectar:', error.message);
});

rl.on('line', (message) => {
  const text = message.trim();

  if (!text) {
    console.log('Mensagem vazia não enviada.');
    return;
  }
  if (text == '/leave') {
    socket.emit('chat:leave_room', room, (response: SocketAckResponse) => {
      if (!response.success) {
        console.log(`Erro: ${response.message}`);
        return;
      }
      isInRoom = false;
      console.log(response.message);
      console.log('Você não está mais na sala');
    });
    return;
  }
  if (isInRoom == false) {
    console.log('Você não está mais na sala');
    return;
  }

  const payload: SendMessagePayload = {
    room,
    author: username,
    content: text,
  };
  const payloadTypingStartAndStop: SocketTypingStart = {
    room,
    author: username,
  };
  socket.emit('chat:typing_start', payloadTypingStartAndStop);

  socket.emit('chat:send_message', payload, (response: SocketAckResponse) => {
    if (!response.success) {
      console.log(`Erro: ${response.message}`);
      return;
    }
    socket.emit('chat:typing_stop', payloadTypingStartAndStop);

    console.log(response.message);
  });
});
