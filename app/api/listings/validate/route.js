import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { validateListingSchema, validateOrError } from '@/lib/validators';
import logger from '@/lib/logger';

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validation
    const validation = validateOrError(validateListingSchema, body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }
    
    const { listingId, action } = validation.data;
    logger.api('POST', '/api/listings/validate', { listingId, action });

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
