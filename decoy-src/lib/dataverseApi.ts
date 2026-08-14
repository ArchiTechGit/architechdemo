'use client';

import { useCallback, useEffect, useState } from 'react';

const API_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/dataverse-api/api/data/v9.2`;

const ODATA_HEADERS = {
  'OData-MaxVersion': '4.0',
  'OData-Version': '4.0',
  'Content-Type': 'application/json; charset=utf-8',
  Accept: 'application/json',
  Authorization: 'Bearer demo-token',
};

export interface LookupConfig {
  [column: string]: { bindProperty: string; targetSet: string };
}

export function useDataverseTable<T extends object>(
  entitySet: string,
  lookups: LookupConfig = {},
  expand?: string,
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ $orderby: 'createdon desc' });
    if (expand) params.set('$expand', expand);
    fetch(`${API_BASE}/${entitySet}?${params.toString()}`, { headers: ODATA_HEADERS })
      .then((res) => res.json())
      .then((body) => {
        if (body.error) setError(body.error.message);
        else setRows(body.value as T[]);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'request failed');
        setLoading(false);
      });
  }, [entitySet, expand]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function toWireBody(values: Partial<T>) {
    const out: Record<string, unknown> = { ...(values as Record<string, unknown>) };
    for (const [column, lookup] of Object.entries(lookups)) {
      if (column in out) {
        const value = out[column];
        delete out[column];
        if (value) out[`${lookup.bindProperty}@odata.bind`] = `/${lookup.targetSet}(${value})`;
      }
    }
    return out;
  }

  const insert = useCallback(
    async (values: Partial<T>) => {
      const res = await fetch(`${API_BASE}/${entitySet}`, {
        method: 'POST',
        headers: ODATA_HEADERS,
        body: JSON.stringify(toWireBody(values)),
      });
      if (!res.ok) throw new Error(`insert failed: ${res.status}`);
      refresh();
    },
    [entitySet, lookups, refresh],
  );

  const update = useCallback(
    async (id: string, values: Partial<T>) => {
      const res = await fetch(`${API_BASE}/${entitySet}(${id})`, {
        method: 'PATCH',
        headers: ODATA_HEADERS,
        body: JSON.stringify(toWireBody(values)),
      });
      if (!res.ok) throw new Error(`update failed: ${res.status}`);
      refresh();
    },
    [entitySet, lookups, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`${API_BASE}/${entitySet}(${id})`, {
        method: 'DELETE',
        headers: ODATA_HEADERS,
      });
      if (!res.ok) throw new Error(`delete failed: ${res.status}`);
      refresh();
    },
    [entitySet, refresh],
  );

  return { rows, loading, error, refresh, insert, update, remove };
}
