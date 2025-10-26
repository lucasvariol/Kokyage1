import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// GET /api/messages/[reservationId]
// Récupère tous les messages d'une conversation
export async function GET(request, { params }) {
  try {
    const { reservationId } = params;
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

    // Vérifier que l'utilisateur a accès à cette réservation
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('user_id, host_id')
      .eq('id', reservationId)
      .single();

    if (resError || !reservation) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

    if (reservation.user_id !== user.id && reservation.host_id !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer tous les messages
    // Fetch messages without profile join (to avoid FK/relationship issues)
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select(
        'id, message, sender_id, receiver_id, read, created_at'
      )
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: true });

    if (msgError) {
  console.error('Error fetching messages:', msgError);
  return NextResponse.json({ error: 'Erreur lors de la récupération des messages' }, { status: 500 });
    }

    // Marquer les messages reçus comme lus
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('reservation_id', reservationId)
      .eq('receiver_id', user.id)
      .eq('read', false);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/messages/[reservationId]
// Envoie un nouveau message
export async function POST(request, { params }) {
  try {
    const { reservationId } = params;
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Le message ne peut pas être vide' }, { status: 400 });
    }

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

    // Vérifier que l'utilisateur a accès à cette réservation et déterminer le receiver
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('user_id, host_id')
      .eq('id', reservationId)
      .single();

    if (resError || !reservation) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

    if (reservation.user_id !== user.id && reservation.host_id !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const receiverId = reservation.user_id === user.id ? reservation.host_id : reservation.user_id;

    // Insérer le message
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        reservation_id: reservationId,
        sender_id: user.id,
        receiver_id: receiverId,
        message: message.trim()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json({ error: 'Erreur lors de l\'envoi du message' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error in send message API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
