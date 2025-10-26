import { computeTaxeSejour } from '../lib/taxeSejour.js';

const res = computeTaxeSejour({
  communeName: 'Paris',
  category: 'non-classe',
  pricePerNightEUR: 120,
  guests: 2,
  nights: 3
});

console.log(JSON.stringify(res, null, 2));
