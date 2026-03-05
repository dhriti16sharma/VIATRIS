const path = require("path");
const fs = require("fs");

// load datasets
const diseaseSymptoms = require("../../Data/DiseaseAndSymptoms.json");
const diseaseDescriptions = require("../../Data/Disease_Description.json");
const precautions = require("../../Data/Disease_precaution.json");
const doctorSpecialists = require("../../Data/Doctor_Specialist.json");
const symptomWeights = require("../../Data/Symptom_Weights.json");

function predictDisease(symptoms) {

    let diseaseScores = {};

    symptoms.forEach(symptom => {

        diseaseSymptoms.forEach(disease => {

            if(disease.symptoms.includes(symptom)){

                if(!diseaseScores[disease.disease]){
                    diseaseScores[disease.disease] = 0;
                }

                diseaseScores[disease.disease] += 1;

            }

        });

    });

    let predicted = Object.keys(diseaseScores)
        .sort((a,b) => diseaseScores[b] - diseaseScores[a])[0];

    return predicted;

}


function getDiseaseInfo(disease){

    return {
        description: diseaseDescriptions[disease] || "No description available",
        precautions: precautions[disease] || []
    };

}

function recommendDoctor(disease){

    return doctorSpecialists[disease] || "General Physician";

}

module.exports = {
    predictDisease,
    getDiseaseInfo,
    recommendDoctor
};

