import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// GET /api/messages/conversations
// Récupère la liste des conversations (groupées par interlocuteur) pour l'utilisateur connecté
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
      created_at,
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

    // Grouper par interlocuteur (otherUserId)
    const conversationMap = new Map();
    const reservationToOtherUser = new Map();

    for (const reservation of reservations || []) {
      const hostId = reservation.host_id || reservation.listings?.owner_id || null;
      const isHost = hostId === user.id;
      const otherUserId = isHost ? reservation.user_id : hostId;
      if (!otherUserId) continue;

      reservationToOtherUser.set(reservation.id, otherUserId);

      const existing = conversationMap.get(otherUserId);
      const reservationCreatedAt = reservation.created_at ? new Date(reservation.created_at).getTime() : 0;

      if (!existing) {
        conversationMap.set(otherUserId, {
          otherUserId,
          role: isHost ? 'host' : 'guest',
          reservationIds: [reservation.id],
          displayReservation: reservation,
          displayReservationCreatedAt: reservationCreatedAt,
        });
      } else {
        existing.reservationIds.push(reservation.id);

        // Conserver une réservation représentative (la plus récente) pour l'affichage
        if (reservationCreatedAt >= existing.displayReservationCreatedAt) {
          existing.displayReservation = reservation;
          existing.displayReservationCreatedAt = reservationCreatedAt;
          existing.role = isHost ? 'host' : 'guest';
        }
      }
    }

    const otherUserIds = Array.from(conversationMap.keys());
    const allReservationIds = Array.from(new Set(
      Array.from(conversationMap.values()).flatMap((c) => c.reservationIds)
    ));

    // Charger les profils en une requête
    const profilesById = new Map();
    if (otherUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, photo_url')
        .in('id', otherUserIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return NextResponse.json({ error: 'Erreur lors de la récupération des conversations' }, { status: 500 });
      }

      for (const p of profiles || []) profilesById.set(p.id, p);
    }

    // Dernier message par interlocuteur (sur toutes les réservations)
    const lastMessageByOtherUser = new Map();
    if (allReservationIds.length > 0) {
      const { data: recentMessages, error: recentMessagesError } = await supabase
        .from('messages')
        .select('reservation_id, message, created_at, sender_id, receiver_id, read')
        .in('reservation_id', allReservationIds)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (recentMessagesError) {
        console.error('Error fetching recent messages:', recentMessagesError);
        return NextResponse.json({ error: 'Erreur lors de la récupération des conversations' }, { status: 500 });
      }

      for (const m of recentMessages || []) {
        const otherUserId = reservationToOtherUser.get(m.reservation_id);
        if (!otherUserId) continue;
        if (!lastMessageByOtherUser.has(otherUserId)) {
          lastMessageByOtherUser.set(otherUserId, m);
        }
      }
    }

    // Messages non lus par interlocuteur (agrégation côté code)
    const unreadCountByOtherUser = new Map();
    if (allReservationIds.length > 0) {
      const { data: unreadRows, error: unreadError } = await supabase
        .from('messages')
        .select('id, reservation_id')
        .in('reservation_id', allReservationIds)
        .eq('receiver_id', user.id)
        .eq('read', false)
        .limit(5000);

      if (unreadError) {
        console.error('Error fetching unread messages:', unreadError);
        return NextResponse.json({ error: 'Erreur lors de la récupération des conversations' }, { status: 500 });
      }

      for (const row of unreadRows || []) {
        const otherUserId = reservationToOtherUser.get(row.reservation_id);
        if (!otherUserId) continue;
        unreadCountByOtherUser.set(otherUserId, (unreadCountByOtherUser.get(otherUserId) || 0) + 1);
      }
    }

    const conversations = otherUserIds.map((otherUserId) => {
      const c = conversationMap.get(otherUserId);
      const reservation = c?.displayReservation;
      const last = lastMessageByOtherUser.get(otherUserId);

      const fullName = profilesById.get(otherUserId)?.name?.trim() || '';
      const firstName = fullName ? fullName.split(/\s+/)[0] : null;
      const otherUserPhotoUrl = profilesById.get(otherUserId)?.photo_url || null;

      const normalizedStart = reservation?.date_arrivee || null;
      const normalizedEnd = reservation?.date_depart || null;

      return {
        // Identifiant du thread = interlocuteur
        threadId: otherUserId,

        // Contexte (affichage)
        reservationIds: c?.reservationIds || [],
        listingTitle: reservation?.listings?.title || 'Logement',
        listingCity: reservation?.listings?.city || '',
        listingImage: reservation?.listings?.images?.[0] || null,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        status: reservation?.status,

        // Interlocuteur
        otherUserId,
        otherUserName: firstName || (c?.role === 'host' ? 'Voyageur' : 'Hôte'),
        otherUserPhotoUrl,
        role: c?.role || 'guest',

        // Dernier message
        lastMessage: last?.message || null,
        lastMessageDate: last?.created_at || normalizedStart,
        unreadCount: unreadCountByOtherUser.get(otherUserId) || 0,
      };
    });

    // Trier par date du dernier message
    conversations.sort((a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate));

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
