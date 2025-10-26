import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    
    if (!listingId) {
      return NextResponse.json({ error: 'listingId requis' }, { status: 400 });
    }

    // Récupérer toutes les disponibilités pour ce listing
    const { data: availabilities, error } = await supabase
      .from('disponibilities')
      .select('*')
      .eq('listing_id', listingId)
      .order('date');

    if (error) {
      console.error('Erreur lors de la récupération des disponibilités:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Grouper par statut
    const bookedDates = availabilities.filter(a => a.booked === 'Yes');
    const availableDates = availabilities.filter(a => a.booked !== 'Yes');

    return NextResponse.json({
      success: true,
      data: {
        total: availabilities.length,
        booked: bookedDates.length,
        available: availableDates.length,
        bookedDates: bookedDates.map(d => d.date),
        availableDates: availableDates.map(d => d.date),
        allAvailabilities: availabilities
      }
    });

  } catch (error) {
    console.error('Erreur API availabilities:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}