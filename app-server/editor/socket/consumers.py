import urllib.parse
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from editor.models import Branch

class EditorConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def verify_branch(self, room_name, password):
        try:
            branch = Branch.objects.get(branch_id=room_name)
            if branch.password and not branch.check_password(password):
                return False
            return True
        except Branch.DoesNotExist:
            return True

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'editor_%s' % self.room_name

        query_string = self.scope.get('query_string', b'').decode('utf-8')
        query_params = urllib.parse.parse_qs(query_string)
        password = query_params.get('pwd', [''])[0]

        is_authorized = await self.verify_branch(self.room_name, password)
        if not is_authorized:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, bytes_data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'editor_message',
                'bytes_data': bytes_data
            }
        )

    async def editor_message(self, event):
        bytes_data = event['bytes_data']

        # Send message to WebSocket
        await self.send(bytes_data=bytes_data)
