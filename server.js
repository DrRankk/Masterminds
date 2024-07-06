const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('assets'));
app.use('/assets', express.static('assets'));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
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

app.get('/admin', (req, res) => {
    res.render('admin.ejs');
});

app.get('/jobs', (req, res) => {
    res.render('jobs.ejs');
});

app.get('/portfolio', (req, res) => {
    res.render('portfolio.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
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
        res.redirect('/admin');
    } catch (err) {
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
    console.log(`Received job ID for deletion: ${jobId}`);  // Log the received job ID

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
