const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  owner: { type: String }, // email of donor
  foodName: { type: String },
  quantity: { type: String },
  expiresIn: { type: String },
  location: { type: String },
  status: { type: String, enum: ['available', 'requested', 'claimed'], default: 'available' },
  requestedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Donation', DonationSchema);
