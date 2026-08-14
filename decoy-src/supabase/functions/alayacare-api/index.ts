import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

const JSON_HEADERS = { ...CORS_HEADERS, 'content-type': 'application/json' };

const PAGE_SIZE = 50;

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: { message } }), { status, headers: CORS_HEADERS });
}

async function paginatedResponse(query: any, page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) return errorResponse(error.message, 500);
  const total = count ?? (data?.length ?? 0);
  return new Response(
    JSON.stringify({
      count: total,
      page,
      total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      items: data ?? [],
    }),
    { headers: JSON_HEADERS },
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // GET .../cancelled-visit/staff-contacts/{visit_id}
  const staffContactsMatch = path.match(/\/cancelled-visit\/staff-contacts\/([0-9]+)$/);
  if (staffContactsMatch) {
    if (req.method !== 'GET') return errorResponse('method not allowed', 405);
    const visitId = Number(staffContactsMatch[1]);
    const { data: visit, error: visitError } = await supabase
      .schema('alayacare')
      .from('visit')
      .select('client_id')
      .eq('alayacare_visit_id', visitId)
      .single();
    if (visitError || !visit?.client_id) return errorResponse('visit not found', 404);
    const { data: careTeam, error: careTeamError } = await supabase
      .schema('alayacare')
      .from('care_team_member')
      .select('employee_id,first_name,last_name,role,email')
      .eq('client_id', visit.client_id);
    if (careTeamError) return errorResponse(careTeamError.message, 500);
    return new Response(JSON.stringify({ care_team: careTeam ?? [] }), { headers: JSON_HEADERS });
  }

  // .../client-profile[/{client_id}]
  const clientMatch = path.match(/\/client-profile(?:\/([A-Za-z0-9]+))?$/);
  if (clientMatch) {
    const clientId = clientMatch[1];
    const db = supabase.schema('alayacare').from('client');

    if (req.method === 'GET' && !clientId) {
      const page = Number(url.searchParams.get('page') ?? '1');
      return paginatedResponse(db.select('*', { count: 'exact' }).order('createdon', { ascending: false }), page);
    }
    if (req.method === 'GET' && clientId) {
      const { data, error } = await db.select('*').eq('client_id', clientId).single();
      if (error) return errorResponse(error.message, 404);
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }
    if (req.method === 'POST') {
      const body = await req.json();
      const { data, error } = await db.insert(body).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return new Response(JSON.stringify(data), { status: 201, headers: JSON_HEADERS });
    }
    if (req.method === 'PATCH' && clientId) {
      const body = await req.json();
      const { data, error } = await db.update(body).eq('client_id', clientId).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }
    if (req.method === 'DELETE' && clientId) {
      const { error } = await db.delete().eq('client_id', clientId);
      if (error) return errorResponse(error.message, 400);
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    return errorResponse('method not allowed', 405);
  }

  // .../scheduled-visits[/{visit_id}]
  const visitMatch = path.match(/\/scheduled-visits(?:\/([0-9]+))?$/);
  if (visitMatch) {
    const visitId = visitMatch[1] ? Number(visitMatch[1]) : undefined;
    const db = supabase.schema('alayacare').from('visit');

    if (req.method === 'GET' && !visitId) {
      const page = Number(url.searchParams.get('page') ?? '1');
      const clientId = url.searchParams.get('client_id');
      const startAt = url.searchParams.get('start_at');
      const endAt = url.searchParams.get('end_at');
      let query = db.select('*', { count: 'exact' }).order('start_at', { ascending: true });
      if (clientId) query = query.eq('client_id', clientId);
      if (startAt) query = query.gte('start_at', startAt);
      if (endAt) query = query.lte('end_at', endAt);
      return paginatedResponse(query, page);
    }
    if (req.method === 'POST') {
      const body = await req.json();
      const { data, error } = await db.insert(body).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return new Response(JSON.stringify(data), { status: 201, headers: JSON_HEADERS });
    }
    if (req.method === 'PATCH' && visitId) {
      const body = await req.json();
      const { data, error } = await db.update(body).eq('alayacare_visit_id', visitId).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }
    if (req.method === 'DELETE' && visitId) {
      const { error } = await db.delete().eq('alayacare_visit_id', visitId);
      if (error) return errorResponse(error.message, 400);
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    return errorResponse('method not allowed', 405);
  }

  return errorResponse('not found', 404);
});
