import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// GET /api/messages/conversations
// Récupère la liste des conversations (groupées par réservation) pour l'utilisateur connecté
export async function GET(request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options });
          }
        },
      }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer toutes les réservations où l'utilisateur est soit hôte soit voyageur.
    // NB: le voyageur = reservations.user_id.
    // L'hôte peut être reservations.host_id (si rempli) ou listings.owner_id.
    // IMPORTANT: PostgREST ne supporte pas les filtres OR sur des colonnes d'une ressource embarquée
    // (ex: listings.owner_id) => on fait 2 requêtes et on fusionne.

    const reservationSelect = `
      id,
      listing_id,
      user_id,
      host_id,
      date_arrivee,
      date_depart,
      status,
      listings:listing_id (
        owner_id,
        title,
        city,
        images
      )
    `;

    const { data: directReservations, error: directResError } = await supabase
      .from('reservations')
      .select(reservationSelect)
      .or(`user_id.eq.${user.id},host_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (directResError) {
      console.error('Error fetching direct reservations:', directResError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des conversations' }, { status: 500 });
    }

    const { data: ownedListings, error: ownedListingsError } = await supabase
      .from('listings')
      .select('id')
      .eq('owner_id', user.id);

    if (ownedListingsError) {
      console.error('Error fetching owned listings:', ownedListingsError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des conversations' }, { status: 500 });
    }

    const ownedListingIds = (ownedListings || []).map((l) => l.id).filter(Boolean);

    let ownerReservations = [];
    if (ownedListingIds.length > 0) {
      const { data: ownerRes, error: ownerResError } = await supabase
        .from('reservations')
        .select(reservationSelect)
        .in('listing_id', ownedListingIds)
        .order('created_at', { ascending: false });

      if (ownerResError) {
        console.error('Error fetching owner reservations:', ownerResError);
        return NextResponse.json({ error: 'Erreur lors de la récupération des conversations' }, { status: 500 });
      }

      ownerReservations = ownerRes || [];
    }

    // Fusion + déduplication
    const byId = new Map();
    for (const r of [...(directReservations || []), ...ownerReservations]) {
      if (r?.id) byId.set(r.id, r);
    }
    const reservations = Array.from(byId.values());

    // Pour chaque réservation, récupérer le dernier message et les infos de l'autre personne
    const conversationsPromises = (reservations || []).map(async (reservation) => {
      const hostId = reservation.host_id || reservation.listings?.owner_id || null;
      const isHost = hostId === user.id;
      const otherUserId = isHost ? reservation.user_id : hostId;

      // Normalize start/end dates
      const normalizedStart = reservation.date_arrivee || null;
      const normalizedEnd = reservation.date_depart || null;

      if (!otherUserId) {
        return null;
      }

      // Récupérer le profil de l'autre personne
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', otherUserId)
        .single();

      // Récupérer le dernier message de cette conversation
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('message, created_at, sender_id, read')
        .eq('reservation_id', reservation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Compter les messages non lus
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('reservation_id', reservation.id)
        .eq('receiver_id', user.id)
        .eq('read', false);

      // Extract first name if available
      const fullName = otherProfile?.name?.trim() || '';
      const firstName = fullName ? fullName.split(/\s+/)[0] : null;

      return {
        reservationId: reservation.id,
        listingTitle: reservation.listings?.title || 'Logement',
        listingCity: reservation.listings?.city || '',
        listingImage: reservation.listings?.images?.[0] || null,
        otherUserName: firstName || (isHost ? 'Voyageur' : 'Hôte'),
        otherUserId: otherUserId,
        role: isHost ? 'host' : 'guest',
        lastMessage: lastMessage?.message || null,
        lastMessageDate: lastMessage?.created_at || normalizedStart,
        unreadCount: unreadCount || 0,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        status: reservation.status
      };
    });

    const conversations = (await Promise.all(conversationsPromises)).filter(Boolean);

    // Trier par date du dernier message
    conversations.sort((a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate));

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
