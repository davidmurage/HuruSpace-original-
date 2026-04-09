import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import placeRoutes from './routes/places.js';
import reservationRoutes from './routes/reservations.js';
import userRoutes from './routes/users.js';
import { uploadsStaticRoot } from './utils/upload.js';

const serverRoot = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(serverRoot, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsStaticRoot));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/users', userRoutes);

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.warn(' MONGODB_URI not found in environment variables');
      console.warn(' Running server without database connection');
      console.warn(' Please set up MongoDB Atlas or provide a valid MongoDB URI');
      return;
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.warn('Server running without database connection');
    console.warn(' To fix this:');
    console.warn('   1. Create a MongoDB Atlas account at https://www.mongodb.com/atlas');
    console.warn('   2. Create a cluster and get your connection string');
    console.warn('   3. Create a .env file in the server directory');
    console.warn('   4. Add MONGODB_URI=your_connection_string to the .env file');
  }
};

// Connect to database
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
