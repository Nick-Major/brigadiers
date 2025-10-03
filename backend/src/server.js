import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import assignmentsRouter from './routes/assignments.js';
import brigadiersRouter from './routes/brigadiers.js';
import availabilityRouter from './routes/availability.js'; // ← ДОБАВИТЬ ЭТУ СТРОЧКУ

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/assignments', assignmentsRouter);
app.use('/api/brigadiers', brigadiersRouter);
app.use('/api/availability', availabilityRouter); // ← ДОБАВИТЬ ЭТУ СТРОЧКУ

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
