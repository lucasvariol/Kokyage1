import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const ATTACHMENT_PREFIX = '__KOKYAGE_ATTACHMENT__:';

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
    const contentType = request.headers.get('content-type') || '';

    let messageRaw = '';
    let file = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const formMessage = form.get('message');
      if (typeof formMessage === 'string') messageRaw = formMessage;
      const maybeFile = form.get('file');
      if (maybeFile && typeof maybeFile === 'object' && typeof maybeFile.arrayBuffer === 'function') {
        file = maybeFile;
      }
    } else {
      const body = await request.json();
      const jsonMessage = body?.message;
      if (typeof jsonMessage === 'string') messageRaw = jsonMessage;
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

    const hasText = typeof messageRaw === 'string' && messageRaw.trim().length > 0;
    const hasFile = !!file;

    if (!hasText && !hasFile) {
      return NextResponse.json({ error: 'Message ou fichier manquant' }, { status: 400 });
    }

    // Upload éventuel de fichier
    let attachment = null;
    if (hasFile) {
      const maxBytes = 10 * 1024 * 1024; // 10MB
      if (typeof file.size === 'number' && file.size > maxBytes) {
        return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 });
      }

      const originalName = typeof file.name === 'string' ? file.name : 'fichier';
      const safeName = originalName.replace(/[^A-Za-z0-9_.-]/g, '_');
      const path = `messages/${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        });

      if (uploadError) {
        console.error('Error uploading attachment:', uploadError);
        return NextResponse.json({ error: "Erreur lors de l'envoi du fichier" }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(path);

      attachment = {
        url: publicUrlData?.publicUrl || null,
        name: originalName,
        type: file.type || null,
        size: typeof file.size === 'number' ? file.size : null,
      };

      if (!attachment.url) {
        return NextResponse.json({ error: "Erreur lors de la génération du lien du fichier" }, { status: 500 });
      }
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

    const messageToStore = attachment
      ? `${ATTACHMENT_PREFIX}${JSON.stringify({ text: hasText ? messageRaw.trim() : '', attachment })}`
      : messageRaw.trim();

    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        reservation_id: reservationId,
        sender_id: user.id,
        receiver_id: otherUserId,
        message: messageToStore,
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
