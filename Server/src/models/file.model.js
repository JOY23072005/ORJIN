import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  name: { type: String, required: true },
  path: { type: String, required: true }, // e.g., src/index.js
  type: { type: String, enum: ['file', 'folder'], required: true },
  content: { type: String, default: '' },
  parent: { type: String }, // path of parent, e.g., "src"
},{timestamps:true});

export default mongoose.model('File', fileSchema);
