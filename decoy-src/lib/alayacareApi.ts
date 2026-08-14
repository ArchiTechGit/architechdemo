'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CareTeamMember } from './alayacareTypes';

const API_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/alayacare-api/AlayaCare/v1`;

export function useAlayacareResource<T extends object>(
  resource: string,
  listParams: Record<string, string> = {},
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams(listParams);
    fetch(`${API_BASE}/${resource}?${params.toString()}`)
      .then((res) => res.json())
      .then((body) => {
        if (body.error) setError(body.error.message);
        else setRows(body.items as T[]);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'request failed');
        setLoading(false);
      });
  }, [resource, JSON.stringify(listParams)]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const insert = useCallback(
    async (values: Partial<T>) => {
      const res = await fetch(`${API_BASE}/${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`insert failed: ${res.status}`);
      refresh();
    },
    [resource, refresh],
  );

  const update = useCallback(
    async (id: string | number, values: Partial<T>) => {
      const res = await fetch(`${API_BASE}/${resource}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`update failed: ${res.status}`);
      refresh();
    },
    [resource, refresh],
  );

  const remove = useCallback(
    async (id: string | number) => {
      const res = await fetch(`${API_BASE}/${resource}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`delete failed: ${res.status}`);
      refresh();
    },
    [resource, refresh],
  );

  return { rows, loading, error, refresh, insert, update, remove };
}

export function useCareTeam(visitId: number | null) {
  const [careTeam, setCareTeam] = useState<CareTeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visitId) {
      setCareTeam([]);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/cancelled-visit/staff-contacts/${visitId}`)
      .then((res) => res.json())
      .then((body) => setCareTeam(body.care_team ?? []))
      .finally(() => setLoading(false));
  }, [visitId]);

  return { careTeam, loading };
}
