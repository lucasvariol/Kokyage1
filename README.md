# Kokyage.com — Next.js (pages router)

## Démarrer
```bash
npm install
npm run dev
```

Puis ouvrez http://localhost:3000

## Pages incluses
- `/` Accueil (recherche)
- `/fonctionnement`
- `/logements`
- `/logement/[id]`
- `/faq`
- `/apropos`
- `/inscription`
- `/inscription`
- `/profil`
- `/messages`
- `/reservations`
- `/profil-hote`
- `/ajout-logement`
- `/mentions`
- `/cgu`
- `/privacy`

## Backend ajouté (local)

### 1) Installer et configurer
```bash
cp .env.example .env
# (optionnel) éditer IRON_SESSION_PASSWORD avec une longue chaîne aléatoire
npm install
```

### 2) Init base de données (SQLite)
```bash
npx prisma db push   # crée le fichier prisma/dev.db
npm run db:seed      # ajoute 2 users + 2 listings de démo
```

### 3) Lancer le serveur
```bash
npm run dev
# http://localhost:3000
```

### 4) Tester les endpoints (exemples via curl)
- Inscription :
```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{ "name":"Lucas", "email":"lucas@example.com", "password":"secret123", "role":"TENANT" }'
```

- Connexion (créé un cookie de session) :
```bash
curl -i -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{ "email":"alice@example.com", "password":"password123" }'
```

- Profil connecté :
```bash
curl -X GET http://localhost:3000/api/me
```

- Listings (GET public) :
```bash
curl -X GET http://localhost:3000/api/listings
```

- Créer un listing (POST, nécessite cookie de session) :
```bash
curl -X POST http://localhost:3000/api/listings -H "Content-Type: application/json"   -d '{ "title":"T2 lumineux", "city":"Lyon", "address":"2 Rue X", "pricePerNight":70 }'
```

- Créer une réservation (POST, nécessite cookie de session) :
```bash
curl -X POST http://localhost:3000/api/bookings -H "Content-Type: application/json"   -d '{ "listingId":1, "startDate":"2025-10-01", "endDate":"2025-10-05", "total":280 }'
```

> Pour tester POST authentifiés avec `curl`, récupérez les cookies de la réponse du login (en-tête `set-cookie`) et renvoyez-les avec `-H "Cookie: ..."`. Plus simple : testez via Postman/Insomnia qui gèrent les cookies automatiquement.
# Last updated: 10/26/2025 17:16:47
