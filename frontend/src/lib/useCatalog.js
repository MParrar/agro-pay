import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client.js';

// Loads gardens, workers and fruit types once for pages that create or edit entries
export function useCatalog() {
  const [catalog, setCatalog] = useState({ gardens: [], workers: [], fruitTypes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/gardens'), api.get('/workers'), api.get('/fruit-types')])
      .then(([g, w, f]) => setCatalog({ gardens: g.data, workers: w.data, fruitTypes: f.data }))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar los datos.')))
      .finally(() => setLoading(false));
  }, []);

  return { ...catalog, loading, error };
}
