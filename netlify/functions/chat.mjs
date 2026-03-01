const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS, POST'
};

export const handler = async (event) => {
    // Handle CORS Preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;

    if (!API_KEY) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Netlify 환경 변수에 OPENROUTER_API_KEY가 설정되지 않았습니다." }),
        };
    }

    try {
        const requestBody = JSON.parse(event.body);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://your-netlify-site.netlify.app', // Update this once deployed if desired
                'X-Title': 'Fridge Recipe App'
            },
            body: JSON.stringify(requestBody)
        });

        let data;
        const responseText = await response.text();
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse OpenRouter response:', responseText);
            return {
                statusCode: response.status || 500,
                headers,
                body: JSON.stringify({ error: `[OpenRouter ${response.status}] Invalid JSON response: ${responseText.substring(0, 100)}...` })
            };
        }

        if (!response.ok) {
            console.error('OpenRouter API Error:', data);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    error: `[OpenRouter ${response.status}] ${data.error?.message || JSON.stringify(data)}`,
                    raw: data
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Netlify Function Crash:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: `[Netlify Server Error] ${error.name}: ${error.message}` }),
        };
    }
};
