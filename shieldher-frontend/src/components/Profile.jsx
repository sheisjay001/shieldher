import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './Profile.css';

const Profile = ({ onClose }) => {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await axios.post(`${API_BASE}/api/users/${user.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage("Profile picture updated!");
      
      // Update local storage
      const updatedUser = { ...user, profilePicture: res.data.profilePicture };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Reload to show changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      setMessage("Failed to upload.");
    }
  };

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Edit Profile</h2>
        
        <div className="current-avatar">
          {user.profilePicture ? (
            <img src={`http://localhost:5001/${user.profilePicture}`} alt="Profile" className="profile-img-large" />
          ) : (
            <div className="avatar-placeholder-large">{user.username.charAt(0).toUpperCase()}</div>
          )}
        </div>

        <form onSubmit={handleUpload}>
            <label className="upload-label">
                Change Profile Picture
                <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
            <button type="submit" className="save-btn" disabled={!file}>Save Changes</button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default Profile;
