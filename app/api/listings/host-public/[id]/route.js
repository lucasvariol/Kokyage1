import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Public endpoint: returns minimal host profile info for a published listing
export async function GET(_req, { params }) {
  const listingId = params.id;
  if (!listingId) {
    return NextResponse.json({ error: 'Missing listing id' }, { status: 400 });
  }
  try {
    // Fetch listing to get owner identifiers
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, owner_id, id_proprietaire')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const hostId = listing.owner_id || listing.id_proprietaire;
    if (!hostId) {
      return NextResponse.json({ error: 'Host id missing on listing' }, { status: 404 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, prenom, full_name, name, photo_url')
      .eq('id', hostId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Host profile not found' }, { status: 404 });
    }

    // Derive first name
    let firstName = 'Hôte';
    if (profile.prenom) firstName = profile.prenom.split(' ')[0];
    else if (profile.full_name) firstName = profile.full_name.split(' ')[0];
    else if (profile.name) firstName = profile.name.split(' ')[0];

    const host = {
      id: profile.id,
      prenom: firstName,
      photo_url: profile.photo_url || null
    };

    return NextResponse.json({ host }, { status: 200 });
  } catch (e) {
    console.error('Public host fetch error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
