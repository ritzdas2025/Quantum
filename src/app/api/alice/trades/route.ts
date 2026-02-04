import { NextResponse } from 'next/server';
import { getMasterTrades } from '@/lib/alice';

export async function GET() {
  try {
    const trades = await getMasterTrades();
    return NextResponse.json({ trades });
  } catch (error: any) {
    console.error('Failed to fetch Alice trades:', error);
    const msg = error?.message ?? 'Unknown error';

    // If the error contains an upstream HTTP status (e.g., "HTTP 502: ..."), bubble it up
    const m = msg.match(/HTTP (\d{3})/);
    const status = m ? Number(m[1]) : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}
