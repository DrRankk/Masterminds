const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 10000;

// Ensure the assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// MongoDB connection
mongoose.connect('mongodb+srv://Francis:Masterminds@masterminds.f4pkbdp.mongodb.net/?retryWrites=true&w=majority&appName=Masterminds', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.log('Failed to connect to MongoDB Atlas', err));

// Job Schema
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
app.use('/assets', express.static(assetsDir));
app.use(express.static('assets'));
app.use(express.static('public'));


app.use(session({
    secret: 'Kacharas2024', 
    resave: false,
    saveUninitialized: false
}));

function authenticate(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'assets/');
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

app.get('/jobdetails2', (req, res) => {
    res.render('jobdetails2.ejs');
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

app.get('/job/:id', async (req, res) => {
    const jobId = req.params.id;

    try {
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).send('Job not found');
        }
        res.render('jobdetails.ejs', { job });
    } catch (err) {
        res.status(500).send(err.message);
    }
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

// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'info@masterminds.co.ke', // Replace with your email
        pass: 'fzph mrsf htwu mzgy'  // Replace with your app password
    },
    port: 587,
    secure: false, // Set to true if using port 465
    tls: {
        rejectUnauthorized: false
    }
});

app.post('/apply', upload.fields([
    { name: 'passportFile', maxCount: 1 },
    { name: 'idFile', maxCount: 1 },
    { name: 'cvFile', maxCount: 1 },
    { name: 'additionalFiles', maxCount: 5 } // Allow up to 5 additional files
]), async (req, res) => {
    const { jobId, jobTitle, jobLocation, jobSalary, firstName, lastName, email, phone, passportNumber, nationalId, acceptStatement } = req.body;

    if (!acceptStatement) {
        return res.status(400).send('You must agree to apply.');
    }

    const mailOptions = {
        from: email, 
        to: 'info@masterminds.co.ke', 
        subject: `Job Application for ${jobTitle}`,
        text: `
            Job Title: ${jobTitle}
            Country: ${jobLocation}
            Salary: $${jobSalary}

            Applicant Details:
            Name: ${firstName} ${lastName}
            Email: ${email}
            Phone: ${phone}
            Passport Number: ${passportNumber}
            National ID: ${nationalId}
        `,
        attachments: [
            { filename: 'passport.pdf', path: req.files['passportFile'] ? req.files['passportFile'][0].path : '' },
            { filename: 'id.pdf', path: req.files['idFile'] ? req.files['idFile'][0].path : '' },
            { filename: 'cv.pdf', path: req.files['cvFile'] ? req.files['cvFile'][0].path : '' },
            ...(req.files['additionalFiles'] || []).map(file => ({ filename: file.originalname, path: file.path }))
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        res.send('Application submitted successfully!');
    } catch (err) {
        console.error('Error sending email:', err);
        res.status(500).send(`Error submitting application: ${err.message}`);
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
