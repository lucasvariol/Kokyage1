import { NextResponse } from 'next/server';
import { computeTaxeSejour } from '@/lib/taxeSejour';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      communeName,
      inseeCode,
      category = 'non-classe',
      pricePerNightEUR,
      guests,
      nights,
      adults
    } = body || {};

    const {
      perNightTax,
      totalTax,
      perNightTotalWithAdditions,
      totalWithAdditions,
      departmentAddPerNight,
      regionAddPerNight,
      appliedRule,
      appliedAdditions
    } = computeTaxeSejour({
      communeName,
      inseeCode,
      category,
      pricePerNightEUR,
      guests,
      nights,
      assumedAdults: adults
    });

    return NextResponse.json({
      ok: true,
      perNightTax,
      totalTax,
      perNightTotalWithAdditions,
      totalWithAdditions,
      departmentAddPerNight,
      regionAddPerNight,
      appliedRule,
      appliedAdditions
    });
  } catch (e) {
    console.error('taxe-sejour/calc error:', e);
    return NextResponse.json({ ok: false, error: 'Server error computing tourist tax' }, { status: 500 });
  }
}
