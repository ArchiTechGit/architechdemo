import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const ALLOWED_SCHEMAS = ['dynamics', 'alayacare'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  const { schema } = await req.json().catch(() => ({ schema: undefined }));

  if (typeof schema !== 'string' || !ALLOWED_SCHEMAS.includes(schema)) {
    return new Response(JSON.stringify({ error: 'unknown schema' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error } = await supabase.schema(schema).rpc('reset_demo_data');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
});
