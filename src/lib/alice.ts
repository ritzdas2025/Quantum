import { Trade } from './data';
import crypto from 'crypto';
import fs from 'fs';

export type AliceTrade = Trade;

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, backoff = 500) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, backoff * Math.pow(2, attempt)));
      attempt++;
    }
  }
  throw new Error('Unreachable');
}

export function buildAuthHeaders(apiKey: string, apiSecret: string, method: string | undefined, url: string, body?: string, bearerToken?: string, sessionId?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Bearer token takes precedence
  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  const authMethod = (method || 'headers').toLowerCase();

  if (!bearerToken) {
    if (authMethod === 'basic') {
      headers['Authorization'] = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
    } else if (authMethod === 'hmac') {
      // Generic HMAC implementation: provider specifics may vary — adapt to Alice Blue docs as necessary
      const ts = Math.floor(Date.now() / 1000).toString();
      const urlObj = new URL(url);
      const path = urlObj.pathname + (urlObj.search || '');
      const payload = body ?? '';
      const toSign = `${ts}:${path}:${payload}`;
      const signature = crypto.createHmac('sha256', apiSecret).update(toSign).digest('hex');
      headers['x-api-key'] = apiKey;
      headers['x-timestamp'] = ts;
      headers['x-signature'] = signature;
    } else {
      // default: custom headers
      if (apiKey) headers['x-api-key'] = apiKey;
      if (apiSecret) headers['x-api-secret'] = apiSecret;
    }
  }

  // Session ID header (Alice uses a Session ID for authenticated calls). Allow configurable header name.
  if (sessionId) {
    const headerName = (process.env.ALICE_SESSION_HEADER_NAME || 'x-session-id').toLowerCase();
    headers[headerName] = sessionId;
  }

  return headers;
}

/**
 * Obtain a Session ID (SID) from Alice Blue using user credentials.
 * This is sensitive — do not log or store raw credentials in production.
 */
export async function obtainSessionId({ userId, password, twoFA, appId } : { userId: string; password: string; twoFA: string; appId: string }) : Promise<string> {
  const sidEndpoint = process.env.ALICE_SID_ENDPOINT || 'https://ant.aliceblueonline.com/rest/AliceBlueAPIService/api/customer/getUserSID';
  const body = JSON.stringify({ userId, password, twoFA, appId });

  const res = await fetchWithRetry(sidEndpoint, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
  const payload = await res.json().catch(() => ({}));

  if (payload && (payload.stat === 'Ok' || payload.sessionID || payload.sessionId)) {
    return payload.sessionID || payload.sessionId;
  }

  throw new Error(`Failed to obtain SID: ${JSON.stringify(payload)}`);
}

export async function getMasterTrades(): Promise<AliceTrade[]> {
  const endpoint = process.env.ALICE_TRADES_ENDPOINT || process.env.ALICE_API_BASE_URL;
  const apiKey = process.env.ALICE_API_KEY;
  const apiSecret = process.env.ALICE_API_SECRET;

  // If endpoint is missing, fall back to seeded master trades
  if (!endpoint) {
    const { trades } = await import('./data');
    return trades.filter(t => t.account === 'Master');
  }

  // Prefer OAuth token if available (env or token file)
  const tokenFromEnv = process.env.ALICE_OAUTH_TOKEN;
  const tokenFile = process.env.ALICE_OAUTH_TOKEN_FILE || '.alice.token';
  let token: string | undefined = tokenFromEnv;

  if (!token && fs.existsSync(tokenFile)) {
    try {
      token = fs.readFileSync(tokenFile, 'utf-8').trim();
    } catch (e) {
      console.warn('Failed reading token file', tokenFile, e);
    }
  }

  // If we don't have API key/secret and we also don't have a token, fallback
  if (!apiKey && !token) {
    const { trades } = await import('./data');
    return trades.filter(t => t.account === 'Master');
  }

  const authMethod = process.env.ALICE_AUTH_METHOD;
  const headers = buildAuthHeaders(apiKey ?? '', apiSecret ?? '', authMethod, endpoint, undefined, token);

  const res = await fetchWithRetry(endpoint, { headers });
  const payload = await res.json().catch(() => ({}));
  const source = payload.trades || payload.data || payload || [];

  const mapped: AliceTrade[] = (Array.isArray(source) ? source : [])
    .map((d: any, idx: number) => ({
      id: d.id ?? d.tradeId ?? `A-${Date.now()}-${idx}`,
      timestamp: d.timestamp ?? d.time ?? new Date().toISOString(),
      account: process.env.ALICE_MASTER_ACCOUNT ?? 'Master',
      symbol: d.symbol ?? d.instrument ?? d.scrip ?? d.ticker ?? '',
      type: d.type ?? 'Market',
      side: d.side ?? d.buySell ?? (d.transactionType === 'SELL' ? 'Sell' : 'Buy'),
      quantity: Number(d.quantity ?? d.qty ?? d.quantityFilled ?? 0),
      price: Number(d.price ?? d.rate ?? d.fillPrice ?? 0),
      status: d.status ?? 'Filled',
    }));

  return mapped;
}
