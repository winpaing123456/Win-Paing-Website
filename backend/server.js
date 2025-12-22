
// Import required modules
import express from 'express';
import cors from 'cors';

import blogRoutes from './routes/blogRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the Express app
const app = express();

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

app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/projects', projectRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Backend running at port ' + PORT);
});
