# 🔌 WebSocket Messaging Client Example

This document provides examples of how to connect to and use the Vaultify WebSocket messaging system.

## 📡 Connection Setup

### JavaScript/TypeScript Client

```typescript
import { io } from 'socket.io-client';

// Connect to the messaging WebSocket
const socket = io('ws://localhost:3000/messaging', {
  auth: {
    token: 'your-jwt-access-token'
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to messaging server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from messaging server');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useMessagingSocket = (token: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('ws://localhost:3000/messaging', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to messaging');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from messaging');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, isConnected };
};
```

## 🏠 Estate Group Messaging

### Join Estate Group

```typescript
// Join your estate's group chat
socket.emit('join_estate_group', {
  estateId: 'your-estate-id'
});

// Listen for estate group events
socket.on('estate_broadcast', (data) => {
  console.log('Estate broadcast:', data);
  // {
  //   message: "Important announcement",
  //   type: "announcement",
  //   from: {
  //     userId: "admin-user-id",
  //     firstName: "Admin",
  //     lastName: "User",
  //     role: "Admin"
  //   },
  //   timestamp: "2024-01-01T12:00:00Z"
  // }
});
```

### Send Estate Broadcast (Admin/Security only)

```typescript
// Send announcement to entire estate
socket.emit('estate_broadcast', {
  message: 'Water will be shut off for maintenance from 2-4 PM',
  type: 'maintenance'
});
```

## 💬 Private Messaging

### Send Message

```typescript
// Send a message to a conversation
socket.emit('send_message', {
  conversationId: 'conversation-uuid',
  content: 'Hello everyone!',
  type: 'text',
  replyToMessageId: 'optional-reply-to-message-id'
});

// Listen for new messages
socket.on('new_message', (data) => {
  console.log('New message:', data);
  // {
  //   conversationId: "conversation-uuid",
  //   message: {
  //     message_id: "message-uuid",
  //     content: "Hello everyone!",
  //     type: "text",
  //     created_at: "2024-01-01T12:00:00Z",
  //     sender: {
  //       user_id: "sender-uuid",
  //       first_name: "John",
  //       last_name: "Doe",
  //       profile_picture_url: "https://..."
  //     }
  //   }
  // }
});
```

### Typing Indicators

```typescript
// Start typing
socket.emit('typing', {
  conversationId: 'conversation-uuid',
  isTyping: true
});

// Stop typing
socket.emit('typing', {
  conversationId: 'conversation-uuid',
  isTyping: false
});

// Listen for typing events
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
  // {
  //   conversationId: "conversation-uuid",
  //   userId: "user-uuid",
  //   firstName: "John",
  //   lastName: "Doe",
  //   isTyping: true
  // }
});
```

### Read Receipts

```typescript
// Mark message as read
socket.emit('mark_as_read', {
  conversationId: 'conversation-uuid',
  messageId: 'message-uuid'
});

// Listen for read receipts
socket.on('message_read', (data) => {
  console.log('Message read:', data);
  // {
  //   conversationId: "conversation-uuid",
  //   messageId: "message-uuid",
  //   readBy: "user-uuid",
  //   readAt: "2024-01-01T12:00:00Z"
  // }
});
```

## 👥 User Presence

### Online/Offline Status

```typescript
// Listen for user online status
socket.on('user_online', (data) => {
  console.log('User came online:', data);
  // {
  //   userId: "user-uuid",
  //   firstName: "John",
  //   lastName: "Doe",
  //   timestamp: "2024-01-01T12:00:00Z"
  // }
});

socket.on('user_offline', (data) => {
  console.log('User went offline:', data);
  // {
  //   userId: "user-uuid",
  //   timestamp: "2024-01-01T12:00:00Z"
  // }
});
```

## 🔧 Complete React Component Example

```typescript
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  message_id: string;
  content: string;
  type: string;
  created_at: string;
  sender: {
    user_id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
}

interface EstateBroadcast {
  message: string;
  type: string;
  from: {
    userId: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  timestamp: string;
}

const MessagingComponent: React.FC<{ token: string; estateId: string }> = ({ 
  token, 
  estateId 
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [estateBroadcasts, setEstateBroadcasts] = useState<EstateBroadcast[]>([]);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('ws://localhost:3000/messaging', {
      auth: { token }
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to messaging');
      // Join estate group
      newSocket.emit('join_estate_group', { estateId });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from messaging');
    });

    // Message events
    newSocket.on('new_message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    newSocket.on('message_read', (data) => {
      console.log('Message read:', data);
    });

    // Typing events
    newSocket.on('user_typing', (data) => {
      setIsTyping(prev => ({
        ...prev,
        [data.userId]: data.isTyping
      }));
    });

    // Estate broadcast events
    newSocket.on('estate_broadcast', (data) => {
      setEstateBroadcasts(prev => [...prev, data]);
    });

    // Presence events
    newSocket.on('user_online', (data) => {
      setOnlineUsers(prev => [...prev, data.userId]);
    });

    newSocket.on('user_offline', (data) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, estateId]);

  const sendMessage = (content: string, conversationId: string) => {
    if (socket) {
      socket.emit('send_message', {
        conversationId,
        content,
        type: 'text'
      });
    }
  };

  const startTyping = (conversationId: string) => {
    if (socket) {
      socket.emit('typing', {
        conversationId,
        isTyping: true
      });
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socket) {
      socket.emit('typing', {
        conversationId,
        isTyping: false
      });
    }
  };

  return (
    <div className="messaging-container">
      <div className="online-users">
        <h3>Online Users ({onlineUsers.length})</h3>
        {/* Display online users */}
      </div>

      <div className="estate-broadcasts">
        <h3>Estate Announcements</h3>
        {estateBroadcasts.map((broadcast, index) => (
          <div key={index} className="broadcast">
            <strong>{broadcast.from.firstName} {broadcast.from.lastName}</strong>
            <p>{broadcast.message}</p>
            <small>{new Date(broadcast.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>

      <div className="messages">
        {messages.map((message) => (
          <div key={message.message_id} className="message">
            <div className="sender">
              {message.sender.first_name} {message.sender.last_name}
            </div>
            <div className="content">{message.content}</div>
            <div className="timestamp">
              {new Date(message.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Typing indicators */}
      {Object.entries(isTyping).map(([userId, typing]) => 
        typing && (
          <div key={userId} className="typing-indicator">
            User is typing...
          </div>
        )
      )}
    </div>
  );
};

export default MessagingComponent;
```

## 🚀 WebSocket Events Summary

### Client → Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `join_estate_group` | Join estate group chat | `{ estateId: string }` |
| `leave_estate_group` | Leave estate group chat | `{ estateId: string }` |
| `send_message` | Send message to conversation | `{ conversationId, content, type, replyToMessageId? }` |
| `typing` | Send typing indicator | `{ conversationId, isTyping }` |
| `mark_as_read` | Mark message as read | `{ conversationId, messageId }` |
| `estate_broadcast` | Send estate broadcast (Admin/Security) | `{ message, type? }` |

### Server → Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `new_message` | New message received | `{ conversationId, message }` |
| `message_sent` | Message sent confirmation | `{ messageId }` |
| `message_read` | Message read receipt | `{ conversationId, messageId, readBy, readAt }` |
| `user_typing` | User typing indicator | `{ conversationId, userId, firstName?, lastName?, isTyping }` |
| `estate_broadcast` | Estate broadcast received | `{ message, type, from, timestamp }` |
| `user_online` | User came online | `{ userId, firstName, lastName, timestamp }` |
| `user_offline` | User went offline | `{ userId, timestamp }` |
| `error` | Error occurred | `{ message }` |

## 🔒 Authentication

The WebSocket connection requires JWT authentication. Include your access token in the connection:

```typescript
const socket = io('ws://localhost:3000/messaging', {
  auth: {
    token: 'your-jwt-access-token'
  }
});
```

## 📱 Mobile Integration

For mobile apps, you can use the same WebSocket events with libraries like:
- **React Native**: `socket.io-client`
- **Flutter**: `socket_io_client`
- **iOS**: `SocketIO`
- **Android**: `Socket.IO`

The WebSocket API is platform-agnostic and works with any Socket.IO client library.
