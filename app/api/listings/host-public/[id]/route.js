import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Public endpoint: returns minimal host profile info for a published listing
export async function GET(_req, { params }) {
  const { id: listingId } = await params;
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

    // Derive first name (avoid displaying emails)
    const isEmail = (str) => str && str.includes('@') && str.includes('.');
    let firstName = null;
    
    // Try to get name from profile fields
    if (profile.prenom && !isEmail(profile.prenom)) firstName = profile.prenom.split(' ')[0];
    else if (profile.full_name && !isEmail(profile.full_name)) firstName = profile.full_name.split(' ')[0];
    else if (profile.name && !isEmail(profile.name)) firstName = profile.name.split(' ')[0];
    
    // Fallback to user metadata if no valid name in profile
    if (!firstName) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(hostId);
        const user = userData?.user;
        if (user) {
          const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
          if (metaName && !isEmail(metaName)) {
            firstName = metaName.split(' ')[0];
          }
        }
      } catch (e) {
        console.warn('Could not fetch user metadata:', e);
      }
    }
    
    // Final fallback
    if (!firstName) firstName = 'Hôte';

    // Get reservations count for this listing
    const { count: reservationsCount } = await supabaseAdmin
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    const host = {
      id: profile.id,
      prenom: firstName,
      photo_url: profile.photo_url || null
    };

    return NextResponse.json({ 
      host, 
      reservationsCount: reservationsCount || 0 
    }, { status: 200 });
  } catch (e) {
    console.error('Public host fetch error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
