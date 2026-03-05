const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  email: String,
  address: String,
  specialization: String,
  preferredDate: String,
  tokenNumber: {
  type: Number,
  required: true
},
  token: Number,
  status:{
    type:String,
    default:"waiting"
  },
  prescription:String
},{timestamps:true});

module.exports = mongoose.model("Appointment", AppointmentSchema);

