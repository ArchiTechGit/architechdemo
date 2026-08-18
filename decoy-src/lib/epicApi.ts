'use client';

import { useCallback, useEffect, useState } from 'react';

const API_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/epic-api/api/FHIR/R4`;

interface Bundle<T> {
  resourceType: 'Bundle';
  type: string;
  total: number;
  entry: Array<{ resource: T }>;
}

interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue: Array<{ severity: string; code: string; diagnostics: string }>;
}

export function useEpicResource<T extends { id: string }>(
  resourceType: string,
  params: Record<string, string> = {},
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    const query = new URLSearchParams(params);
    fetch(`${API_BASE}/${resourceType}${query.toString() ? `?${query}` : ''}`)
      .then((res) => res.json())
      .then((body: Bundle<T> | OperationOutcome) => {
        if (body.resourceType === 'OperationOutcome') {
          setError(body.issue[0]?.diagnostics ?? 'request failed');
        } else {
          setRows(body.entry.map((e) => e.resource));
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'request failed');
        setLoading(false);
      });
  }, [resourceType, JSON.stringify(params)]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, loading, error, refresh };
}

export function useEpicResourceById<T extends { id: string }>(resourceType: string, id: string | null) {
  const [resource, setResource] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setResource(null);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/${resourceType}/${id}`)
      .then((res) => res.json())
      .then((body: T | OperationOutcome) => {
        if ((body as OperationOutcome).resourceType === 'OperationOutcome') {
          setError((body as OperationOutcome).issue[0]?.diagnostics ?? 'not found');
          setResource(null);
        } else {
          setResource(body as T);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'request failed');
        setLoading(false);
      });
  }, [resourceType, id]);

  return { resource, loading, error };
}

export async function createEpicResource<T>(resourceType: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/${resourceType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, resourceType }),
  });
  if (!res.ok) throw new Error(`create ${resourceType} failed: ${res.status}`);
  return res.json();
}
