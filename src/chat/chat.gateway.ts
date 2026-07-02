import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import type { SendMessagePayload } from './types/send-message-payload.type';

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
  @SubscribeMessage('chat:join_room')
  async handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    console.log('Sala recebida:', room);
    console.log('Socket do cliente:', client.id);
    if (room.trim()) {
      console.log('Cliente entrou na sala', room);
      await client.join(room);
    }
  }

  @SubscribeMessage('chat:send_message')
  handleSendMessage(
    @MessageBody() data: SendMessagePayload,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log('Mensagem recebida:', data);
    console.log('Sala:', data.room);

    if (!data.room || !data.content) {
      return;
    }

    client.to(data.room).emit('chat:new_message', data);
  }
}
