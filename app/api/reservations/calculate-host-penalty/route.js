import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { reservationId } = await request.json();
    
    if (!reservationId) {
      return NextResponse.json({ error: 'Missing reservationId' }, { status: 400 });
    }

    // Récupérer la réservation
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('id, date_arrivee, total_price, base_price')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Calculer les jours avant l'arrivée
    const arrivalDate = new Date(reservation.date_arrivee);
    const now = new Date();
    const diffTime = arrivalDate - now;
    const daysBeforeArrival = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Déterminer le taux de pénalité selon les règles
    let penaltyRate = 0;
    let reason = '';

    if (daysBeforeArrival < -2 || (daysBeforeArrival >= 0 && daysBeforeArrival < 2)) {
      // < 48h avant OU après l'arrivée
      penaltyRate = 0.50; // 50%
      reason = 'moins de 48h avant ou après l\'arrivée';
    } else if (daysBeforeArrival >= 2 && daysBeforeArrival < 30) {
      // Entre 2 jours et 30 jours
      penaltyRate = 0.25; // 25%
      reason = 'entre 2 et 30 jours avant l\'arrivée';
    } else if (daysBeforeArrival >= 30) {
      // Plus de 30 jours
      penaltyRate = 0.15; // 15%
      reason = 'plus de 30 jours avant l\'arrivée';
    } else {
      // Cas exceptionnel : très après l'arrivée
      penaltyRate = 0.50;
      reason = 'après l\'arrivée';
    }

    // Calculer le montant de la pénalité (basé sur le total de la réservation)
    const penaltyAmount = reservation.total_price * penaltyRate;

    return NextResponse.json({
      success: true,
      penalty: {
        rate: penaltyRate * 100, // Pourcentage
        amount: penaltyAmount,
        reason: reason,
        daysBeforeArrival: daysBeforeArrival,
        totalPrice: reservation.total_price
      }
    });

  } catch (error) {
    console.error('Erreur calcul pénalité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
