import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './Verification.css';

const Verification = () => {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(AuthContext);
  const [inviteCode, setInviteCode] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/verification/invite/${user.id}`, { inviteCode });
      setMessage("Verification Successful! You are now a verified member.");
      setError('');
      
      // Update local storage with the new user data (verified status)
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Refresh to update app state
      setTimeout(() => {
        window.location.reload(); 
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid invite code");
      setMessage('');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('idImage', file);

    try {
      const res = await axios.post(`${API_BASE}/api/verification/upload-id/${user.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage(res.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
      setMessage('');
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h2>🛡️ ShieldHer Verification</h2>
        <p className="subtitle">To ensure a safe women-only space, we require verification.</p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="method-section">
          <h3>Option 1: Invite Code</h3>
          <p>Enter the code provided by an admin or existing member.</p>
          <form onSubmit={handleInviteSubmit}>
            <input 
              type="text" 
              placeholder="Enter Invite Code" 
              value={inviteCode} 
              onChange={(e) => setInviteCode(e.target.value)}
              className="verify-input"
            />
            <button type="submit" className="verify-button">Verify Code</button>
          </form>
        </div>

        <div className="divider">OR</div>

        <div className="method-section">
          <h3>Option 2: ID / Selfie Verification</h3>
          <p>Upload a photo of your ID or a selfie holding a piece of paper with today's date.</p>
          <form onSubmit={handleUploadSubmit}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="file-input"
            />
            <button type="submit" className="verify-button secondary" disabled={!file}>
              Upload for Review
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Verification;
