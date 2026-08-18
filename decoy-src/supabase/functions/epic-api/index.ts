import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};
const JSON_HEADERS = { ...CORS_HEADERS, 'content-type': 'application/json' };

function operationOutcome(message: string, code: string, status: number) {
  return new Response(
    JSON.stringify({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code, diagnostics: message }],
    }),
    { status, headers: JSON_HEADERS },
  );
}

function bundle(resources: any[]) {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: resources.length,
    entry: resources.map((r) => ({ resource: r })),
  };
}

async function handleResourceType(
  table: string,
  resourceType: string,
  req: Request,
  url: URL,
  id: string | undefined,
) {
  const db = supabase.schema('epic').from(table);
  const patientFilter = url.searchParams.get('patient');

  if (req.method === 'GET' && id) {
    const { data, error } = await db.select('data').eq('id', id).single();
    if (error || !data) return operationOutcome(`${resourceType}/${id} not found`, 'not-found', 404);
    return new Response(JSON.stringify(data.data), { headers: JSON_HEADERS });
  }

  if (req.method === 'GET' && !id) {
    let query = db.select('data');
    if (patientFilter) query = query.eq('patient_id', patientFilter);
    const { data, error } = await query;
    if (error) return operationOutcome(error.message, 'exception', 500);
    return new Response(JSON.stringify(bundle((data ?? []).map((r: any) => r.data))), { headers: JSON_HEADERS });
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => null);
    if (!body || body.resourceType !== resourceType) {
      return operationOutcome(`body must be a ${resourceType} resource`, 'invalid', 400);
    }
    const newId = crypto.randomUUID();
    body.id = newId;
    const patientId = body.subject?.reference?.replace('Patient/', '') ?? body.patient?.reference?.replace('Patient/', '');
    const row: Record<string, unknown> = { id: newId, data: body };
    if (table !== 'patient' && table !== 'practitioner') row.patient_id = patientId;
    const { data, error } = await db.insert(row).select('data').single();
    if (error) return operationOutcome(error.message, 'invalid', 400);
    return new Response(JSON.stringify(data.data), { status: 201, headers: JSON_HEADERS });
  }

  return operationOutcome('method not allowed', 'not-supported', 405);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  if (path.endsWith('/oauth2/token') && req.method === 'POST') {
    const body = await req.text();
    if (!body.includes('grant_type=')) {
      return operationOutcome('missing grant_type', 'invalid', 400);
    }
    return new Response(
      JSON.stringify({ access_token: 'epic-demo-token', token_type: 'Bearer', expires_in: 3600, scope: 'system/*.read' }),
      { headers: JSON_HEADERS },
    );
  }

  const RESOURCE_TABLES: Record<string, string> = {
    Patient: 'patient',
    Encounter: 'encounter',
    Condition: 'condition',
    MedicationRequest: 'medication_request',
    Observation: 'observation',
    AllergyIntolerance: 'allergy_intolerance',
  };
  const match = path.match(/\/api\/FHIR\/R4\/([A-Za-z]+)(?:\/([^/]+))?$/);
  if (match) {
    const [, resourceType, id] = match;
    const table = RESOURCE_TABLES[resourceType];
    if (!table) return operationOutcome(`unsupported resource type: ${resourceType}`, 'not-supported', 400);
    return handleResourceType(table, resourceType, req, url, id);
  }

  return operationOutcome(`unknown route: ${path}`, 'not-found', 404);
});
