const FISH_AUDIO_TTS_URL = 'https://api.fish.audio/v1/tts';
const ALLOWED_HEADERS = 'Authorization, Content-Type, model';

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': ALLOWED_HEADERS,
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
    };
}

function jsonResponse(message, status, origin) {
    return new Response(JSON.stringify({ message }), {
        status,
        headers: {
            ...corsHeaders(origin),
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin');
        const allowedOrigins = (env.ALLOWED_ORIGINS || '')
            .split(',')
            .map(value => value.trim())
            .filter(Boolean);

        if (!origin || !allowedOrigins.includes(origin)) {
            return jsonResponse('This origin is not allowed. Configure ALLOWED_ORIGINS in the Worker.', 403, 'null');
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(origin)
            });
        }

        const url = new URL(request.url);
        if (request.method !== 'POST' || url.pathname !== '/v1/tts') {
            return jsonResponse('Only POST /v1/tts is supported.', 404, origin);
        }

        const authorization = request.headers.get('Authorization');
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return jsonResponse('A Fish Audio Bearer API key is required.', 401, origin);
        }

        const contentType = request.headers.get('Content-Type') || '';
        if (!contentType.toLowerCase().startsWith('application/json')) {
            return jsonResponse('Content-Type must be application/json.', 415, origin);
        }

        const body = await request.text();
        if (body.length > 1024 * 1024) {
            return jsonResponse('Request body is too large.', 413, origin);
        }

        let payload;
        try {
            payload = JSON.parse(body);
        } catch (_) {
            return jsonResponse('Request body must be valid JSON.', 400, origin);
        }

        if (typeof payload.text !== 'string' || typeof payload.reference_id !== 'string') {
            return jsonResponse('Both text and reference_id are required.', 400, origin);
        }

        let upstream;
        try {
            upstream = await fetch(FISH_AUDIO_TTS_URL, {
                method: 'POST',
                headers: {
                    'Authorization': authorization,
                    'Content-Type': 'application/json',
                    'model': request.headers.get('model') || 's1'
                },
                body
            });
        } catch (_) {
            return jsonResponse('Could not connect to Fish Audio.', 502, origin);
        }

        const headers = new Headers(corsHeaders(origin));
        headers.set('Cache-Control', 'no-store');
        const upstreamContentType = upstream.headers.get('Content-Type');
        if (upstreamContentType) headers.set('Content-Type', upstreamContentType);
        const traceId = upstream.headers.get('x-fish-trace-id');
        if (traceId) headers.set('x-fish-trace-id', traceId);

        return new Response(upstream.body, {
            status: upstream.status,
            headers
        });
    }
};
