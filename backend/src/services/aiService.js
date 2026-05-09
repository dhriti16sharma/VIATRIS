const axios = require('axios');

class AIService {
  constructor() {
    // Providers tried in order — first success wins
    this.providers = [];

    if (process.env.GROQ_API_KEY) {
      this.providers.push({
        name: 'groq',
        type: 'openai',
        apiKey: process.env.GROQ_API_KEY,
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile'
      });
    }

    if (process.env.OPENROUTER_API_KEY) {
      this.providers.push({
        name: 'openrouter',
        type: 'openai',
        apiKey: process.env.OPENROUTER_API_KEY,
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'google/gemma-4-26b-a4b-it:free',
        extraHeaders: {
          'HTTP-Referer': 'https://viatris.health',
          'X-Title': 'Viatris Health'
        }
      });
    }

    if (process.env.GEMINI_API_KEY) {
      this.providers.push({
        name: 'gemini',
        type: 'gemini',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.0-flash'
      });
    }

    if (process.env.COHERE_API_KEY) {
      this.providers.push({
        name: 'cohere',
        type: 'cohere',
        apiKey: process.env.COHERE_API_KEY,
        model: 'command-r-08-2024'
      });
    }

    if (this.providers.length === 0) {
      console.warn('[AIService] No AI API keys found — all AI endpoints will fail gracefully.');
    } else {
      console.log(`[AIService] Loaded providers: ${this.providers.map(p => p.name).join(' → ')}`);
    }
  }

  // ── Internal: call one OpenAI-compatible provider ──────────────────────────
  async _callOpenAI(provider, messages, maxTokens) {
    const response = await axios.post(
      provider.apiUrl,
      { model: provider.model, messages, temperature: 0.7, max_tokens: maxTokens },
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
          ...(provider.extraHeaders || {})
        },
        timeout: 20000
      }
    );
    return response.data.choices[0].message.content;
  }

  // ── Internal: call Gemini REST API ─────────────────────────────────────────
  async _callGemini(provider, messages, maxTokens) {
    const systemMsg = messages.find(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');

    const contents = nonSystem.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const body = {
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
    };
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`,
      body,
      { timeout: 20000 }
    );
    return response.data.candidates[0].content.parts[0].text;
  }

  // ── Internal: call Cohere chat API ─────────────────────────────────────────
  async _callCohere(provider, messages, maxTokens) {
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const nonSystem = messages.filter(m => m.role !== 'system');
    const lastMsg = nonSystem[nonSystem.length - 1]?.content || '';

    const chatHistory = nonSystem.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: m.content
    }));

    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        model: provider.model,
        message: lastMsg,
        preamble: systemMsg,
        chat_history: chatHistory,
        max_tokens: maxTokens,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );
    return response.data.text;
  }

  // ── Internal: try each provider in order, return first success ─────────────
  async _chat(messages, maxTokens = 500) {
    for (const provider of this.providers) {
      try {
        let content;
        if (provider.type === 'openai') content = await this._callOpenAI(provider, messages, maxTokens);
        else if (provider.type === 'gemini') content = await this._callGemini(provider, messages, maxTokens);
        else if (provider.type === 'cohere') content = await this._callCohere(provider, messages, maxTokens);
        console.log(`[AIService] responded via ${provider.name}`);
        return content;
      } catch (err) {
        console.error(`[AIService][${provider.name}] error: ${err.response?.data?.error?.message || err.message}`);
      }
    }
    throw new Error('All AI providers failed');
  }

  // ── Public: analyze symptoms ───────────────────────────────────────────────
  async analyzeSymptoms(symptoms, patientHistory = '') {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a medical AI assistant. Provide helpful, accurate medical information while always emphasizing the importance of consulting healthcare professionals. Always respond in valid JSON format.'
        },
        {
          role: 'user',
          content: `You are a medical AI assistant. Based on the following symptoms, provide:
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
}`
        }
      ];

      const content = await this._chat(messages, 500);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);

      return {
        possibleConditions: ['Unable to analyze symptoms'],
        recommendedSpecialization: ['General Physician'],
        urgencyLevel: 'medium',
        advice: 'Please consult a healthcare professional for accurate diagnosis.',
        disclaimer: 'This is AI-generated advice. Please consult a healthcare professional.'
      };
    } catch (error) {
      console.error('AI Analysis Error:', error.message);
      throw error;
    }
  }

  // ── Public: health chatbot ─────────────────────────────────────────────────
  async chatWithAI(userMessage, conversationHistory = []) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are Viatris AI, a warm and helpful health assistant for Viatris Health clinic in India. You respond in the same language the user writes in — English or Hindi.

You help with:
- Explaining what symptoms might generally indicate and when to see a doctor
- Describing medical specializations like cardiology, dermatology, orthopedics
- General wellness advice on sleep, diet, exercise, stress, hydration
- Explaining common medications in simple terms
- Helping patients understand medical words or terms
- Guiding patients on how to book appointments and use this platform

You do NOT diagnose any condition or prescribe any medication for any specific person. For any serious or urgent symptom always recommend seeing a real doctor immediately.

Keep responses warm, simple, and 3 to 5 sentences unless more detail is genuinely needed. Never use complex jargon without explaining it.`
        },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const content = await this._chat(messages, 300);
      return { message: content, role: 'assistant' };
    } catch (error) {
      console.error('AI Chat Error:', error.message);
      return {
        message: 'I am having trouble connecting right now. Please try again in a moment or contact the clinic directly.',
        role: 'assistant'
      };
    }
  }

  // ── Public: prescription suggestions (for doctors) ─────────────────────────
  async generatePrescriptionSuggestions(diagnosis, patientAge, allergies = []) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a medical AI assistant helping doctors with prescription suggestions. Always emphasize that final prescription decisions must be made by licensed healthcare providers.'
        },
        {
          role: 'user',
          content: `As a medical AI, suggest appropriate medications for the following:

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
}`
        }
      ];

      const content = await this._chat(messages, 400);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);

      return {
        medications: [],
        disclaimer: 'Unable to generate suggestions. Please prescribe based on clinical judgment.'
      };
    } catch (error) {
      console.error('AI Prescription Suggestion Error:', error.message);
      throw error;
    }
  }

  // ── Public: analyze medical report ────────────────────────────────────────
  async analyzeMedicalReport(reportText) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a medical AI assistant analyzing medical reports. Provide clear, understandable summaries.'
        },
        {
          role: 'user',
          content: `Analyze this medical report and provide a simple summary:

${reportText}

Provide summary in JSON format:
{
  "keyFindings": ["finding1", "finding2"],
  "concerningValues": ["value1", "value2"],
  "recommendations": ["recommendation1"],
  "overallAssessment": "brief assessment"
}`
        }
      ];

      const content = await this._chat(messages, 400);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);

      return {
        keyFindings: [],
        concerningValues: [],
        recommendations: [],
        overallAssessment: 'Report analysis unavailable'
      };
    } catch (error) {
      console.error('AI Report Analysis Error:', error.message);
      throw error;
    }
  }

  // ── Public: health tips ────────────────────────────────────────────────────
  async getHealthTips(category = 'general') {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a health and wellness AI assistant. Provide practical, evidence-based health tips.'
        },
        {
          role: 'user',
          content: `Provide 5 helpful health tips for: ${category}. Make them practical and easy to follow.`
        }
      ];

      const content = await this._chat(messages, 300);
      return {
        tips: content.split('\n').filter(tip => tip.trim()),
        category
      };
    } catch (error) {
      console.error('AI Health Tips Error:', error.message);
      throw error;
    }
  }
}

module.exports = new AIService();
