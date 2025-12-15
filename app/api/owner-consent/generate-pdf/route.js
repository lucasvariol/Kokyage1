import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateOwnerConsentPDF } from '@/lib/generateOwnerConsentPDF';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier si c'est un appel interne avec SERVICE_ROLE_KEY
    const isServiceRole = token === process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Si ce n'est pas un appel de service, vérifier l'authentification utilisateur
    let userId = null;
    if (!isServiceRole) {
      const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
      if (userErr || !userRes?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = userRes.user.id;
    }

    const { listingId } = await request.json();
    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    // Vérifier les permissions seulement si ce n'est pas un appel de service
    if (!isServiceRole && userId) {
      const { data: listing, error: listingError } = await supabaseAdmin
        .from('listings')
        .select('owner_id, id_proprietaire')
        .eq('id', listingId)
        .single();

      if (listingError || !listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }

      if (listing.owner_id !== userId && listing.id_proprietaire !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Générer le PDF en utilisant la fonction utilitaire
    const result = await generateOwnerConsentPDF(listingId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'PDF generated and saved successfully'
    });

  } catch (error) {
    console.error('Error in generate-pdf route:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
      })
      .eq('id', listingId);

    if (updateError) {
      console.error('Erreur sauvegarde PDF:', updateError);
      return NextResponse.json({ error: 'Failed to save PDF' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pdfBase64,
      message: 'PDF généré et sauvegardé'
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
