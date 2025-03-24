import { useState, useEffect } from 'react';

export function useEnvKey(keyName: string) {
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/check-key?key=${encodeURIComponent(keyName)}`,
        );
        if (!response.ok) {
          throw new Error('Failed to check key');
        }

        const data = await response.json();
        setHasKey(data.hasKey);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check key');
        setHasKey(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkKey();
  }, [keyName]);

  return { hasKey, isLoading, error };
}
