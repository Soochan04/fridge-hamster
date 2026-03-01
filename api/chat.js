export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
        },
    },
};

export default async function handler(req, res) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS, POST'
    };

    // Handle CORS Preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;

    if (!API_KEY) {
        res.status(500).json({ error: "환경 변수에 OPENROUTER_API_KEY가 설정되지 않았습니다." });
        return;
    }

    try {
        const requestBody = req.body;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://fridge-recipe-app.vercel.app', // Update this once deployed
                'X-Title': 'Fridge Recipe App'
            },
            body: typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
        });

        let data;
        const responseText = await response.text();
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse OpenRouter response:', responseText);
            res.status(response.status || 500).json({ error: `[OpenRouter ${response.status}] Invalid JSON response` });
            return;
        }

        if (!response.ok) {
            console.error('OpenRouter API Error:', data);
            res.status(response.status).json({
                error: `[OpenRouter ${response.status}] ${data.error?.message || JSON.stringify(data)}`,
                raw: data
            });
            return;
        }

        res.status(200).json(data);

    } catch (error) {
        console.error('Vercel API Error:', error);
        res.status(500).json({ error: `[Server Error] ${error.name}: ${error.message}` });
    }
}
