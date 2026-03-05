const express = require("express");
const router = express.Router();

const medicalAI = require("../ai/medicalAI");

router.post("/diagnose", (req,res)=>{

    const { symptoms } = req.body;

    const disease = medicalAI.predictDisease(symptoms);

    const info = medicalAI.getDiseaseInfo(disease);

    const doctor = medicalAI.recommendDoctor(disease);

    res.json({
        disease,
        doctor,
        description: info.description,
        precautions: info.precautions
    });

});

module.exports = router;