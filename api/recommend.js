export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { moodText } = req.body;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are a movie recommendation expert. Analyze this mood/feeling and recommend 4-6 movies that would perfectly match it.

User's mood: "${moodText}"

Return your response as a JSON array with this exact format:
[
  {
    "title": "Movie Title",
    "year": 2020,
    "genre": "Drama/Comedy", 
    "description": "Brief description of why this movie fits the mood",
    "rating": 7.8,
    "reason": "Short explanation of why this matches their vibe"
  }
]

Focus on:
- Movies that match the emotional tone
- Consider energy level (high/low energy moods)
- Think about what they need emotionally
- Include a mix of popular and hidden gems
- Only recommend movies you're confident exist

Respond with only the JSON array, no other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const recommendations = JSON.parse(data.choices[0].message.content.trim());
    
    res.status(200).json({ recommendations });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
}
