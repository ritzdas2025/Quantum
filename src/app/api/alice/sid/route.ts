import { NextResponse, NextRequest } from 'next/server';
import { obtainSessionId } from '@/lib/alice';

export async function POST(req: NextRequest) {
  // Dev-only: only allow when explicitly enabled
  if (String(process.env.ALICE_ALLOW_SID_EXCHANGE || '').toLowerCase() !== 'true') {
    return NextResponse.json({ ok: false, message: 'SID exchange disabled. Set ALICE_ALLOW_SID_EXCHANGE=true to enable (dev only).' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, password, twoFA, appId } = body;
    if (!userId || !password || !twoFA || !appId) {
      return NextResponse.json({ ok: false, message: 'Missing required fields: userId, password, twoFA, appId' }, { status: 400 });
    }

    const sessionId = await obtainSessionId({ userId, password, twoFA, appId });
    // Return masked SID
    const masked = `${sessionId.slice(0, 6)}...${sessionId.slice(-4)}`;
    return NextResponse.json({ ok: true, sessionIdMasked: masked, sessionId: masked });
  } catch (err: any) {
    console.error('SID exchange error:', err);
    return NextResponse.json({ ok: false, message: err?.message ?? 'Unknown error' }, { status: 502 });
  }
}