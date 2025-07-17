// src/models/Room.js
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String },
  createdBy: { type: String, required: true }, // userId/email
  members: [
    {
      userId: { type: String, required: true },
      role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' }
    }
  ]
}, { timestamps: true });

export default mongoose.model('Room', roomSchema);
