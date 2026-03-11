const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  website: {
    type: String,
    required: false
  },
  logo: {
    type: String,
    required: false
  },
  contactPerson: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: false }
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
