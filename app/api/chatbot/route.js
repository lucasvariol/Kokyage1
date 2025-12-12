import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Vous devrez installer openai: npm install openai
// Et ajouter votre clé API dans .env.local: OPENAI_API_KEY=sk-...

export async function POST(request) {
  try {
    const { messages, userProfile, assistanceType } = await request.json();

    // Vérifier si la clé API OpenAI est configurée en premier
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        message: "⚠️ Le chatbot n'est pas encore configuré. Pour l'activer, ajoutez votre clé API OpenAI dans les variables d'environnement.\n\nEn attendant, n'hésitez pas à consulter notre FAQ ou à nous contacter directement !"
      });
    }

    // Charger le contexte depuis les fichiers
    const contextDir = path.join(process.cwd(), 'chatbot-context');
    
    let systemPrompt = '';
    let faqContent = '';
    let legalInfo = '';
    let listingAssistantContext = '';

    try {
      // Si c'est l'assistant de création d'annonce, charger son contexte spécifique
      if (assistanceType === 'price' || assistanceType === 'description') {
        try {
          listingAssistantContext = fs.readFileSync(path.join(contextDir, 'listing-assistant.txt'), 'utf-8');
        } catch (e) {
          console.warn('listing-assistant.txt non trouvé');
        }
      } else {
        // Sinon charger le contexte normal
        try {
          systemPrompt = fs.readFileSync(path.join(contextDir, 'system-prompt.txt'), 'utf-8');
        } catch (e) {
          console.warn('system-prompt.txt non trouvé');
          systemPrompt = 'Tu es un assistant virtuel pour Kokyage, une plateforme de sous-location de logements entre locataires et propriétaires.';
        }
        
        try {
          faqContent = fs.readFileSync(path.join(contextDir, 'faq.txt'), 'utf-8');
        } catch (e) {
          console.warn('faq.txt non trouvé');
          faqContent = '';
        }
        
        // Charger les infos légales si le fichier existe
        try {
          legalInfo = fs.readFileSync(path.join(contextDir, 'legal-info.txt'), 'utf-8');
        } catch (e) {
          console.warn('legal-info.txt non trouvé');
          legalInfo = '';
        }
      }
    } catch (error) {
      console.warn('Impossible de charger les fichiers de contexte:', error);
      // Continuer avec un contexte par défaut
      systemPrompt = systemPrompt || 'Tu es un assistant virtuel pour Kokyage, une plateforme de sous-location de logements entre locataires et propriétaires.';
    }

    // Adapter le contexte selon le type d'assistance ou le profil utilisateur
    let profileContext = '';
    
    if (listingAssistantContext) {
      // Mode assistant de création d'annonce
      profileContext = listingAssistantContext;
    } else if (userProfile === 'proprietaire') {
      profileContext = '\n\nL\'utilisateur est un PROPRIÉTAIRE. Concentre tes réponses sur :\n- Comment autoriser la sous-location\n- Les revenus passifs (40%)\n- Les garanties et protections\n- Le contrôle et la possibilité d\'annuler\n- La non-gestion des voyageurs';
    } else if (userProfile === 'locataire') {
      profileContext = '\n\nL\'utilisateur est un LOCATAIRE. Concentre tes réponses sur :\n- Comment demander l\'autorisation au propriétaire\n- Les revenus (60%)\n- Comment publier et gérer son logement\n- Les garanties en cas de dégâts\n- Le processus de réservation';
    } else if (userProfile === 'voyageur') {
      profileContext = '\n\nL\'utilisateur est un VOYAGEUR. Concentre tes réponses sur :\n- La différence avec Airbnb\n- Comment trouver et réserver un logement\n- L\'assurance et les garanties\n- Les tarifs et frais\n- L\'authenticité des logements';
    }

    // Construction du contexte complet
    const fullSystemPrompt = listingAssistantContext 
      ? profileContext  // Pour l'assistant de listing, utiliser uniquement son contexte
      : `${systemPrompt}${profileContext}

BASE DE CONNAISSANCES FAQ:
${faqContent}

${legalInfo ? `INFORMATIONS LÉGALES:\n${legalInfo}\n` : ''}
Réponds toujours en français, de manière amicale et professionnelle.`;

    // Appel à l'API OpenAI
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ou "gpt-3.5-turbo" pour une version moins chère
      messages: [
        { role: 'system', content: fullSystemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0].message.content;

    return NextResponse.json({
      message: assistantMessage
    });

  } catch (error) {
    console.error('Erreur API chatbot:', error);
    console.error('Détails de l\'erreur:', error.message);
    console.error('Stack:', error.stack);
    
    // Message d'erreur plus détaillé pour le développement
    let errorMessage = "❌ Désolé, une erreur s'est produite.";
    
    if (error.message?.includes('API key')) {
      errorMessage = "❌ Erreur : Clé API OpenAI invalide. Vérifiez votre fichier .env.local";
    } else if (error.message?.includes('quota')) {
      errorMessage = "❌ Erreur : Quota OpenAI dépassé. Vérifiez votre compte sur platform.openai.com";
    } else if (error.message?.includes('rate limit')) {
      errorMessage = "❌ Erreur : Trop de requêtes. Réessayez dans quelques secondes.";
    } else if (process.env.NODE_ENV === 'development') {
      errorMessage = `❌ Erreur technique : ${error.message}`;
    }
    
    return NextResponse.json({
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
