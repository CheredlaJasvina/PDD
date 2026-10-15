const mongoose = require('mongoose');

const HouseholdSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  owner: { type: String }, // email of creator
  members: [{
    name: { type: String },
    email: { type: String },
    role: { type: String },
    joinedAt: { type: Date, default: Date.now }
  }],
  chores: [{
    title: { type: String },
    assignedTo: { type: String },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  logs: [{
    action: { type: String },
    member: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Household', HouseholdSchema);
