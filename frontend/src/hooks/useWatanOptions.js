import { useEffect, useState } from 'react';
import * as watanApi from '../api/watanApi';

// Only super-admin ever sees a watan field (create or edit) - pass
// `enabled` so other callers don't fetch a list they'll never render.
export function useWatanOptions(enabled) {
  const [watanOptions, setWatanOptions] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    watanApi.getAllWatans().then(setWatanOptions).catch(() => setWatanOptions([]));
  }, [enabled]);

  return watanOptions;
}
