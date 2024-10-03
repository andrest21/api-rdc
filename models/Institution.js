// models/Institution.js
const mongoose = require('mongoose');

const InstitutionSchema = new mongoose.Schema({
    institution: { type: String, required: true },
    date_created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Institution', InstitutionSchema);