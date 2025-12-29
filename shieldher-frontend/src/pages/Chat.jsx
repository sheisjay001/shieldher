import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import './Chat.css';

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
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert("Failed to send message.");
      }
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

  const handleBackToUsers = () => {
    setReceiverId(null);
  };

  return (
    <div className="chat-container">
      <div className={`sidebar ${receiverId ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <h3>Conversations</h3>
        </div>
        <div className="user-list">
          {users.map((u) => (
            <div 
              key={u._id} 
              onClick={() => setReceiverId(u._id)}
              className={`user-item ${receiverId === u._id ? 'active' : ''}`}
            >
              <div className="avatar-container">
                 <div className="avatar">{u.username.charAt(0).toUpperCase()}</div>
                 {isUserOnline(u._id) && <div className="online-indicator"></div>}
              </div>
              <div className="user-info">
                <span className="username">{u.username}</span>
                <span className={`status-text ${isUserOnline(u._id) ? 'online' : ''}`}>
                  {isUserOnline(u._id) ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* On mobile, if no receiver selected, we show sidebar only (handled by CSS hiding chat-area or showing empty state differently) */}
      {/* Actually, with the 'hidden' class on sidebar, we just need to make sure chat-area takes full width */}
      
      <div className="chat-area" style={{ display: !receiverId && window.innerWidth <= 768 ? 'none' : 'flex' }}>
        {receiverId ? (
          <>
            <div className="chat-header">
               <div className="header-info">
                  <button className="back-button" onClick={handleBackToUsers}>
                    ←
                  </button>
                  <h3>{users.find(u => u._id === receiverId)?.username}</h3>
                  {isUserOnline(receiverId) && <span className="online-badge">Online</span>}
               </div>
               <div className="security-note">
                <span title="AI Content Moderation Active">🛡️ ShieldAI Active</span>
                <span style={{marginLeft: '10px'}}>🔒 Auto-delete (5m)</span>
              </div>
            </div>
            
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message-bubble ${msg.sender === user.id ? 'mine' : 'theirs'}`}
                >
                  <div className="message-content">{msg.content}</div>
                  <span className="message-time">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              ))}
              {isTyping && (
                <div className="typing-indicator">
                  <span>User is typing...</span>
                </div>
              )}
            </div>
            <div className="input-area">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleTyping}
                className="message-input"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="send-button">➤</button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>Select a user to start chatting</h3>
            <p>Choose from the list on the left</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
