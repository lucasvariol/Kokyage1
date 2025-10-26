import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  try {
    const { listingId, action } = await req.json();
    if (!listingId) return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });

    let newStatus = 'validé propriétaire';
    if (action === 'reject') newStatus = 'refusé propriétaire';

    const { error } = await supabaseAdmin
      .from('listings')
      .update({ status: newStatus })
      .eq('id', listingId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (e) {
    console.error('validate route error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
