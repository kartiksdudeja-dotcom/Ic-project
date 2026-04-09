const { spawn }      = require('child_process');
const express        = require('express');
const cors           = require('cors');
const morgan         = require('morgan');
const compression    = require('compression');
const cluster        = require('cluster');
const os             = require('os');
const path           = require('path');
const https          = require('https');
const connectDB      = require('./config/db');
require('dotenv').config();
const admin          = require('firebase-admin');

// ─── Firebase Admin Init ──────────────────────────────────────────────────
try {
  const serviceAccount = require('./icontower-a56b0-firebase-adminsdk-fbsvc-b277c3a245.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('🔥 Firebase Admin Initialized');
} catch (err) {
  console.error('❌ Firebase Admin Init Error:', err.message);
}

// ─── Routes ──────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const violationRoutes  = require('./routes/violations');
const vehicleRoutes    = require('./routes/vehicles');
const statsRoutes      = require('./routes/stats');
const taskRoutes       = require('./routes/tasks');
const checklistRoutes  = require('./routes/checklist');
const expenseRoutes    = require('./routes/expenses');


// ─── Connect to MongoDB ───────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(compression()); // Compress all responses for speed
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));


// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/violations',  violationRoutes);
app.use('/api/vehicles',    vehicleRoutes);
app.use('/api/stats',       statsRoutes);
app.use('/api/tasks',       taskRoutes);
app.use('/api/checklist',   checklistRoutes);
app.use('/api/expenses',    expenseRoutes);

// ─── Frontend Build Serving (Production Only) ─────────────────────────────
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
if (process.env.NODE_ENV === 'production' || true) { // Defaulting for easier Render setup
  app.use(express.static(frontendBuildPath));
}

// ─── Root Info & Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.status(200).send('OK'));

// ─── Catch-all (Serve Frontend index.html for React Routing) ─────────────
app.get('*', (req, res) => {
  // If it's an API route we missed, return 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Route not found' });
  }
  // Otherwise, serve the frontend
  const indexFile = path.join(frontendBuildPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      // Fallback if frontend isn't built yet
      res.status(200).json({ status: 'running', message: 'Icon Tower API live (Frontend build pending)' });
    }
  });
});

// ─── Global error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// ─── Self-Ping Keep-Alive (Render Free Tier) ─────────────────────────────
const RENDER_URL = process.env.RENDER_URL || ''; 
function startKeepAlive() {
  if (!RENDER_URL) return;
  const pingInterval = 5 * 60 * 1000;
  setInterval(() => {
    https.get(`${RENDER_URL}/health`, (res) => {
      console.log(`[Keep-Alive] Ping OK – status ${res.statusCode}`);
    }).on('error', (err) => {
      console.warn(`[Keep-Alive] Ping failed – ${err.message}`);
    });
  }, pingInterval);
}

// ─── Start server ONLY AFTER DB CONNECTS ──────────────────────────────
const PORT = process.env.PORT || 5000;
function startServer(dbStatus) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 ICON TOWER SERVER READY (PORT ${PORT})`);
    console.log(`📡 DB: ${dbStatus}`);
    
    
    // Start self-ping after 30s
    setTimeout(startKeepAlive, 30000);
  });
}

// ─── Cluster Lifecycle & DB Init ──────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`\n💎 MASTER CLUSTER STARTED. Forking for ${numCPUs} CPUs...`);
  console.log(`⚡ LOAD BALANCING ACTIVE`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Reviving...`);
    cluster.fork();
  });
} else {
  // WORKER PROCESS (In production) OR SINGLE PROCESS (In development)
  connectDB()
    .then(() => {
        const msg = isProduction ? `Online (Worker ${process.pid})` : 'Online';
        startServer(msg);
    })
    .catch(() => startServer(`Offline – Local DB Fallback Active`));
}
