const sequelize = require('../config/database');
const User = require('./User');
const Message = require('./Message');
const Post = require('./Post');
const Comment = require('./Comment');
const PostLike = require('./PostLike');
const Report = require('./Report');
const FriendRequest = require('./FriendRequest');

// User Associations
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
User.hasMany(Report, { foreignKey: 'reporterId', as: 'reports' });
User.hasMany(PostLike, { foreignKey: 'userId' });

// Friend Associations
User.hasMany(FriendRequest, { foreignKey: 'senderId', as: 'sentFriendRequests' });
User.hasMany(FriendRequest, { foreignKey: 'receiverId', as: 'receivedFriendRequests' });
FriendRequest.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
FriendRequest.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Self-referential Many-to-Many for Friends (using accepted FriendRequests could be complex, 
// usually simpler to query FriendRequests where status='accepted')

// Message Associations
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Post Associations
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes' });
Post.belongsToMany(User, { 
  through: PostLike, 
  as: 'likedBy', 
  foreignKey: 'postId',
  otherKey: 'userId' 
});

// PostLike Associations (Explicitly defined to avoid auto-generation of keys)
PostLike.belongsTo(User, { foreignKey: 'userId' });
PostLike.belongsTo(Post, { foreignKey: 'postId' });

// Comment Associations
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Report Associations
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });

module.exports = {
  sequelize,
  User,
  Message,
  Post,
  Comment,
  PostLike,
  Report,
  FriendRequest
};
