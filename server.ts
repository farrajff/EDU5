import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize server-side global Firestore client
  let db: any = null;
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const firebaseApp = initializeApp(firebaseConfig);
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log('[Dev Server] Persistent cloud-powered Firebase Firestore initialized successfully.');
    } catch (e) {
      console.error('[Dev Server] Failed to initialize persistent Firestore db client:', e);
    }
  } else {
    console.warn('[Dev Server] firebase-applet-config.json not found in server root path. Persistent cloud Firestore will be bypassed.');
  }

  console.log('[Dev Server] Initiating server startup in standard Firebase Auth Proxy mode...');

  app.use(express.json());
  app.use(cookieParser());

  const getOAuthClient = (req: express.Request) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) {
      throw new Error('Not authenticated with Google');
    }
    const tokens = JSON.parse(tokensStr);
    const client = new OAuth2Client();
    client.setCredentials(tokens);
    return client;
  };

  // Auth Connection Routes
  app.post('/api/storage/connect', (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    const tokens = {
      access_token: accessToken,
      token_type: 'Bearer'
    };

    res.cookie('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({ success: true });
  });

  app.post('/api/storage/disconnect', (req, res) => {
    res.clearCookie('google_tokens', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    res.json({ success: true });
  });

  // Storage API Check
  app.get('/api/storage/check', (req, res) => {
    const tokens = req.cookies.google_tokens;
    res.json({ connected: !!tokens });
  });

  // Local File Cache Endpoints (allows any user, including students, to load/save without Drive/Google auth)
  const CACHE_FILE_PATH = path.join(__dirname, 'AcademicAtelierData.json');

  app.post('/api/storage/local-cache', async (req, res) => {
    try {
      const data = req.body;
      
      // 1. Write to local Cache File
      try {
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      } catch (err) {
        console.error('Local disk write failed:', err);
      }

      // 2. Write to Firebase Firestore (Global Cloud State - survives container restarts and releases)
      if (db) {
        try {
          await setDoc(doc(db, 'app_state', 'global_state'), {
            state: data,
            updatedAt: new Date().toISOString()
          });
          console.log('[Dev Server] Global state synced to Firebase Firestore.');
        } catch (dbErr) {
          console.error('[Dev Server] Failed to save to Firestore:', dbErr);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error writing to local cache:', error);
      res.status(500).json({ error: 'Failed to write cache' });
    }
  });

  app.get('/api/storage/local-cache', async (req, res) => {
    try {
      // 1. Try to load from Firebase Firestore first (survives container deployments, restores and resets)
      if (db) {
        try {
          const docRef = doc(db, 'app_state', 'global_state');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('[Dev Server] Loaded global state from Firebase Firestore.');
            
            // Sync it back to local disk as a background cache optimization
            try {
              fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data.state, null, 2), 'utf-8');
            } catch (err) {
              console.warn('Failed to sync Firestore back to local disk cache:', err);
            }
            
            return res.json(data.state);
          } else {
            console.warn('[Dev Server] Global state document does not exist in Firestore yet.');
          }
        } catch (dbErr) {
          console.error('[Dev Server] Failed to read from Firestore:', dbErr);
        }
      }

      // 2. Fallback to local file cache from disk
      if (fs.existsSync(CACHE_FILE_PATH)) {
        const fileContent = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
        console.log('[Dev Server] Loaded fallback state from local disk cache.');
        res.json(JSON.parse(fileContent));
      } else {
        res.status(404).json({ error: 'No cached data found' });
      }
    } catch (error) {
      console.error('Error reading from local cache:', error);
      res.status(500).json({ error: 'Failed to read cache' });
    }
  });

  app.post('/api/storage/sync', async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuthClient(req);
      client.setCredentials(tokens);
      
      const sheets = google.sheets({ version: 'v4', auth: client });
      const drive = google.drive({ version: 'v3', auth: client });

      // Logic to find or create the database spreadsheet
      const fileName = 'AcademicAtelierData.json';
      const response = await drive.files.list({
        q: `name = '${fileName}' and trashed = false`,
        fields: 'files(id, name)',
      });

      let fileId;
      if (response.data.files && response.data.files.length > 0) {
        fileId = response.data.files[0].id;
      }

      if (req.method === 'POST') {
        const data = req.body;
        
        // Update local cache and Firestore automatically for student portal fallback
        try {
          fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
          if (db) {
            await setDoc(doc(db, 'app_state', 'global_state'), {
              state: data,
              updatedAt: new Date().toISOString()
            });
            console.log('[Dev Server] Global state synced to Firestore during Google Drive sync.');
          }
        } catch (e) {
          console.error('Failed to update local cache during sync:', e);
        }

        const media = {
          mimeType: 'application/json',
          body: JSON.stringify(data),
        };

        if (fileId) {
          await drive.files.update({
            fileId: fileId,
            media: media,
          });
        } else {
          await drive.files.create({
            requestBody: {
              name: fileName,
              mimeType: 'application/json',
            },
            media: media,
          });
        }
        res.json({ success: true });
      }
    } catch (error) {
      console.error('Google Drive Sync Error:', error);
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  app.get('/api/storage/load', async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuthClient(req);
      client.setCredentials(tokens);
      const drive = google.drive({ version: 'v3', auth: client });

      const fileName = 'AcademicAtelierData.json';
      const listResponse = await drive.files.list({
        q: `name = '${fileName}' and trashed = false`,
        fields: 'files(id, name)',
      });

      if (listResponse.data.files && listResponse.data.files.length > 0) {
        const fileId = listResponse.data.files[0].id;
        const fileContent = await drive.files.get({
          fileId: fileId as string,
          alt: 'media',
        });
        res.json(fileContent.data);
      } else {
        res.json(null); // No file yet
      }
    } catch (error) {
      console.error('Google Drive Load Error:', error);
      res.status(500).json({ error: 'Load failed' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
