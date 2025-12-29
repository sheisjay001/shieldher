const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  // In a real app, we would have verification status here
  isVerified: {
    type: Boolean,
    default: false // Requires admin or AI verification
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationImage: {
    type: String, // Path to uploaded ID/Selfie
    default: null
  },
  profilePicture: {
    type: String, // Path to uploaded profile picture
    default: null
  },
  inviteCode: {
    type: String, // If used invite code
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
