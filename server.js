const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Middleware
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({ error: 'Invalid JSON' });
        }
    }
}));
app.use(bodyParser.urlencoded({ extended: false }));
const PORT = process.env.PORT || 10000;

app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
    
}));

app.use(express.static('assets'));
app.set('view engine', 'ejs');
app.use('/assets', express.static('assets'));

app.use('/jobuploads', express.static(path.join(__dirname, 'jobuploads')));
app.use(express.static('uploads'));
app.use(express.static('node_modules'));

// Middleware to protect admin routes
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user === adminUser.username) {
        return next();
    } else {
        // Save the original requested URL for redirect after login
        req.session.originalUrl = req.originalUrl;
        res.redirect('/login');
    }
}

// Render Pages
app.get('/', (req, res) => {
    res.render("index.ejs");
});
app.get('/aboutus', (req, res) => {
    res.render("aboutus.ejs");
});
app.get('/contact', (req, res) => {
    res.render("contact.ejs");
});
app.get('/admin', isAuthenticated, (req, res) => {
    res.render('admin.ejs');
});
app.get('/jobs', (req, res) => {
    res.render('jobs.ejs');
});
app.get('/register', (req, res) => {
    res.render("register.ejs");
});
app.get('/registerconfirmation', (req, res) => {
    res.render("registerconfirmation.ejs");
});
app.get('/health', (req, res) => {
    res.send("testing frontend");
});
app.get('/trainers', (req, res) => {
    res.render("trainers.ejs");
});
app.get('/gallery', (req, res) => {
    res.render("gallery.ejs");
});
app.get('/students', (req, res) => {
    res.render("students.ejs");
});
app.get('/login', (req, res) => {
    res.render("login.ejs");
});
app.get('/facilities', (req, res) => {
    res.render("facilities.ejs");
});
app.get('/agriculture', (req, res) => {
    res.render("agriculture.ejs");
});

// Set up multer storage for registration file uploads
const storageRegistration = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Folder where files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // Keep original file name
    }
});

const uploadRegistration = multer({ storage: storageRegistration });

// Set up multer storage for job file uploads
const storageJobs = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'jobuploads/') // Folder where job files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) // Keep original file name
    }
});

const uploadJobs = multer({ storage: storageJobs });

// Handle POST request for registration form
app.post('/register', uploadRegistration.fields([
    { name: 'admissionLetter', maxCount: 1 },
    { name: 'nationalID', maxCount: 1 },
    { name: 'kcseCertificate', maxCount: 1 },
    { name: 'leavingCertificate', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, email } = req.body;
        const files = req.files;

        // Simulate successful registration
        console.log("Registration data:", { name, email, files });

        // Send email notification to user
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ttcmwencha@gmail.com',
                pass: 'cdddmdbbjnvxhvsf'
            }
        });

        const mailOptionsToUser = {
            from: 'ttcmwencha@gmail.com',
            to: email,
            subject: 'Registration Successful',
            text: "Thank you for registering with Mwencha TTC. Please note that you need to pay Ksh1000 unrefundable registration fee with Paybill 124536. Please forward the M-Pesa message to ttcmwencha@gmail.com for confirmation."
        };

        transporter.sendMail(mailOptionsToUser, (error, info) => {
            if (error) {
                console.log('Error sending email to user:', error);
            } else {
                console.log('Email sent to user:', info.response);
            }
        });

        // Send email with attachments to ttcmwencha@gmail.com
        const mailOptionsToTTC = {
            from: email,
            to: 'ttcmwencha@gmail.com',
            subject: 'New Registration',
            text: `A new registration has been submitted by ${name} email address ${email}`,
            attachments: [
                { filename: 'admissionLetter.pdf', path: files.admissionLetter[0].path },
                { filename: 'nationalID.pdf', path: files.nationalID[0].path },
                { filename: 'kcseCertificate.pdf', path: files.kcseCertificate[0].path },
                { filename: 'leavingCertificate.pdf', path: files.leavingCertificate[0].path },
                { filename: 'birthCertificate.pdf', path: files.birthCertificate[0].path }
            ]
        };

        transporter.sendMail(mailOptionsToTTC, (error, info) => {
            if (error) {
                console.log('Error sending email to TTC:', error);
            } else {
                console.log('Email sent to TTC:', info.response);
            }
        });

        res.render('registerconfirmation.ejs');
    } catch (error) {
        console.error('Error processing registration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ttcmwencha@gmail.com',
        pass: 'cdddmdbbjnvxhvsf'
    }
});

app.post('/contactform', async (req, res) => {
    try {
        // Extract data from the request body
        const { name, email, subject, message } = req.body;

        // Simulate successful contact form submission
        console.log("Contact form data:", { name, email, subject, message });

        let mailOptions = {
            from: `"${name}" <${email}>`,
            to: 'ttcmwencha@gmail.com',
            subject: subject,
            text: message
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log('Email sent:', info.response);
                res.render('contact.ejs', { successMessage: 'Your message has been sent. Thank you!' });
            }
        });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Admin protection
const adminUser = {
    username: 'admin',
    password: 'Kacharas2024' // In a real application, use hashed passwords
};

// Middleware to protect admin routes
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user === adminUser.username) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Route to display login form
app.get('/login', (req, res) => {
    res.render('login.ejs');
});

// Route to handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === adminUser.username && password === adminUser.password) {
        req.session.user = adminUser.username;
        
        // Redirect to original requested URL after login
        const redirectTo = req.session.originalUrl || '/admin';
        delete req.session.originalUrl;
        
        res.redirect(redirectTo);
    } else {
        res.send('Invalid credentials');
    }
});

// Route to handle logout
// Route to handle logout (both GET and POST)
app.all('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Unable to log out');
        } else {
            res.redirect('/');
        }
    });
});

// Protect admin routes
app.get('/admin', isAuthenticated, (req, res) => {
    res.render('admin.ejs');
});

// Load existing jobs from JSON file
let jobs = [];
const jobsFilePath = path.join(__dirname, 'jobs.json');

if (fs.existsSync(jobsFilePath)) {
    const data = fs.readFileSync(jobsFilePath);
    jobs = JSON.parse(data);
}

// Route to add job
app.post('/add-job', isAuthenticated, uploadJobs.fields([{ name: 'jobImage' }, { name: 'jobPDF' }]), (req, res) => {
    const newJob = {
        id: Date.now(),
        title: req.body.jobTitle,
        category: req.body.jobCategory,
        description: req.body.jobDescription,
        requirements: req.body.jobRequirements,
        location: req.body.jobLocation,
        salary: req.body.jobSalary,
        image: req.files['jobImage'] ? req.files['jobImage'][0].path : null,
        pdf: req.files['jobPDF'] ? req.files['jobPDF'][0].path : null
    };

    jobs.push(newJob);
    fs.writeFileSync(jobsFilePath, JSON.stringify(jobs, null, 2));

    res.send('Job listing added successfully!');
});

// Route to get all jobs
app.get('/get-jobs', (req, res) => {
    res.json(jobs);
});

// Route to delete job by ID
app.delete('/delete-job/:id', isAuthenticated, (req, res) => {
    const jobId = parseInt(req.params.id, 10);
    jobs = jobs.filter(job => job.id !== jobId);
    fs.writeFileSync(jobsFilePath, JSON.stringify(jobs, null, 2));
    res.send('Job listing deleted successfully!');
});

// Start server
app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}`);
});
