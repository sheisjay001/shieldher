import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';

const Chat = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverId, setReceiverId] = useState(null);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]); // Store IDs of online users
  const [isTyping, setIsTyping] = useState(false); // State for displaying typing indicator
  const socket = useRef();
  const typingTimeoutRef = useRef(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/users');
        // Filter out current user
        setUsers(res.data.filter(u => u._id !== user.id));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [user]);

  // Fetch message history when receiver changes
  useEffect(() => {
    if (!receiverId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/messages/${user.id}/${receiverId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
    setIsTyping(false); // Reset typing indicator when switching users
  }, [receiverId, user.id]);

  useEffect(() => {
    socket.current = io('http://localhost:5001');
    socket.current.emit('join_room', user.id);

    // Listen for online users update
    socket.current.on('get_online_users', (users) => {
      // users is an array of { userId, socketId }
      // We just need the userIds
      setOnlineUsers(users.map(u => u.userId));
    });

    socket.current.on('receive_message', (data) => {
      // Only append if the message is from the person we are currently chatting with
      if (data.sender === receiverId || data.sender === user.id) {
         setMessages((prev) => [...prev, data]);
         markAsRead(data._id);
         setIsTyping(false); // Hide typing indicator when message received
      }
    });

    // Listen for typing events
    socket.current.on('display_typing', (data) => {
      if (data.senderId === receiverId) {
        setIsTyping(true);
      }
    });

    socket.current.on('hide_typing', (data) => {
      if (data.senderId === receiverId) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [user, receiverId]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!receiverId) return;

    // Emit typing event
    socket.current.emit('typing', { receiverId, senderId: user.id });

    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit('stop_typing', { receiverId, senderId: user.id });
    }, 2000);
  };

  const sendMessage = async () => {
    if (!newMessage || !receiverId) return;

    // Clear typing timeout and emit stop_typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.current.emit('stop_typing', { receiverId, senderId: user.id });

    const messageData = {
      sender: user.id,
      receiver: receiverId,
      content: newMessage,
      createdAt: new Date(),
    };

    try {
      const res = await axios.post('http://localhost:5001/api/messages', messageData);
      setMessages((prev) => [...prev, res.data]);
      socket.current.emit('send_message', res.data);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await axios.put(`http://localhost:5001/api/messages/${messageId}/read`);
    } catch (err) {
      console.error(err);
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h3>Conversations</h3>
        <div style={styles.userList}>
          {users.map((u) => (
            <div 
              key={u._id} 
              onClick={() => setReceiverId(u._id)}
              style={{
                ...styles.userItem,
                backgroundColor: receiverId === u._id ? '#e1bee7' : 'transparent'
              }}
            >
              <div style={styles.avatarContainer}>
                 <div style={styles.avatar}>{u.username.charAt(0).toUpperCase()}</div>
                 {isUserOnline(u._id) && <div style={styles.onlineIndicator}></div>}
              </div>
              <div style={styles.userInfo}>
                <span style={styles.username}>{u.username}</span>
                <span style={styles.statusText}>{isUserOnline(u._id) ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.chatArea}>
        {receiverId ? (
          <>
            <div style={styles.chatHeader}>
               <div style={styles.headerInfo}>
                  <h3>Chatting with {users.find(u => u._id === receiverId)?.username}</h3>
                  {isUserOnline(receiverId) && <span style={styles.onlineBadge}>Online</span>}
               </div>
               <div style={styles.securityNote}>
                🔒 Messages auto-delete 5 mins after read.
              </div>
            </div>
            
            <div style={styles.messages}>
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  style={msg.sender === user.id ? styles.myMessage : styles.theirMessage}
                >
                  <p>{msg.content}</p>
                  <span style={styles.time}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
              {isTyping && (
                <div style={styles.typingIndicator}>
                  <span>User is typing...</span>
                </div>
              )}
            </div>
            <div style={styles.inputArea}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleTyping}
                style={styles.messageInput}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} style={styles.sendButton}>Send</button>
            </div>
          </>
        ) : (
          <div style={styles.emptyState}>
            <h3>Select a user to start chatting</h3>
            <p>Choose from the list on the left</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 80px)',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#fff',
    boxShadow: '0 0 20px rgba(0,0,0,0.05)',
  },
  sidebar: {
    width: '300px',
    borderRight: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    flexDirection: 'column',
  },
  userList: {
    overflowY: 'auto',
    flex: 1,
  },
  userItem: {
    padding: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    borderBottom: '1px solid #eee',
    transition: 'background 0.2s',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#6a1b9a',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '12px',
    height: '12px',
    backgroundColor: '#4caf50',
    borderRadius: '50%',
    border: '2px solid white',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  username: {
    fontWeight: '500',
  },
  statusText: {
    fontSize: '0.75rem',
    color: '#888',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    padding: '1rem 2rem',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  onlineBadge: {
    fontSize: '0.7rem',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 'bold',
  },
  messages: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: '#f5f5f5',
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    color: '#888',
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
    fontStyle: 'italic',
  },
  inputArea: {
    padding: '1.5rem',
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: '1rem',
    backgroundColor: '#fff',
  },
  messageInput: {
    flex: 1,
    padding: '1rem',
    borderRadius: '30px',
    border: '1px solid #ddd',
    outline: 'none',
    fontSize: '1rem',
  },
  sendButton: {
    padding: '0 2rem',
    borderRadius: '30px',
    border: 'none',
    backgroundColor: '#6a1b9a',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6a1b9a',
    color: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '20px 20px 0 20px',
    maxWidth: '70%',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    color: '#333',
    padding: '1rem 1.5rem',
    borderRadius: '20px 20px 20px 0',
    maxWidth: '70%',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  },
  time: {
    fontSize: '0.7rem',
    opacity: 0.8,
    display: 'block',
    marginTop: '0.5rem',
    textAlign: 'right',
  },
  securityNote: {
    fontSize: '0.8rem',
    color: '#e65100',
    backgroundColor: '#fff3e0',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
  }
};

export default Chat;
