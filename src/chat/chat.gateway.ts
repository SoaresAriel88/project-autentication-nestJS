import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

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

  @SubscribeMessage('chat:send_message')
  handleSendEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log('Mensagem recebida:', data);
    console.log('Socket do cliente:', client.id);
    if(data){
      client.broadcast.emit('chat:new_message', data);
    }
  }
}