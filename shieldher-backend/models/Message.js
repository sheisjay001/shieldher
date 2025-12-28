const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // This field will be set when the message is read. 
  // MongoDB TTL index will monitor this field.
  expiresAt: {
    type: Date,
    default: null // Null means it won't expire until we set it
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a TTL index on the expiresAt field. 
// The document will be automatically deleted 0 seconds after the time specified in expiresAt.
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Message', messageSchema);
