import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './Community.css';

const Community = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/posts');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      const res = await axios.post('http://localhost:5001/api/posts', {
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
      const res = await axios.put(`http://localhost:5001/api/posts/${postId}/like`, { userId: user.id });
      // Update local state
      setPosts(posts.map(p => p._id === postId ? { ...p, likes: res.data.likes } : p));
    } catch (err) {
      console.error(err);
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Community;
