const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  admissionLetter: {
    type: String,
    required: true
  },
  nationalID: {
    type: String,
    required: true
  },
  kcseCertificate: {
    type: String,
    required: true
  },
  leavingCertificate: {
    type: String,
    required: true
  },
  birthCertificate: {
    type: String,
    required: true
  }
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
