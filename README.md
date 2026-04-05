# L-W Trade — Plateforme de Trading

Application web de trading simulee construite avec **Vue 3** (frontend) et **Fastify** (backend), en architecture monorepo.

## Demarrage rapide

### Prerequis

- **Node.js 20+** (recommande : 22 ou 24)
- **npm** (inclus avec Node.js)
- **MongoDB** au choix :
  - **Option A** : [MongoDB Atlas](https://cloud.mongodb.com) (gratuit, aucune installation)
  - **Option B** : Docker avec le `docker-compose.yml` fourni

Verification :

```bash
node -v   # v20+ requis
npm -v
```

### Installation

```bash
git clone <url-du-repo>
cd Project-Web-Dev-A4-main
npm install
```

Cette commande installe les dependances de la racine, du client et du serveur (workspaces npm).

### Configuration

Copiez le fichier d'exemple et remplissez-le :

```bash
cp server/.env.example server/.env.development.local
```

Editez `server/.env.development.local` et renseignez au minimum `MONGODB_URI`.

**Avec MongoDB Atlas (le plus simple) :**

1. Creez un compte gratuit sur [cloud.mongodb.com](https://cloud.mongodb.com)
2. Creez un cluster (gratuit M0)
3. Ajoutez votre IP dans Network Access (ou `0.0.0.0/0` pour autoriser tout)
4. Creez un utilisateur base de donnees
5. Copiez la connection string dans `MONGODB_URI`

**Avec Docker :**

```bash
docker compose up -d
```

Puis utilisez dans le `.env.development.local` :

```
MONGODB_URI=mongodb://stan:stan@localhost:35115/myapp?authSource=myapp
```

### Lancement

```bash
npm run dev
```

Cela lance en parallele :
- **Frontend** (Vue 3 + Vite) sur [http://localhost:5173](http://localhost:5173)
- **Backend** (Fastify) sur [http://localhost:3000](http://localhost:3000)

Le proxy Vite redirige `/api/*` vers le backend automatiquement.

Au premier lancement, le backend genere automatiquement les donnees de marche (actions, cryptos, indices).

### Commandes utiles

| Commande | Description |
|---|---|
| `npm run dev` | Lance client + serveur en parallele |
| `npm run lint` | Lint du code (client + serveur) |
| `cd client && npm run build` | Build de production du frontend |
| `cd client && npm run test:unit` | Tests unitaires |

## Architecture

```
.
├── client/                # Frontend Vue 3
│   ├── src/
│   │   ├── components/    # Composants reutilisables (AppNav, StockChart, etc.)
│   │   ├── pages/         # Pages (Dashboard, Portfolio, Transactions, etc.)
│   │   ├── stores/        # Stores Pinia (auth, stocks, portfolio)
│   │   ├── router/        # Configuration Vue Router
│   │   └── api.js         # Helper fetch centralise
│   └── vite.config.js     # Config Vite + proxy API
│
├── server/                # Backend Fastify
│   ├── src/
│   │   ├── plugins/       # Plugins Fastify (auth JWT, mongoose)
│   │   ├── users/         # Routes et schemas utilisateurs
│   │   ├── stocks/        # Routes, schemas et seed des actifs
│   │   ├── services/      # Mailer, SL/TP checker, daily summary
│   │   ├── config.js      # Configuration centralisee
│   │   └── app.js         # Point d'entree Fastify
│   └── .env.example       # Variables d'environnement (a copier)
│
├── docker-compose.yml     # MongoDB local (optionnel)
├── turbo.json             # Orchestration Turborepo
└── package.json           # Monorepo npm workspaces
```

## Stack technique

### Frontend
- **Vue 3** avec Composition API (`<script setup>`)
- **Vite** (bundler + dev server)
- **Vue Router** (routage SPA)
- **Pinia** (gestion d'etat)
- **Chart.js** + **vue-chartjs** (graphiques ligne + bougies)

### Backend
- **Fastify** (API REST)
- **Mongoose** (ODM MongoDB)
- **@fastify/jwt** + **@fastify/cookie** (authentification par cookie JWT)
- **@fastify/cors** (gestion cross-origin)
- **Nodemailer** (envoi d'emails)
- **bcryptjs** (hashage mots de passe)

## Fonctionnalites

### Authentification
- Inscription avec email, username, mot de passe
- Connexion via JWT stocke dans un cookie httpOnly
- Route `/users/me` pour recuperer l'utilisateur connecte

### Marche / Dashboard
- 28 actifs : 15 actions US, 7 cryptos, 6 indices/ETF
- Prix simules avec micro-variations toutes les 30 secondes
- Filtres par categorie (Tous, Actions, Crypto, Indices)
- Top Hausse / Top Baisse
- Apercu du portefeuille pour les utilisateurs connectes

### Graphiques
- Mode Ligne et mode Bougies japonaises
- Periodes : 1J, 1S, 1M, 3M, 1A, 5A
- Overlays SMA 20, SMA 50 (activables par checkbox)
- Indicateurs techniques : RSI, MACD, Stochastic, Bollinger, ATR, Support/Resistance

### Trading
- Achat / vente avec quantites decimales (crypto-compatible)
- Stop Loss / Take Profit configurables a l'achat ou depuis le portefeuille
- Declenchement automatique des SL/TP avec vente et notification email
- Mode Demo ($100,000 virtuels) et mode Live (depot simule)

### Portefeuille
- Positions ouvertes avec P&L en temps reel
- Colonnes SL / TP visibles
- Vente rapide et fermeture de position depuis le tableau
- Modal SL/TP avec presets (-3%, -5%, -10%, +5%, +10%, +20%)

### Transactions
- Historique avec P&L par transaction
- Filtrage par mode (demo/live)

### Watchlist
- Ajout / suppression d'actions favorites
- Persistance localStorage

### Parametres
- Theme sombre / clair
- Langue, devise, preferences de trading
- Informations du compte

### Emails
- Email de bienvenue a l'inscription
- Email lors du declenchement d'un Stop Loss
- Email lors du declenchement d'un Take Profit
- Bilan quotidien automatique (15h UTC)

## Variables d'environnement

Voir `server/.env.example` pour la liste complete.

| Variable | Obligatoire | Description |
|---|---|---|
| `MONGODB_URI` | Oui | URI de connexion MongoDB |
| `PORT` | Non | Port du serveur (defaut: 3000) |
| `JWT_SECRET` | Non | Secret JWT (defaut: `change-me-in-production`) |
| `SMTP_HOST` | Non | Serveur SMTP pour les emails |
| `SMTP_USER` | Non | Utilisateur SMTP |
| `SMTP_PASS` | Non | Mot de passe SMTP |

## Deploiement

- **Frontend** : deploye sur Vercel
- **Backend** : deploye sur Render
- **Base de donnees** : MongoDB Atlas

## Auteur

Thomas Leonelli-Wendling — ESILV A4 FinTech
