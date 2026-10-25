import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { authRouter } from './routes/auth';
import { campaignsRouter } from './routes/campaigns';
import { studentsRouter } from './routes/students';
import { salesRouter } from './routes/sales';
import { summaryRouter } from './routes/summary';
import { reportsRouter } from './routes/reports';
import { usersRouter } from './routes/users';
import { auditRouter } from './routes/audit';
import { campsRouter } from './routes/camps';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Calendar Sales Management System',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api', studentsRouter);
app.use('/api', salesRouter);
app.use('/api', summaryRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api', campsRouter);

// Serve frontend static assets in production
const possiblePaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
];
const clientDistPath = possiblePaths.find((p) => fs.existsSync(p));
if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: err.message || 'ഒരു ആന്തരിക സാങ്കേതിക തകരാർ സംഭവിച്ചു (Internal Server Error)',
  });
});

app.listen(config.port, () => {
  console.log(`🚀 Calendar Sales Server running on port ${config.port}`);
});

export default app;
