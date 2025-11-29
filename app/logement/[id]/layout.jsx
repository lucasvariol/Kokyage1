import { supabase } from '@/lib/supabaseClient';

export async function generateMetadata({ params }) {
  const { id } = params;
  
  try {
    // Récupérer les données du logement
    const { data: listing, error } = await supabase
      .from('listings')
      .select('title, description, city, price_per_night, images')
      .eq('id', id)
      .single();

    if (error || !listing) {
      return {
        title: 'Logement - Kokyage',
        description: 'Découvrez ce logement sur Kokyage'
      };
    }

    // Extraire la première image
    const firstImage = Array.isArray(listing.images) 
      ? listing.images[0] 
      : (listing.images ? JSON.parse(listing.images)[0] : null);
    
    const imageUrl = firstImage || 'https://kokyage.com/logo.png';

    return {
      title: `${listing.title} - ${listing.city} | Kokyage`,
      description: listing.description?.substring(0, 160) || `Logement à ${listing.city} dès ${listing.price_per_night}€/nuit. Sous-location légale avec accord propriétaire.`,
      openGraph: {
        title: listing.title,
        description: listing.description?.substring(0, 200) || `Logement à ${listing.city} - ${listing.price_per_night}€/nuit`,
        url: `https://kokyage.com/logement/${id}`,
        siteName: 'Kokyage',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: listing.title,
          }
        ],
        locale: 'fr_FR',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: listing.title,
        description: listing.description?.substring(0, 200) || `Logement à ${listing.city}`,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Logement - Kokyage',
      description: 'Découvrez ce logement sur Kokyage'
    };
  }
}

export default function LogementLayout({ children }) {
  return children;
}
