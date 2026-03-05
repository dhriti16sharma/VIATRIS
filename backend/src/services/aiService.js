const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
  }

  async analyzeSymptoms(symptoms, patientHistory = '') {
    try {
      const prompt = `You are a medical AI assistant. Based on the following symptoms, provide:
1. Possible conditions (list 3-5 most likely)
2. Recommended medical specialization
3. Urgency level (low/medium/high)
4. General advice

Symptoms: ${symptoms.join(', ')}
${patientHistory ? `Patient History: ${patientHistory}` : ''}

Provide response in JSON format:
{
  "possibleConditions": ["condition1", "condition2"],
  "recommendedSpecialization": ["specialization1"],
  "urgencyLevel": "medium",
  "advice": "general advice here",
  "disclaimer": "This is AI-generated advice. Please consult a healthcare professional."
}`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI assistant. Provide helpful, accurate medical information while always emphasizing the importance of consulting healthcare professionals. Always respond in valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback response
      return {
        possibleConditions: ['Unable to analyze symptoms'],
        recommendedSpecialization: ['General Physician'],
        urgencyLevel: 'medium',
        advice: 'Please consult a healthcare professional for accurate diagnosis.',
        disclaimer: 'This is AI-generated advice. Please consult a healthcare professional.'
      };
    } catch (error) {
      console.error('AI Analysis Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async chatWithAI(userMessage, conversationHistory = []) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a helpful medical AI assistant. Provide accurate health information, answer questions about symptoms, medications, and general wellness. Always remind users to consult healthcare professionals for diagnosis and treatment. Be empathetic and clear.`
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.8,
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        message: response.data.choices[0].message.content,
        role: 'assistant'
      };
    } catch (error) {
      console.error('AI Chat Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async generatePrescriptionSuggestions(diagnosis, patientAge, allergies = []) {
    try {
      const prompt = `As a medical AI, suggest appropriate medications for the following:

Diagnosis: ${diagnosis}
Patient Age: ${patientAge}
Allergies: ${allergies.length > 0 ? allergies.join(', ') : 'None reported'}

Provide 3-5 medication suggestions with:
- Medication name (generic)
- Typical dosage
- Frequency
- Duration
- Important warnings

Format as JSON:
{
  "medications": [
    {
      "name": "medication name",
      "dosage": "dosage",
      "frequency": "frequency",
      "duration": "duration",
      "warnings": "warnings"
    }
  ],
  "disclaimer": "These are suggestions only. A licensed healthcare provider must review and approve all prescriptions."
}`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI assistant helping doctors with prescription suggestions. Always emphasize that final prescription decisions must be made by licensed healthcare providers.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.6,
          max_tokens: 400
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        medications: [],
        disclaimer: 'Unable to generate suggestions. Please prescribe based on clinical judgment.'
      };
    } catch (error) {
      console.error('AI Prescription Suggestion Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async analyzeMedicalReport(reportText) {
    try {
      const prompt = `Analyze this medical report and provide a simple summary:

${reportText}

Provide summary in JSON format:
{
  "keyFindings": ["finding1", "finding2"],
  "concerningValues": ["value1", "value2"],
  "recommendations": ["recommendation1"],
  "overallAssessment": "brief assessment"
}`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI assistant analyzing medical reports. Provide clear, understandable summaries.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 400
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        keyFindings: [],
        concerningValues: [],
        recommendations: [],
        overallAssessment: 'Report analysis unavailable'
      };
    } catch (error) {
      console.error('AI Report Analysis Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getHealthTips(category = 'general') {
    try {
      const prompt = `Provide 5 helpful health tips for: ${category}. Make them practical and easy to follow.`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a health and wellness AI assistant. Provide practical, evidence-based health tips.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        tips: response.data.choices[0].message.content.split('\n').filter(tip => tip.trim()),
        category: category
      };
    } catch (error) {
      console.error('AI Health Tips Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new AIService();
