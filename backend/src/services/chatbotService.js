// AI Chatbot Service - Rule-based (No API Key Needed)
// Features:
// 1. Recommend doctor by symptoms
// 2. Suggest OTC medications
// 3. Explain medical terminology

class ChatbotService {
  
  // Feature 1: Recommend doctor by symptoms
  recommendDoctor(symptoms) {
    const symptomsList = symptoms.toLowerCase();
    
    // Heart-related symptoms → Cardiologist
    if (symptomsList.includes('chest pain') || 
        symptomsList.includes('heart') || 
        symptomsList.includes('palpitations') ||
        symptomsList.includes('shortness of breath') ||
        symptomsList.includes('irregular heartbeat')) {
      return {
        specialization: 'Cardiologist',
        reason: 'Heart and cardiovascular issues',
        urgency: 'HIGH - Please seek immediate medical attention',
        explanation: 'Your symptoms suggest a potential heart-related issue. A cardiologist specializes in diagnosing and treating heart conditions.'
      };
    }
    
    // Skin-related → Dermatologist
    if (symptomsList.includes('rash') || 
        symptomsList.includes('acne') || 
        symptomsList.includes('skin') ||
        symptomsList.includes('itching') ||
        symptomsList.includes('eczema') ||
        symptomsList.includes('psoriasis')) {
      return {
        specialization: 'Dermatologist',
        reason: 'Skin and hair issues',
        urgency: 'MEDIUM',
        explanation: 'Your symptoms are related to skin conditions. A dermatologist can diagnose and treat various skin, hair, and nail problems.'
      };
    }
    
    // Bone/Joint → Orthopedist
    if (symptomsList.includes('joint pain') || 
        symptomsList.includes('bone') || 
        symptomsList.includes('fracture') ||
        symptomsList.includes('arthritis') ||
        symptomsList.includes('back pain') ||
        symptomsList.includes('knee pain')) {
      return {
        specialization: 'Orthopedist',
        reason: 'Bone, joint, and muscle problems',
        urgency: 'MEDIUM',
        explanation: 'Your symptoms indicate musculoskeletal issues. An orthopedist specializes in bones, joints, ligaments, and muscles.'
      };
    }
    
    // Child-related → Pediatrician
    if (symptomsList.includes('child') || 
        symptomsList.includes('baby') || 
        symptomsList.includes('infant') ||
        symptomsList.includes('kid')) {
      return {
        specialization: 'Pediatrician',
        reason: 'Child healthcare',
        urgency: 'VARIES',
        explanation: 'For children, a pediatrician is the best choice as they specialize in child health and development.'
      };
    }
    
    // General symptoms → General Physician
    return {
      specialization: 'General Physician',
      reason: 'General health concerns',
      urgency: 'MEDIUM',
      explanation: 'For your symptoms, start with a General Physician who can diagnose and treat common conditions or refer you to a specialist if needed.'
    };
  }
  
  // Feature 2: OTC Medication Suggestions
  suggestOTCMedication(condition) {
    const conditionLower = condition.toLowerCase();
    
    const medications = {
      // Pain & Fever
      'fever': {
        medications: ['Paracetamol 500mg', 'Ibuprofen 400mg'],
        dosage: 'Adults: 1-2 tablets every 4-6 hours (max 8 tablets/day)',
        precautions: 'Take with food. Do not exceed recommended dose. Not for children under 12 without doctor advice.',
        whenToSeekHelp: 'If fever persists for more than 3 days or exceeds 103°F (39.4°C)'
      },
      'headache': {
        medications: ['Paracetamol 500mg', 'Aspirin 300mg'],
        dosage: 'Adults: 1-2 tablets every 4-6 hours as needed',
        precautions: 'Drink plenty of water. Rest in a quiet, dark room.',
        whenToSeekHelp: 'Severe headache with stiff neck, confusion, or vision changes'
      },
      'body pain': {
        medications: ['Ibuprofen 400mg', 'Diclofenac gel (topical)'],
        dosage: 'Oral: 1 tablet 2-3 times daily. Gel: Apply to affected area 3-4 times daily',
        precautions: 'Take with food to avoid stomach upset.',
        whenToSeekHelp: 'Pain persists for more than a week or worsens'
      },
      
      // Cold & Flu
      'cold': {
        medications: ['Cetirizine 10mg', 'Paracetamol 500mg', 'Vitamin C tablets'],
        dosage: 'Cetirizine: 1 tablet once daily. Paracetamol: As needed for fever',
        precautions: 'Rest well, drink warm fluids, gargle with salt water.',
        whenToSeekHelp: 'Difficulty breathing, high fever, or symptoms last more than 10 days'
      },
      'cough': {
        medications: ['Cough syrup (Dextromethorphan)', 'Lozenges', 'Honey with warm water'],
        dosage: 'Syrup: 10ml 3 times daily. Lozenges: As needed',
        precautions: 'Stay hydrated. Avoid cold drinks.',
        whenToSeekHelp: 'Coughing up blood, severe chest pain, or persistent cough for 3+ weeks'
      },
      'sore throat': {
        medications: ['Throat lozenges', 'Paracetamol 500mg', 'Salt water gargle'],
        dosage: 'Lozenges: Every 2-3 hours. Gargle: 3-4 times daily',
        precautions: 'Drink warm liquids. Avoid smoking.',
        whenToSeekHelp: 'Difficulty swallowing, breathing problems, or high fever'
      },
      
      // Digestive Issues
      'acidity': {
        medications: ['Antacid tablets (Digene)', 'Ranitidine 150mg', 'Omeprazole 20mg'],
        dosage: 'Antacids: 1-2 tablets as needed. Ranitidine: 1 tablet twice daily',
        precautions: 'Avoid spicy foods, caffeine, and alcohol. Eat small meals.',
        whenToSeekHelp: 'Severe stomach pain, vomiting blood, or black stools'
      },
      'constipation': {
        medications: ['Isabgol (Psyllium husk)', 'Lactulose syrup', 'Glycerin suppository'],
        dosage: 'Isabgol: 2 teaspoons with water at bedtime',
        precautions: 'Drink 8-10 glasses of water daily. Increase fiber intake.',
        whenToSeekHelp: 'No bowel movement for more than 3 days, severe pain, or blood in stool'
      },
      'diarrhea': {
        medications: ['ORS (Oral Rehydration Solution)', 'Loperamide 2mg'],
        dosage: 'ORS: After each loose stool. Loperamide: 2 tablets initially, then 1 after each loose stool',
        precautions: 'Stay hydrated! Avoid dairy, fatty foods.',
        whenToSeekHelp: 'Blood in stool, severe dehydration, high fever, or lasts more than 2 days'
      },
      
      // Skin Issues
      'rash': {
        medications: ['Calamine lotion', 'Antihistamine cream', 'Cetirizine 10mg'],
        dosage: 'Apply lotion/cream 3-4 times daily. Cetirizine: 1 tablet once daily',
        precautions: 'Avoid scratching. Keep area clean and dry.',
        whenToSeekHelp: 'Rash spreads rapidly, severe swelling, or difficulty breathing'
      },
      'burn': {
        medications: ['Burn gel (Silver Sulfadiazine)', 'Antiseptic cream'],
        dosage: 'Apply gently to affected area 2-3 times daily',
        precautions: 'Cool the burn with running water first. Do not apply ice directly.',
        whenToSeekHelp: 'Burns larger than palm size, on face/joints, or severe blistering'
      }
    };
    
    // Find matching condition
    for (const [key, value] of Object.entries(medications)) {
      if (conditionLower.includes(key)) {
        return {
          condition: key,
          ...value,
          disclaimer: '⚠️ IMPORTANT: These are general suggestions only. Always read medicine labels and consult a pharmacist or doctor if symptoms persist or worsen.'
        };
      }
    }
    
    return {
      condition: 'Not found',
      message: 'I don\'t have specific OTC medication information for this condition. Please describe your symptoms (like fever, headache, cough, etc.) or consult a pharmacist.',
      disclaimer: 'For safety, always consult a healthcare professional before taking any medication.'
    };
  }
  
  // Feature 3: Explain Medical Terminology
  explainTerm(term) {
    const termLower = term.toLowerCase().trim();
    
    const medicalTerms = {
      // Common Prescription Terms
      'bid': {
        meaning: 'Twice a day',
        latinFull: 'Bis in die',
        explanation: 'Take the medication two times per day, usually morning and evening.',
        example: 'Take 1 tablet BID = Take 1 tablet in morning and 1 tablet in evening'
      },
      'tid': {
        meaning: 'Three times a day',
        latinFull: 'Ter in die',
        explanation: 'Take the medication three times per day, typically morning, afternoon, and evening.',
        example: 'Take 1 tablet TID = Take 1 tablet morning, afternoon, and evening'
      },
      'qid': {
        meaning: 'Four times a day',
        latinFull: 'Quater in die',
        explanation: 'Take the medication four times per day, approximately every 6 hours.',
        example: 'Take 1 tablet QID = Take 1 tablet every 6 hours'
      },
      'od': {
        meaning: 'Once a day',
        latinFull: 'Omne in die',
        explanation: 'Take the medication once per day, preferably at the same time each day.',
        example: 'Take 1 tablet OD = Take 1 tablet once daily'
      },
      'hs': {
        meaning: 'At bedtime',
        latinFull: 'Hora somni',
        explanation: 'Take the medication before going to bed at night.',
        example: 'Take 1 tablet HS = Take 1 tablet before sleeping'
      },
      'prn': {
        meaning: 'As needed',
        latinFull: 'Pro re nata',
        explanation: 'Take the medication only when needed, not on a regular schedule.',
        example: 'Take 1 tablet PRN for pain = Take 1 tablet when you have pain'
      },
      'ac': {
        meaning: 'Before meals',
        latinFull: 'Ante cibum',
        explanation: 'Take the medication before eating food.',
        example: 'Take 1 tablet AC = Take 1 tablet 30 minutes before meals'
      },
      'pc': {
        meaning: 'After meals',
        latinFull: 'Post cibum',
        explanation: 'Take the medication after eating food.',
        example: 'Take 1 tablet PC = Take 1 tablet after eating'
      },
      'stat': {
        meaning: 'Immediately',
        latinFull: 'Statim',
        explanation: 'Take the medication right away, without delay.',
        example: 'Give injection STAT = Give injection immediately'
      },
      'sos': {
        meaning: 'If necessary / Emergency',
        latinFull: 'Si opus sit',
        explanation: 'Take only if required in emergency situations.',
        example: 'Keep tablet SOS = Use only in emergency'
      },
      
      // Medical Conditions
      'hypertension': {
        meaning: 'High blood pressure',
        explanation: 'A condition where blood pressure in arteries is consistently too high.',
        normalRange: 'Normal: 120/80 mmHg. High: Above 140/90 mmHg',
        treatment: 'Controlled with lifestyle changes and medication'
      },
      'diabetes': {
        meaning: 'High blood sugar',
        explanation: 'A condition where body cannot properly process glucose (sugar).',
        types: 'Type 1 (insulin-dependent), Type 2 (lifestyle-related)',
        treatment: 'Managed with diet, exercise, and medication/insulin'
      },
      'antibiotic': {
        meaning: 'Medicine that kills bacteria',
        explanation: 'Used to treat bacterial infections. Does NOT work on viruses like cold/flu.',
        important: 'Always complete the full course even if you feel better!',
        examples: 'Amoxicillin, Azithromycin, Ciprofloxacin'
      },
      'analgesic': {
        meaning: 'Pain reliever',
        explanation: 'Medication used to reduce or eliminate pain.',
        examples: 'Paracetamol, Ibuprofen, Aspirin',
        types: 'Non-narcotic (mild pain) and narcotic (severe pain)'
      },
      'antipyretic': {
        meaning: 'Fever reducer',
        explanation: 'Medication that reduces body temperature and fever.',
        examples: 'Paracetamol, Ibuprofen',
        note: 'Many pain relievers also reduce fever'
      },
      
      // Dosage Terms
      'mg': {
        meaning: 'Milligram',
        explanation: 'Unit of measurement for medication dosage. 1000 mg = 1 gram',
        example: 'Paracetamol 500mg means 500 milligrams per tablet'
      },
      'ml': {
        meaning: 'Milliliter',
        explanation: 'Unit of measurement for liquid medicines. 1000 ml = 1 liter',
        example: 'Cough syrup 5ml means one teaspoon'
      },
      'tablet': {
        meaning: 'Solid pill form',
        explanation: 'Medicine compressed into a solid pill shape.',
        howToTake: 'Swallow whole with water unless specified otherwise'
      },
      'capsule': {
        meaning: 'Medicine in a gelatin shell',
        explanation: 'Medicine powder or liquid enclosed in a dissolvable shell.',
        howToTake: 'Swallow whole, do not open or chew'
      },
      'syrup': {
        meaning: 'Liquid medicine',
        explanation: 'Medicine in liquid form, often sweetened.',
        howToTake: 'Measure with provided cup/spoon, shake well before use'
      },
      
      // Common Medical Tests
      'bp': {
        meaning: 'Blood Pressure',
        explanation: 'Measures the force of blood against artery walls.',
        normalRange: '120/80 mmHg (systolic/diastolic)',
        why: 'Monitors heart health and detects hypertension'
      },
      'ecg': {
        meaning: 'Electrocardiogram',
        explanation: 'Test that records electrical activity of the heart.',
        purpose: 'Detects irregular heartbeats, heart attacks, heart problems',
        procedure: 'Painless test with electrodes on chest'
      },
      'mri': {
        meaning: 'Magnetic Resonance Imaging',
        explanation: 'Detailed images of organs and tissues using magnetic fields.',
        purpose: 'Diagnoses brain, spine, joint, and organ problems',
        note: 'No radiation involved, but claustrophobia possible'
      },
      'ct scan': {
        meaning: 'Computed Tomography',
        explanation: 'Detailed X-ray images from multiple angles.',
        purpose: 'Diagnoses injuries, tumors, infections',
        note: 'Uses radiation, but very detailed images'
      }
    };
    
    // Search for term
    for (const [key, value] of Object.entries(medicalTerms)) {
      if (termLower.includes(key) || key.includes(termLower)) {
        return {
          term: key.toUpperCase(),
          ...value,
          disclaimer: 'This is for educational purposes. Always consult your doctor for medical advice.'
        };
      }
    }
    
    return {
      term: term,
      message: 'I don\'t have information about this term. Try common terms like: BID, TID, OD, AC, PC, PRN, STAT, antibiotic, analgesic, hypertension, diabetes, etc.',
      suggestion: 'You can also ask your doctor or pharmacist to explain any terms on your prescription.'
    };
  }
  
  // Main chat function
  processMessage(message) {
    const msgLower = message.toLowerCase();
    
    // Detect intent
    if (msgLower.includes('symptom') || msgLower.includes('doctor') || msgLower.includes('specialist')) {
      const recommendation = this.recommendDoctor(message);
      return {
        type: 'doctor_recommendation',
        data: recommendation,
        response: `Based on your symptoms, I recommend seeing a **${recommendation.specialization}**.\n\n**Reason:** ${recommendation.reason}\n\n**Urgency:** ${recommendation.urgency}\n\n**Explanation:** ${recommendation.explanation}\n\n⚠️ If you experience severe symptoms, seek immediate medical attention.`
      };
    }
    
    if (msgLower.includes('medicine') || msgLower.includes('medication') || msgLower.includes('tablet') || msgLower.includes('what can i take')) {
      const suggestion = this.suggestOTCMedication(message);
      
      if (suggestion.medications) {
        return {
          type: 'otc_medication',
          data: suggestion,
          response: `**For ${suggestion.condition}:**\n\n**Suggested OTC Medications:**\n${suggestion.medications.map(m => `• ${m}`).join('\n')}\n\n**Dosage:** ${suggestion.dosage}\n\n**Precautions:** ${suggestion.precautions}\n\n**When to see a doctor:** ${suggestion.whenToSeekHelp}\n\n${suggestion.disclaimer}`
        };
      } else {
        return {
          type: 'otc_medication',
          data: suggestion,
          response: suggestion.message + '\n\n' + suggestion.disclaimer
        };
      }
    }
    
    if (msgLower.includes('what does') || msgLower.includes('what is') || msgLower.includes('meaning') || msgLower.includes('explain')) {
      // Extract term (try to find medical term in message)
      const words = message.split(' ');
      const term = words[words.length - 1].replace(/[?!.,]/g, '');
      
      const explanation = this.explainTerm(term);
      
      if (explanation.meaning) {
        let response = `**${explanation.term}**\n\n**Meaning:** ${explanation.meaning}`;
        if (explanation.latinFull) response += `\n\n**Latin:** ${explanation.latinFull}`;
        if (explanation.explanation) response += `\n\n**Explanation:** ${explanation.explanation}`;
        if (explanation.example) response += `\n\n**Example:** ${explanation.example}`;
        if (explanation.normalRange) response += `\n\n**Normal Range:** ${explanation.normalRange}`;
        if (explanation.examples) response += `\n\n**Examples:** ${explanation.examples}`;
        if (explanation.disclaimer) response += `\n\n${explanation.disclaimer}`;
        
        return {
          type: 'term_explanation',
          data: explanation,
          response: response
        };
      } else {
        return {
          type: 'term_explanation',
          data: explanation,
          response: explanation.message + '\n\n' + explanation.suggestion
        };
      }
    }
    
    // Default helpful response
    return {
      type: 'general',
      response: `👋 Hello! I'm your AI Health Assistant. I can help you with:\n\n1️⃣ **Find the right doctor** - Tell me your symptoms\n2️⃣ **OTC medications** - Ask "what medicine for headache/fever/cough?"\n3️⃣ **Explain medical terms** - Ask "what does BID mean?" or "explain hypertension"\n\nHow can I assist you today?`
    };
  }
}

module.exports = new ChatbotService();
