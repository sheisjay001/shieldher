import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import './Chat.css';

const Chat = () => {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [receiverId, setReceiverId] = useState(null);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]); // Store IDs of online users
  const [isTyping, setIsTyping] = useState(false); // State for displaying typing indicator
  const [showChat, setShowChat] = useState(false); // Mobile view toggle
  const socket = useRef();
  const typingTimeoutRef = useRef(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/users`);
        // Filter out current user
        setUsers(res.data.filter(u => u.id !== user.id));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [user, API_BASE]);

  // Fetch message history when receiver changes
  useEffect(() => {
    if (!receiverId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/messages/${user.id}/${receiverId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [receiverId, user.id, API_BASE]);

  const markAsRead = async (messageId) => {
    try {
      await axios.put(`${API_BASE}/api/messages/${messageId}/read`);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    socket.current = io(SOCKET_URL);
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
         markAsRead(data.id);
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
  }, [user, receiverId, SOCKET_URL, markAsRead]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!receiverId) return;

    // Emit typing event
    socket.current.emit('typing', { senderId: user.id, receiverId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit('stop_typing', { senderId: user.id, receiverId });
    }, 1000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !receiverId) return;

    const messageData = {
      sender: user.id,
      receiver: receiverId,
      content: newMessage,
    };

    try {
      const res = await axios.post(`${API_BASE}/api/messages`, messageData);
      socket.current.emit('send_message', res.data);
      setMessages([...messages, res.data]);
      setNewMessage('');
      socket.current.emit('stop_typing', { senderId: user.id, receiverId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserSelect = (id) => {
    setReceiverId(id);
    setShowChat(true);
  };

  const handleBackToUsers = () => {
    setShowChat(false);
    setReceiverId(null);
  };

  return (
    <div className={`chat-container ${showChat ? 'chat-active' : ''}`}>
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Messages</h3>
        </div>
        <div className="user-list">
          {users.map((u) => (
            <div
              key={u.id}
              className={`user-item ${receiverId === u.id ? 'active' : ''}`}
              onClick={() => handleUserSelect(u.id)}
            >
              <div className="avatar-container">
                {u.profilePicture ? (
                    <img src={`${API_BASE}/${u.profilePicture}`} className="avatar" alt="User" />
                ) : (
                    <div className="avatar">{u.username.charAt(0).toUpperCase()}</div>
                )}
                {onlineUsers.includes(u.id) && <div className="online-indicator"></div>}
              </div>
              <div className="user-info">
                <span className="username">{u.username}</span>
                <span className="status-text">{onlineUsers.includes(u.id) ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-window">
        {receiverId ? (
          <>
            <div className="chat-header">
              <button className="back-btn" onClick={handleBackToUsers}>←</button>
              <div className="chat-header-user">
                {users.find(u => u.id === receiverId)?.profilePicture ? (
                   <img src={`${API_BASE}/${users.find(u => u.id === receiverId)?.profilePicture}`} className="avatar-small" alt="User" />
                ) : (
                   <div className="avatar-small">{users.find(u => u.id === receiverId)?.username.charAt(0).toUpperCase()}</div>
                )}
                <h4>{users.find(u => u.id === receiverId)?.username}</h4>
              </div>
            </div>
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender === user.id ? 'sent' : 'received'}`}>
                  <p>{msg.content}</p>
                  <span className="timestamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              {isTyping && <div className="typing-indicator">Typing...</div>}
            </div>
            <form onSubmit={sendMessage} className="message-input-form">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleTyping}
                className="message-input"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Select a user to start chatting</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
