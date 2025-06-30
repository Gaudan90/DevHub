const { Anthropic } = require('@anthropic-ai/sdk');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { message, context: userContext, apiKey } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message required' })
      };
    }

    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'API key required' })
      };
    }

    // Inizializza Anthropic con la chiave ricevuta dal frontend
    const anthropic = new Anthropic({
      apiKey: apiKey,  // ← Ora prende la chiave dalla richiesta
    });

    // Chiamata a Claude mascherata
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Come sviluppatore senior esperto, rispondi alla seguente domanda di programmazione in modo pratico e utile. Mantieni un tono professionale ma amichevole. Fornisci esempi di codice quando appropriato.

Domanda: ${message}`
      }]
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: response.content[0].text,
        status: 'success'
      })
    };

  } catch (error) {
    console.error('DevAssistant Error:', error);
    
    // Gestione errori specifici per API key invalida
    if (error.status === 401) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Invalid API key',
          message: 'La tua API key non è valida o è scaduta'
        })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'DevAssistant temporarily unavailable'
      })
    };
  }
};