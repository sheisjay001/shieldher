import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './Community.css';

const Community = () => {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [API_BASE]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      const res = await axios.post(`${API_BASE}/api/posts`, {
        author: user.id,
        content: newPostContent
      });
      setPosts([res.data, ...posts]);
      setNewPostContent('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create post");
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.put(`${API_BASE}/api/posts/${postId}/like`, { userId: user.id });
      // Update local state
      setPosts(posts.map(p => p._id === postId ? { ...p, likes: res.data.likes } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (postId) => {
    const reason = prompt("Please provide a reason for reporting this post:");
    if (!reason) return;

    try {
      await axios.post(`${API_BASE}/api/reports`, {
        reporter: user.id,
        reportedTarget: postId,
        targetType: 'Post',
        reason
      });
      alert("Report submitted successfully. Thank you for keeping the community safe.");
    } catch (err) {
      console.error(err);
      alert("Failed to submit report.");
    }
  };

  return (
    <div className="community-container">
      <div className="community-header">
        <h2>🌐 Community Feed</h2>
        <p>Share your thoughts safely with the community.</p>
      </div>

      <div className="create-post-card">
        <form onSubmit={handleCreatePost}>
          <textarea
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="post-input"
            rows="3"
          />
          {error && <div className="post-error">{error}</div>}
          <div className="post-actions">
            <button type="submit" className="post-button">Post</button>
          </div>
        </form>
      </div>

      <div className="posts-feed">
        {posts.map(post => (
          <div key={post._id} className="post-card">
            <div className="post-header">
              <div className="avatar small">{post.author?.username?.charAt(0).toUpperCase()}</div>
              <div className="post-meta">
                <span className="post-author">{post.author?.username || 'Unknown'}</span>
                <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="post-content">
              {post.content}
            </div>
            <div className="post-footer">
              <button 
                className={`like-button ${post.likes.includes(user.id) ? 'liked' : ''}`}
                onClick={() => handleLike(post._id)}
              >
                ❤️ {post.likes.length}
              </button>
              <button 
                className="report-button"
                onClick={() => handleReport(post._id)}
                title="Report this post"
              >
                ⚠️ Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Community;
