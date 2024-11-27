// models/Institution.js
const mongoose = require("mongoose");

const InstitutionSchema = new mongoose.Schema(
  {
    id_institution: { type: String, required: true },
    institution_desc: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Institution", InstitutionSchema);
