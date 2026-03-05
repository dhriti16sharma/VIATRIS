const mongoose = require("mongoose");
const fs = require("fs");

const Doctor = require("../src/models/Doctor");

mongoose.connect("mongodb://localhost:27017/healthcare");

const doctors = JSON.parse(
  fs.readFileSync("./data/doctors.json")
);

async function importDoctors() {
  await Doctor.deleteMany();
  await Doctor.insertMany(doctors);
  console.log("Doctors imported");
  process.exit();
}

importDoctors();