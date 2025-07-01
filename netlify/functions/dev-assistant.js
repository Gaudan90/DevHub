const { Anthropic } = require('@anthropic-ai/sdk');

exports.handler = async (event, context) => {
  console.log('=== DevAssistant Function Called ===');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', event.headers);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'DevAssistant function is running!' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Raw body:', event.body);
    
    if (!event.body) {
      throw new Error('No request body provided');
    }

    const { message, context: userContext, apiKey } = JSON.parse(event.body);
    
    console.log('Parsed message:', message);
    console.log('API Key present:', apiKey ? 'YES' : 'NO');
    console.log('API Key format:', apiKey ? (apiKey.startsWith('sk-ant-') ? 'VALID' : 'INVALID') : 'MISSING');

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

    console.log('Initializing Anthropic client...');
    
    // Inizializza Anthropic
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    console.log('Making API call to Anthropic...');

    // Chiamata a Claude
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Come sviluppatore senior esperto, rispondi in italiano alla seguente domanda di programmazione. Fornisci codice preciso e rifletti attentamente.

Domanda: ${message}`
      }]
    });

    console.log('Anthropic API response received successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: response.content[0].text,
        status: 'success'
      })
    };

  } catch (error) {
    console.error('=== ERROR DETAILS ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error status:', error.status);
    console.error('Full error:', error);
    console.error('Error stack:', error.stack);
    
    // Gestione errori specifici
    if (error.status === 401 || error.message.includes('invalid api key')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Invalid API key',
          message: 'La tua API key non è valida o è scaduta',
          details: error.message
        })
      };
    }

    if (error.status === 429) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Troppi requests. Riprova tra qualche minuto.',
          details: error.message
        })
      };
    }

    if (error.message.includes('model')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Model error',
          message: 'Problema con il modello AI specificato',
          details: error.message
        })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'DevAssistant temporarily unavailable',
        details: error.message,
        type: error.constructor.name
      })
    };
  }
};