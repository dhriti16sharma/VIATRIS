const Appointment = require("../models/Appointment");

// CREATE APPOINTMENT
exports.createAppointment = async (req, res) => {
  try {

    const last = await Appointment.findOne().sort({ token: -1 });

    let token = 1;
    if (last) token = last.token + 1;

    const appointment = new Appointment({
      ...req.body,
      token
    });

    await appointment.save();

    res.json({
      message: "Appointment booked",
      token
    });

  } catch (err) {
    res.status(500).json(err);
  }
};

// GET ALL
exports.getAppointments = async (req, res) => {
  try {
    const data = await Appointment.find().sort({ token: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
};

// UPDATE
exports.updateAppointment = async (req, res) => {
  try {
    const data = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
};

// DELETE
exports.deleteAppointment = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};