import { useCallback, useEffect, useState } from "react";
export function useQuery<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    let active = true;
    loader()
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "No se pudieron cargar los datos",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loader, version]);
  return { data, error, loading, reload };
}
