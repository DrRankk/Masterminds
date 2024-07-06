const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: Number, required: true },
    image: { type: String },
    pdf: { type: String },
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
