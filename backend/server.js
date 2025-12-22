// Import required modules
import express from 'express';
import cors from 'cors';


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

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

// Multer setup for project images
const projectStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, projectsFolder);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'project-' + uniqueSuffix + ext);
    }
});
const uploadProjectImage = multer({ storage: projectStorage });

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


// POST /api/projects - create a new project (with optional image upload)
app.post('/api/projects', uploadProjectImage.single('image'), async (req, res) => {
    // If sent as multipart/form-data, fields are in req.body, file in req.file
    const { title, description, tech_stack, repo_url, live_url } = req.body;
    let image_url = null;
    if (req.file) {
        image_url = `/uploads/projects/${req.file.filename}`;
    } else if (req.body.image_url) {
        image_url = req.body.image_url;
    }
    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO projects (title, description, tech_stack, live_url, repo_url, image_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
            [title, description, tech_stack || null, live_url || null, repo_url || null, image_url || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});



// DELETE /api/projects/:id - delete a project by id
app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Project id is required' });
    }
    try {
        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Backend running at port ' + PORT);
});
