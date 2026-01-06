import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  content_cid: { type: String, required: true }, // IPFS CID
  payment_receipt: { type: String, required: true }, // x402 receipt
  created_at: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  wallet_address: { type: String, required: true, unique: true },
  courtney_reports: [reportSchema],
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);