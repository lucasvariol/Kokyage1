import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// GET /api/messages/thread/[otherUserId]
// Récupère tous les messages d'un fil (conversation) entre l'utilisateur connecté et otherUserId
export async function GET(request, { params }) {
  try {
    const { otherUserId } = await params;
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
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!otherUserId || typeof otherUserId !== 'string') {
      return NextResponse.json({ error: 'otherUserId manquant' }, { status: 400 });
    }

    // Messages entre user et otherUserId (dans les deux sens)
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, reservation_id, message, sender_id, receiver_id, read, created_at')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Error fetching thread messages:', msgError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des messages' }, { status: 500 });
    }

    // Marquer comme lus les messages reçus
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', user.id)
      .eq('read', false);

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in thread messages API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/messages/thread/[otherUserId]
// Envoie un message dans un fil (conversation) entre user et otherUserId
export async function POST(request, { params }) {
  try {
    const { otherUserId } = await params;
    const body = await request.json();
    const messageRaw = body?.message;

    if (!messageRaw || typeof messageRaw !== 'string' || !messageRaw.trim()) {
      return NextResponse.json({ error: 'Message manquant' }, { status: 400 });
    }

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
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!otherUserId || typeof otherUserId !== 'string') {
      return NextResponse.json({ error: 'otherUserId manquant' }, { status: 400 });
    }

    // Tenter d'associer le message à la réservation la plus récente entre ces 2 utilisateurs.
    // hostId est reservations.host_id OU listings.owner_id.
    const { data: candidateReservations, error: resError } = await supabase
      .from('reservations')
      .select('id, user_id, host_id, created_at, listings:listing_id(owner_id)')
      .or(`user_id.eq.${user.id},user_id.eq.${otherUserId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (resError) {
      console.warn('⚠️ Unable to fetch reservations for thread association:', resError);
    }

    let reservationId = null;
    for (const r of candidateReservations || []) {
      const hostId = r.host_id || r.listings?.owner_id || null;
      const guestId = r.user_id;
      const isMatch =
        (guestId === user.id && hostId === otherUserId) ||
        (guestId === otherUserId && hostId === user.id);
      if (isMatch) {
        reservationId = r.id;
        break;
      }
    }

    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        reservation_id: reservationId,
        sender_id: user.id,
        receiver_id: otherUserId,
        message: messageRaw.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting thread message:', insertError);
      return NextResponse.json({ error: "Erreur lors de l'envoi du message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error in thread send API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
