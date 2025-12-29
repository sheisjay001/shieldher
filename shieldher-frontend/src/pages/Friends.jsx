import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './Friends.css';

const Friends = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('search'); // search, requests, list
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    if (activeTab === 'requests') fetchRequests();
    if (activeTab === 'list') fetchFriends();
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/friends/pending/${user.id}`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/friends/list/${user.id}`);
      setFriends(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/friends/search`, {
        params: { query: searchQuery, currentUserId: user.id }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (receiverId) => {
    try {
      await axios.post(`${API_BASE}/api/friends/request/${receiverId}`, {
        senderId: user.id
      });
      setMessage('Friend request sent!');
      setTimeout(() => setMessage(''), 3000);
      // Remove from search results to avoid duplicate sending
      setSearchResults(prev => prev.filter(u => u.id !== receiverId));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error sending request');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await axios.put(`${API_BASE}/api/friends/accept/${requestId}`);
      fetchRequests(); // Refresh list
      setMessage('Friend request accepted!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
        console.error(err);
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await axios.put(`${API_BASE}/api/friends/reject/${requestId}`);
      fetchRequests(); // Refresh list
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="friends-container">
      <h2>My Network</h2>
      
      <div className="friends-tabs">
        <button 
          className={activeTab === 'search' ? 'active' : ''} 
          onClick={() => setActiveTab('search')}
        >Find Friends</button>
        <button 
          className={activeTab === 'requests' ? 'active' : ''} 
          onClick={() => setActiveTab('requests')}
        >Requests {requests.length > 0 && <span className="badge">{requests.length}</span>}</button>
        <button 
          className={activeTab === 'list' ? 'active' : ''} 
          onClick={() => setActiveTab('list')}
        >My Friends</button>
      </div>

      {message && <div className="friends-message">{message}</div>}

      <div className="friends-content">
        {activeTab === 'search' && (
          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <input 
                type="text" 
                placeholder="Search by username..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>

            <div className="results-list">
              {loading ? <p>Loading...</p> : (
                searchResults.map(u => (
                  <div key={u.id} className="user-card">
                    <div className="user-info">
                        <strong>{u.username}</strong>
                        {u.isVerified && <span className="verified-badge">✅ Verified</span>}
                    </div>
                    <button onClick={() => sendRequest(u.id)}>Add Friend</button>
                  </div>
                ))
              )}
              {!loading && searchResults.length === 0 && searchQuery && <p>No users found.</p>}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-list">
             {loading ? <p>Loading...</p> : (
                requests.length === 0 ? <p>No pending requests.</p> : (
                    requests.map(req => (
                        <div key={req.id} className="request-card">
                            <div className="user-info">
                                <strong>{req.sender.username}</strong>
                                {req.sender.isVerified && <span className="verified-badge">✅ Verified</span>}
                            </div>
                            <div className="actions">
                                <button onClick={() => acceptRequest(req.id)} className="accept-btn">Accept</button>
                                <button onClick={() => rejectRequest(req.id)} className="reject-btn">Decline</button>
                            </div>
                        </div>
                    ))
                )
             )}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="friends-list">
             {loading ? <p>Loading...</p> : (
                friends.length === 0 ? <p>You haven't added any friends yet.</p> : (
                    friends.map(friend => (
                        <div key={friend.id} className="friend-card">
                            <div className="user-info">
                                <strong>{friend.username}</strong>
                            </div>
                            <button className="msg-btn">Message</button>
                        </div>
                    ))
                )
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
