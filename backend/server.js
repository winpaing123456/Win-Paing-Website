// Import required modules
import express from 'express';
import cors from 'cors';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'Personal Web',
    password: process.env.PGPASSWORD || 'wipaing123',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
});
pool.on('connect', () => {
    console.log('✅ PostgreSQL connected');
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the Express app

const app = express();
// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is healthy' });
});

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Make sure uploads folders exist (for blog and projects images)
const uploadsRoot = path.join(__dirname, 'uploads');
const blogFolder = path.join(uploadsRoot, 'blog');
const projectsFolder = path.join(uploadsRoot, 'projects');
if (!fs.existsSync(blogFolder)) {
    fs.mkdirSync(blogFolder, { recursive: true });
}
if (!fs.existsSync(projectsFolder)) {
    fs.mkdirSync(projectsFolder, { recursive: true });
}

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// Set up API routes

// GET /api/projects - fetch all projects
app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Backend running at port ' + PORT);
});
