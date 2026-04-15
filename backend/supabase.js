const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Safe query wrapper with simple retry and per-attempt timeout
supabase.safeQuery = async (queryFn, retries = 2) => {
  const TIMEOUT_MS = 8000;
  let lastError;

  for (let i = 0; i <= retries; i++) {
    try {
      // Race the actual query against a 15s timeout
      const result = await Promise.race([
        queryFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout: Query exceeded ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
        )
      ]);

      if (result.error) throw result.error;
      return result;
    } catch (err) {
      lastError = err;
      const isTimeout = err.message && err.message.includes('Timeout');
      
      if (i < retries) {
        const delay = Math.pow(2, i) * 500;
        if (global.serverLog) {
          global.serverLog(`⚠️ ${isTimeout ? '⏰' : '❌'} Query failed (${err.message}). Retrying in ${delay}ms...`);
        }
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
  throw lastError;
};

module.exports = supabase;

