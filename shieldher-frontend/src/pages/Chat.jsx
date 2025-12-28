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
  const socket = useRef();

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
  }, [receiverId, user.id]);

  useEffect(() => {
    socket.current = io('http://localhost:5001');
    socket.current.emit('join_room', user.id);

    socket.current.on('receive_message', (data) => {
      // Only append if the message is from the person we are currently chatting with
      if (data.sender === receiverId || data.sender === user.id) {
         setMessages((prev) => [...prev, data]);
         markAsRead(data._id);
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [user, receiverId]);

  const sendMessage = async () => {
    if (!newMessage || !receiverId) return;

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
              <div style={styles.avatar}>{u.username.charAt(0).toUpperCase()}</div>
              <span>{u.username}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.chatArea}>
        {receiverId ? (
          <>
            <div style={styles.chatHeader}>
               <h3>Chatting with {users.find(u => u._id === receiverId)?.username}</h3>
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
            </div>
            <div style={styles.inputArea}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
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
    gap: '10px',
    borderBottom: '1px solid #eee',
    transition: 'background 0.2s',
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
  messages: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: '#f5f5f5',
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
