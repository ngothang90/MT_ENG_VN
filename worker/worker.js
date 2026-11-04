const OPENAI_TRANSLATION_SESSIONS_URL = 'https://api.openai.com/v1/realtime/translations/client_secrets';
const ALLOWED_TARGET_LANGUAGES = new Set(['vi', 'en', 'ja', 'ko', 'zh']);

function jsonResponse(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      ...headers,
    },
  });
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const configuredOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  // Fail closed: configure the GitHub Pages origin before deploying.
  const allowed = configuredOrigins.includes(origin);
  if (!origin || !allowed) return null;

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(request, env);

    if (!corsHeaders) {
      return jsonResponse({ error: 'Origin chưa được cho phép. Hãy thêm domain GitHub Pages vào ALLOWED_ORIGINS của Worker.' }, 403);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return jsonResponse({ ok: true, service: 'live-translator-ai-worker' }, 200, corsHeaders);
    }

    if (url.pathname !== '/session' || request.method !== 'POST') {
      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
    }

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: 'Worker chưa được cấu hình secret OPENAI_API_KEY.' }, 500, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return jsonResponse({ error: 'Body phải là JSON hợp lệ.' }, 400, corsHeaders);
    }

    const targetLanguage = String(body?.targetLanguage || '').toLowerCase();
    if (!ALLOWED_TARGET_LANGUAGES.has(targetLanguage)) {
      return jsonResponse({ error: 'Ngôn ngữ đích không được hỗ trợ.' }, 400, corsHeaders);
    }

    try {
      const openaiResponse = await fetch(OPENAI_TRANSLATION_SESSIONS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expires_after: { anchor: 'created_at', seconds: 600 },
          session: {
            model: 'gpt-realtime-translate',
            audio: {
              input: {
                transcription: { model: 'gpt-realtime-whisper' },
                noise_reduction: { type: 'far_field', strength: 0.85 },
              },
              output: { language: targetLanguage },
            },
          },
        }),
      });

      const responseText = await openaiResponse.text();
      let responseData;
      try { responseData = JSON.parse(responseText); }
      catch (_) { responseData = { error: { message: 'OpenAI trả về dữ liệu không hợp lệ.' } }; }

      if (!openaiResponse.ok) {
        return jsonResponse({ error: responseData.error?.message || 'Không tạo được phiên AI Realtime.', details: responseData.error || null }, openaiResponse.status, corsHeaders);
      }

      if (!responseData.value) {
        return jsonResponse({ error: 'OpenAI không trả về client secret.' }, 502, corsHeaders);
      }

      // Only the short-lived client secret is returned. The standard API key stays in Worker secrets.
      return jsonResponse({ value: responseData.value, expires_at: responseData.expires_at }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ error: error?.message || 'Không thể kết nối OpenAI.' }, 502, corsHeaders);
    }
  },
};
