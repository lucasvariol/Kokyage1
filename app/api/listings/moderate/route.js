import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  try {
    // AuthZ: require Supabase access token and restrict to a single moderator email
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const moderatorEmail = 'lucas.variol@gmail.com';
    if (userRes.user.email !== moderatorEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { listingId, action } = await req.json();
    if (!listingId) return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });

    let newStatus = 'validé modérateur';
    if (action === 'reject') newStatus = 'refusé modérateur';

    const { error } = await supabaseAdmin
      .from('listings')
      .update({ status: newStatus })
      .eq('id', listingId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (e) {
    console.error('moderate route error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
