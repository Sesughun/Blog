import { useEffect, useState } from "react";
import api from "../api/axios";

interface Result<T> {
  key: string;
  url: string;
  data: T | null;
  error: boolean;
}

/**
 * Fetches `url` whenever it (or `deps`) changes. While refetching the same url
 * (e.g. after an admin action) the previous data stays visible.
 */
export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const key = `${url}|${deps.join(",")}`;
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    api
      .get<T>(url)
      .then((r) => !cancelled && setResult({ key, url, data: r.data, error: false }))
      .catch(() => !cancelled && setResult({ key, url, data: null, error: true }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const sameUrl = result?.url === url;
  const loading = !!url && result?.key !== key && !sameUrl;
  const error = !!url && result?.key === key && result.error;
  const data = url && sameUrl ? result.data : null;

  const setData = (value: T | null) => setResult((r) => (r ? { ...r, data: value } : r));

  return { data, loading, error, setData };
}

export function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
