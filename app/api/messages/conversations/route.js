import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// GET /api/messages/conversations
// Récupère la liste des conversations (groupées par réservation) pour l'utilisateur connecté
export async function GET(request) {
  try {
    const cookieStore = cookies();

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
    // NB: dans le schéma actuel, le voyageur = reservations.user_id.
    // L'hôte peut être reservations.host_id (si rempli) ou listings.owner_id.
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select(`
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
      `)
      .or(`user_id.eq.${user.id},host_id.eq.${user.id},listings.owner_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (resError) {
      console.error('Error fetching reservations:', resError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des conversations' }, { status: 500 });
    }

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
