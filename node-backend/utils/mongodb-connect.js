import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/courtney-ai';

if (!process.env.MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not set in .env, using default: mongodb://localhost:27017/courtney-ai');
}

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✓ MongoDB connected successfully');
})
.catch((err) => {
  console.error('✗ MongoDB connection error:', err.message);
  console.error('  Make sure MongoDB is running or MONGODB_URI is correctly set in .env');
  process.exit(1); // Exit if MongoDB connection fails
});

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✓ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('✗ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

export default mongoose.connection;