import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

interface LookupDef {
  bindProperty: string;
  targetSet: string;
  targetTable: string;
  targetPk: string;
}

interface EntityConfig {
  table: string;
  pk: string;
  lookups: Record<string, LookupDef>;
}

const ENTITIES: Record<string, EntityConfig> = {
  accounts: { table: 'account', pk: 'accountid', lookups: {} },
  contacts: {
    table: 'contact',
    pk: 'contactid',
    lookups: {
      parentcustomerid: {
        bindProperty: 'parentcustomerid_account',
        targetSet: 'accounts',
        targetTable: 'account',
        targetPk: 'accountid',
      },
    },
  },
  opportunities: {
    table: 'opportunity',
    pk: 'opportunityid',
    lookups: {
      parentaccountid: {
        bindProperty: 'parentaccountid_account',
        targetSet: 'accounts',
        targetTable: 'account',
        targetPk: 'accountid',
      },
      parentcontactid: {
        bindProperty: 'parentcontactid_contact',
        targetSet: 'contacts',
        targetTable: 'contact',
        targetPk: 'contactid',
      },
    },
  },
  leads: { table: 'lead', pk: 'leadid', lookups: {} },
  annotations: { table: 'annotation', pk: 'annotationid', lookups: {} },
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

function parsePath(pathname: string) {
  const match = pathname.match(/\/api\/data\/v9\.2\/([a-z]+)(?:\(([0-9a-fA-F-]+)\))?$/);
  if (!match) return null;
  return { entitySet: match[1], id: match[2] as string | undefined };
}

function guidFromBind(bindValue: string): string | null {
  const match = bindValue.match(/\(([0-9a-fA-F-]+)\)$/);
  return match ? match[1] : null;
}

function translateWriteBody(config: EntityConfig, body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  const bindKeyToColumn = new Map(
    Object.entries(config.lookups).map(([column, lookup]) => [`${lookup.bindProperty}@odata.bind`, column]),
  );
  for (const [key, value] of Object.entries(body)) {
    const column = bindKeyToColumn.get(key);
    if (column) {
      out[column] = typeof value === 'string' ? guidFromBind(value) : null;
    } else {
      out[key] = value;
    }
  }
  return out;
}

async function expandRows(
  config: EntityConfig,
  rows: Record<string, unknown>[],
  expandParam: string | null,
) {
  if (!expandParam) return rows;
  const match = expandParam.match(/^([a-zA-Z_]+)(?:\(\$select=([a-zA-Z0-9_,]+)\))?$/);
  if (!match) return rows;
  const [, navProperty, selectList] = match;
  const entry = Object.entries(config.lookups).find(([, l]) => l.bindProperty === navProperty);
  if (!entry) return rows;
  const [column, lookup] = entry;
  const ids = [...new Set(rows.map((r) => r[column]).filter((v): v is string => typeof v === 'string'))];
  if (ids.length === 0) return rows;
  const cols = selectList ? `${lookup.targetPk},${selectList}` : '*';
  const { data: related } = await supabase
    .schema('dynamics')
    .from(lookup.targetTable)
    .select(cols)
    .in(lookup.targetPk, ids);
  const byId = new Map((related ?? []).map((r: any) => [r[lookup.targetPk], r]));
  return rows.map((r) => ({ ...r, [navProperty]: byId.get(r[column] as string) ?? null }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const parsed = parsePath(url.pathname);
  if (!parsed) {
    return new Response(JSON.stringify({ error: { message: 'not found' } }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  }

  const config = ENTITIES[parsed.entitySet];
  if (!config) {
    return new Response(JSON.stringify({ error: { message: `unknown entity set ${parsed.entitySet}` } }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  }

  const db = supabase.schema('dynamics').from(config.table);
  const jsonHeaders = { ...CORS_HEADERS, 'content-type': 'application/json', 'odata-version': '4.0' };

  if (req.method === 'GET' && !parsed.id) {
    const select = url.searchParams.get('$select') ?? '*';
    const orderby = url.searchParams.get('$orderby');
    let query = db.select(select);
    if (orderby) {
      const [col, dir] = orderby.trim().split(/\s+/);
      query = query.order(col, { ascending: (dir ?? 'asc').toLowerCase() !== 'desc' });
    } else {
      query = query.order('createdon', { ascending: false });
    }
    const { data, error } = await query;
    if (error) {
      return new Response(JSON.stringify({ error: { message: error.message } }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
    const expanded = await expandRows(config, data ?? [], url.searchParams.get('$expand'));
    return new Response(
      JSON.stringify({ '@odata.context': `$metadata#${parsed.entitySet}`, value: expanded }),
      { headers: jsonHeaders },
    );
  }

  if (req.method === 'GET' && parsed.id) {
    const { data, error } = await db.select('*').eq(config.pk, parsed.id).single();
    if (error) {
      return new Response(JSON.stringify({ error: { message: error.message } }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    }
    return new Response(JSON.stringify(data), { headers: jsonHeaders });
  }

  if (req.method === 'POST') {
    const body = translateWriteBody(config, await req.json());
    const { data, error } = await db.insert(body).select('*').single();
    if (error) {
      return new Response(JSON.stringify({ error: { message: error.message } }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    return new Response(JSON.stringify(data), { status: 201, headers: jsonHeaders });
  }

  if (req.method === 'PATCH' && parsed.id) {
    const body = translateWriteBody(config, await req.json());
    const { error } = await db.update(body).eq(config.pk, parsed.id);
    if (error) {
      return new Response(JSON.stringify({ error: { message: error.message } }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method === 'DELETE' && parsed.id) {
    const { error } = await db.delete().eq(config.pk, parsed.id);
    if (error) {
      return new Response(JSON.stringify({ error: { message: error.message } }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  return new Response(JSON.stringify({ error: { message: 'method not allowed' } }), {
    status: 405,
    headers: CORS_HEADERS,
  });
});
