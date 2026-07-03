import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import type { SendMessagePayload } from './types/send-message-payload.type';

type SocketAckResponse = {
  success: boolean;
  message: string;
};
type SocketTypingStart = {
  room: string;
  author: string;
};

@WebSocketGateway({
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  handleConnection(client: Socket) {
    console.log('Cliente conectado:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }
  @SubscribeMessage('chat:typing_start')
  handleTypingStart(
    @MessageBody() data: SocketTypingStart,
    @ConnectedSocket() client: Socket,
  ): object {
    if (!data?.room?.trim()) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    if (!data?.author?.trim()) {
      return {
        success: false,
        message: 'Autor não informado',
      };
    }
    const payload: SocketTypingStart = {
      room: data.room.trim(),
      author: data.author.trim(),
    };
    client.to(payload.room).emit('chat:user_typing', payload);
    return {
      success: true,
      message: 'Typing enviado',
    };
  }
  @SubscribeMessage('chat:typing_stop')
  handleTypingStop(
    @MessageBody() data: SocketTypingStart,
    @ConnectedSocket() client: Socket,
  ): object {
    if (!data?.room?.trim()) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    if (!data?.author?.trim()) {
      return {
        success: false,
        message: 'Autor não informado',
      };
    }
    const payload: SocketTypingStart = {
      room: data.room.trim(),
      author: data.author.trim(),
    };
    client.to(payload.room).emit('chat:user_stop_typing', payload);
    return {
      success: true,
      message: 'Typing Stop enviado',
    };
  }

  @SubscribeMessage('chat:join_room')
  async handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ): Promise<SocketAckResponse> {
    const roomName = room?.trim();

    console.log('Sala recebida:', roomName);
    console.log('Socket do cliente:', client.id);

    if (!roomName) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    await client.join(roomName);

    console.log(`Cliente ${client.id} entrou na sala ${roomName}`);

    return {
      success: true,
      message: `Entrou na sala ${roomName}`,
    };
  }
  @SubscribeMessage('chat:leave_room')
  async handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ): Promise<SocketAckResponse> {
    const roomName = room?.trim();

    console.log('Sala recebida:', roomName);
    console.log('Socket do cliente:', client.id);

    if (!roomName) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    await client.leave(roomName);

    console.log(`Cliente ${client.id} saiu da sala ${roomName}`);

    return {
      success: true,
      message: `Saiu da sala ${roomName}`,
    };
  }

  @SubscribeMessage('chat:send_message')
  handleSendMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() client: Socket,
  ): SocketAckResponse {
    if (!data?.room?.trim()) {
      return {
        success: false,
        message: 'Sala não informada',
      };
    }

    if (!data?.author?.trim()) {
      return {
        success: false,
        message: 'Autor não informado',
      };
    }

    if (!data?.content?.trim()) {
      return {
        success: false,
        message: 'Mensagem vazia',
      };
    }

    const payload: SendMessagePayload = {
      room: data.room.trim(),
      author: data.author.trim(),
      content: data.content.trim(),
    };

    console.log('Mensagem recebida:', payload);
    console.log('Socket do cliente:', client.id);

    client.to(payload.room).emit('chat:new_message', payload);

    return {
      success: true,
      message: 'Mensagem enviada',
    };
  }
}
