const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

// Ensure the assets/uploads directory exists
const uploadsDir = path.join(__dirname, 'assets/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// MongoDB connection
mongoose.connect('mongodb+srv://Francis:Masterminds@masterminds.f4pkbdp.mongodb.net/?retryWrites=true&w=majority&appName=Masterminds', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.log('Failed to connect to MongoDB Atlas', err));

// Define Job Schema
const jobSchema = new mongoose.Schema({
    title: String,
    category: String,
    description: String,
    requirements: String,
    location: String,
    salary: Number,
    image: String,
    pdf: String
});

const Job = mongoose.model('Job', jobSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/assets/uploads', express.static(uploadsDir));
app.use(express.static('assets'));
app.use('/assets', express.static('assets'));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: 'your_secret_key_here', // Replace with a strong secret
    resave: false,
    saveUninitialized: false
}));

// Authentication middleware
function authenticate(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'assets/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
    res.render("index.ejs");
});

app.get('/aboutus', (req, res) => {
    res.render("aboutus.ejs");
});

app.get('/contact', (req, res) => {
    res.render("contact.ejs");
});

app.get('/admin', authenticate, (req, res) => {
    res.render('admin.ejs');
});

app.get('/jobs', async (req, res) => {
    try {
        const jobs = await Job.find();
        res.render('jobs.ejs', { jobs });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/portfolio', (req, res) => {
    res.render('portfolio.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'Kacharas2024') {
        req.session.authenticated = true;
        res.redirect('/admin');
    } else {
        res.render('login.ejs', { error: 'Invalid username or password' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

app.post('/add-job', upload.fields([{ name: 'jobImage', maxCount: 1 }, { name: 'jobPDF', maxCount: 1 }]), async (req, res) => {
    const { jobTitle, jobCategory, jobDescription, jobRequirements, jobLocation, jobSalary } = req.body;
    const jobImage = req.files['jobImage'] ? req.files['jobImage'][0].path : '';
    const jobPDF = req.files['jobPDF'] ? req.files['jobPDF'][0].path : '';

    const newJob = new Job({
        title: jobTitle,
        category: jobCategory,
        description: jobDescription,
        requirements: jobRequirements,
        location: jobLocation,
        salary: jobSalary,
        image: jobImage,
        pdf: jobPDF
    });

    try {
        await newJob.save();
        console.log(`Job saved: ${JSON.stringify(newJob)}`); // Log the saved job details
        res.render('admin.ejs', { successMessage: 'Job added successfully!' });
    } catch (err) {
        console.error('Error saving job:', err);
        res.status(500).send(err.message);
    }
});

app.get('/get-jobs', async (req, res) => {
    try {
        const jobs = await Job.find();
        res.json(jobs);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/delete-job/:id', async (req, res) => {
    const jobId = req.params.id;
    console.log(`Received job ID for deletion: ${jobId}`);

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).send('Invalid job ID');
    }

    try {
        const result = await Job.findByIdAndDelete(jobId);
        if (!result) {
            return res.status(404).send('Job not found');
        }
        res.send('Job deleted');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
