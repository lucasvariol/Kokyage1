/**
 * Schémas de validation pour les API Kokyage
 * 
 * Utilise Zod pour validation stricte des inputs utilisateur
 * Protection contre: injection SQL, XSS, données malformées
 */

import { z } from 'zod';

/**
 * TYPES DE BASE
 */

// UUID valide (Supabase/PostgreSQL)
export const uuidSchema = z.string().uuid({
  message: "ID invalide"
});

// Date ISO 8601
export const dateSchema = z.string().datetime({
  message: "Format de date invalide"
});

// Email valide
export const emailSchema = z.string().email({
  message: "Email invalide"
}).toLowerCase();

// Prix positif (en euros, max 100000€)
export const priceSchema = z.number()
  .positive({ message: "Le prix doit être positif" })
  .max(100000, { message: "Prix trop élevé" });

// Texte sécurisé (pas de balises HTML)
export const safeTextSchema = z.string()
  .min(1, { message: "Champ requis" })
  .max(1000, { message: "Texte trop long" })
  .refine(
    (val) => !/<script|<iframe|javascript:|on\w+=/i.test(val),
    { message: "Contenu non autorisé détecté" }
  );

// Description longue (max 5000 caractères)
export const longTextSchema = z.string()
  .min(10, { message: "Description trop courte (min 10 caractères)" })
  .max(5000, { message: "Description trop longue (max 5000 caractères)" })
  .refine(
    (val) => !/<script|<iframe|javascript:|on\w+=/i.test(val),
    { message: "Contenu non autorisé détecté" }
  );

// Numéro de téléphone français
export const phoneSchema = z.string()
  .regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, {
    message: "Numéro de téléphone invalide"
  });

// Code postal français
export const postalCodeSchema = z.string()
  .regex(/^[0-9]{5}$/, {
    message: "Code postal invalide"
  });

/**
 * RÉSERVATIONS
 */

export const createReservationSchema = z.object({
  listingId: z.number().int().positive(),
  guestId: uuidSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  guests: z.number().int().min(1).max(20, {
    message: "Maximum 20 voyageurs"
  }),
  basePrice: priceSchema,
  taxPrice: priceSchema.optional(),
  totalPrice: priceSchema,
  transactionId: z.string().min(10),
  cautionIntentId: z.string().optional(),
  paymentMethodId: z.string().min(10),
  refund50PercentDate: dateSchema.optional(),
  refund0PercentDate: dateSchema.optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "La date de fin doit être après la date de début",
    path: ["endDate"]
  }
);

export const cancelReservationSchema = z.object({
  reservationId: z.number().int().positive(),
  reason: safeTextSchema.optional(),
});

/**
 * LISTINGS (LOGEMENTS)
 */

export const createListingSchema = z.object({
  title: z.string().min(10).max(100),
  description: longTextSchema,
  type: z.enum(['appartement', 'maison', 'studio', 'chambre']),
  city: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
  postalCode: postalCodeSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  pricePerNight: priceSchema,
  maxGuests: z.number().int().min(1).max(20),
  bedrooms: z.number().int().min(0).max(20),
  beds: z.number().int().min(1).max(50),
  bathrooms: z.number().int().min(1).max(10),
  surface: z.number().int().min(9).max(1000).optional(),
  amenities: z.array(z.string()).max(50).optional(),
  houseRules: longTextSchema.optional(),
  ownerEmail: emailSchema.optional(),
});

/**
 * REVIEWS (AVIS)
 */

export const createReviewSchema = z.object({
  reservationId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5, {
    message: "Note entre 1 et 5"
  }),
  comment: z.string().min(20, {
    message: "Avis trop court (minimum 20 caractères)"
  }).max(2000, {
    message: "Avis trop long (maximum 2000 caractères)"
  }),
  cleanliness: z.number().int().min(1).max(5).optional(),
  accuracy: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  location: z.number().int().min(1).max(5).optional(),
  checkin: z.number().int().min(1).max(5).optional(),
  value: z.number().int().min(1).max(5).optional(),
});

/**
 * MESSAGES
 */

export const sendMessageSchema = z.object({
  reservationId: z.number().int().positive(),
  content: z.string()
    .min(1, { message: "Message vide" })
    .max(2000, { message: "Message trop long (max 2000 caractères)" })
    .refine(
      (val) => !/<script|<iframe|javascript:|on\w+=/i.test(val),
      { message: "Contenu non autorisé" }
    ),
});

// Alternative pour message avec juste text
export const sendMessageSimpleSchema = z.object({
  message: z.string()
    .min(1, { message: "Message vide" })
    .max(2000, { message: "Message trop long" })
    .refine(
      (val) => !/<script|<iframe|javascript:|on\w+=/i.test(val),
      { message: "Contenu suspect" }
    ),
});

/**
 * LISTINGS VALIDATION
 */

export const validateListingSchema = z.object({
  listingId: z.number().int().positive(),
  action: z.enum(['approve', 'reject']).optional(),
});

/**
 * HOST ACTIONS
 */

export const hostValidateReservationSchema = z.object({
  reservationId: z.number().int().positive(),
  hostValidation: z.boolean(),
});

export const hostRejectReservationSchema = z.object({
  reservationId: z.number().int().positive(),
  reason: z.string().min(10).max(500).optional(),
});

export const hostCancelReservationSchema = z.object({
  reservationId: z.number().int().positive(),
  reason: z.string().min(10).max(500),
});

/**
 * AUTHENTICATION
 */

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  listingId: z.number().int().positive().optional(),
});

/**
 * CHATBOT
 */

export const chatbotSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(10000),
  })).min(1).max(50),
  userProfile: z.any().optional(),
  assistanceType: z.enum(['price', 'description', 'general']).optional(),
});

/**
 * PAIEMENT
 */

export const createPaymentSchema = z.object({
  amount: z.number()
    .positive()
    .max(100000, { message: "Montant trop élevé" })
    .refine(
      (val) => Number.isInteger(val * 100),
      { message: "Montant invalide (max 2 décimales)" }
    ),
  currency: z.enum(['eur']),
  paymentMethodId: z.string().startsWith('pm_'),
  userId: uuidSchema.optional(),
  userEmail: emailSchema.optional(),
  listingId: z.number().int().positive().optional(),
  metadata: z.record(z.string()).optional(),
});

/**
 * AUTHENTIFICATION
 */

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, { message: "Mot de passe trop court (min 8 caractères)" })
    .max(100)
    .regex(/[A-Z]/, { message: "Doit contenir une majuscule" })
    .regex(/[a-z]/, { message: "Doit contenir une minuscule" })
    .regex(/[0-9]/, { message: "Doit contenir un chiffre" }),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: phoneSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Mot de passe requis" }),
});

/**
 * HELPER FUNCTION
 * Valide des données et retourne une réponse d'erreur formatée si invalide
 */
export function validateOrError(schema, data) {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error?.errors?.map(err => ({
      field: err.path.join('.'),
      message: err.message
    })) || [];
    
    return {
      valid: false,
      errors,
      message: errors[0]?.message || 'Validation error' // Premier message d'erreur
    };
  }
  
  return {
    valid: true,
    data: result.data
  };
}

/**
 * MIDDLEWARE VALIDATOR
 * À utiliser dans les routes API
 * 
 * Exemple d'utilisation:
 * 
 * import { createReservationSchema, validateOrError } from '@/lib/validators';
 * 
 * export async function POST(request) {
 *   const body = await request.json();
 *   
 *   const validation = validateOrError(createReservationSchema, body);
 *   if (!validation.valid) {
 *     return NextResponse.json(
 *       { error: validation.message, errors: validation.errors },
 *       { status: 400 }
 *     );
 *   }
 *   
 *   const data = validation.data; // Données validées et typées
 *   // ... suite du traitement
 * }
 */
