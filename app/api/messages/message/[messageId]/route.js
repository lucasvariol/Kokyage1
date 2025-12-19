import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// DELETE /api/messages/message/[messageId]
// Supprime un message (uniquement par son auteur)
export async function DELETE(request, { params }) {
  try {
    const { messageId } = await params;
    const cookieStore = await cookies();

    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json({ error: 'messageId manquant' }, { status: 400 });
    }

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

    const { data: msg, error: fetchError } = await supabase
      .from('messages')
      .select('id, sender_id')
      .eq('id', messageId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching message for delete:', fetchError);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    if (!msg) {
      return NextResponse.json({ error: 'Message introuvable' }, { status: 404 });
    }

    if (msg.sender_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id);

    if (deleteError) {
      console.error('Error deleting message:', deleteError);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in message delete API:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
