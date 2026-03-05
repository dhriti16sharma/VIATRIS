const express = require("express");
const router = express.Router();

const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment
} = require("../controllers/appointmentController");

// CREATE
router.post("/", createAppointment);

// READ
router.get("/", getAppointments);

// UPDATE
router.put("/:id", updateAppointment);

// DELETE
router.delete("/:id", deleteAppointment);

module.exports = router;