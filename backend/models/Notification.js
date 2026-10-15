const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  owner: { type: String }, // email of recipient
  type: { type: String, default: 'info' },
  message: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
