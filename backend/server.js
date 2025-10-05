import express from 'express';
import cors from 'cors';
import { assignmentsRouter } from './src/routes/assignments.js';
import { brigadiersRouter } from './src/routes/brigadiers.js';
import { availabilityRouter } from './src/routes/availability.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/assignments', assignmentsRouter);
app.use('/api/brigadiers', brigadiersRouter);
app.use('/api/availability', availabilityRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend server is running!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
