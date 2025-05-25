# M&A Intelligence Platform v2.0

## 🎯 Vue d'ensemble

Plateforme intelligente de prospection M&A pour cabinets comptables, permettant d'identifier et qualifier automatiquement les opportunités d'acquisition et de cession d'entreprises.

### ✨ Fonctionnalités principales

- **📊 Tableau de bord analytique** : KPIs en temps réel, graphiques interactifs
- **🏢 Base de données enrichie** : 10k+ cabinets comptables en IDF
- **🤖 Scraping intelligent** : Collecte automatique via Pappers, Société.com, Infogreffe
- **📈 Scoring IA** : Évaluation automatique du potentiel M&A
- **📁 Import CSV** : Intégration de vos propres données
- **🔍 Filtres avancés** : Recherche multicritères (CA, effectif, localisation)
- **📧 Exports** : Génération de listes qualifiées

## 🚀 Installation rapide

### Prérequis

- Docker & Docker Compose
- Node.js 18+ (pour développement local)
- Python 3.11+ (pour développement local)
- Compte Supabase (base de données)

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/ma-intelligence-platform.git
cd ma-intelligence-platform
```

### 2. Configuration

Créer un fichier `.env` à la racine :

```env
# Backend
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre-anon-key
SECRET_KEY=votre-secret-key-très-sécurisé
OPENAI_API_KEY=sk-... (optionnel)
PAPPERS_API_KEY=votre-cle-pappers (optionnel)

# Frontend
REACT_APP_API_URL=http://localhost:8000/api/v1
```

### 3. Lancement avec Docker

```bash
# Développement
docker-compose up -d

# Production
docker-compose --profile production up -d
```

L'application sera disponible sur :
- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- Documentation API : http://localhost:8000/docs

### 4. Compte de test

- **Utilisateur** : admin
- **Mot de passe** : secret

## 🛠️ Développement local

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

## 📁 Structure du projet

```
ma-intelligence-platform/
├── backend/
│   ├── app/
│   │   ├── api/          # Endpoints API
│   │   ├── core/         # Config, sécurité, DB
│   │   ├── models/       # Schemas Pydantic
│   │   ├── scrapers/     # Scrapers Pappers, Société.com
│   │   └── services/     # Logique métier
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # Composants réutilisables
│   │   ├── contexts/     # Context API (Auth)
│   │   ├── pages/        # Pages principales
│   │   └── services/     # API client
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔧 Configuration avancée

### Base de données Supabase

1. Créer un projet sur [Supabase](https://supabase.com)
2. Exécuter le script SQL de création des tables :

```sql
-- Table principale des cabinets
CREATE TABLE cabinets_comptables (
    id SERIAL PRIMARY KEY,
    siren VARCHAR(9) UNIQUE NOT NULL,
    siret_siege VARCHAR(14),
    nom_entreprise VARCHAR(255) NOT NULL,
    forme_juridique VARCHAR(100),
    date_creation DATE,
    adresse TEXT,
    email VARCHAR(255),
    telephone VARCHAR(20),
    numero_tva VARCHAR(20),
    chiffre_affaires DECIMAL(15,2),
    resultat DECIMAL(15,2),
    effectif INTEGER,
    capital_social DECIMAL(15,2),
    code_naf VARCHAR(10),
    libelle_code_naf VARCHAR(255),
    dirigeant_principal VARCHAR(255),
    dirigeants_json JSONB,
    statut VARCHAR(50) DEFAULT 'à contacter',
    score_prospection DECIMAL(5,2),
    score_details JSONB,
    lien_pappers VARCHAR(255),
    lien_societe_com VARCHAR(255),
    details_complets JSONB,
    last_scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des logs d'activité
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    cabinet_id INTEGER REFERENCES cabinets_comptables(id),
    action VARCHAR(50),
    details JSONB,
    user_info VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_cabinets_siren ON cabinets_comptables(siren);
CREATE INDEX idx_cabinets_statut ON cabinets_comptables(statut);
CREATE INDEX idx_cabinets_score ON cabinets_comptables(score_prospection);
CREATE INDEX idx_cabinets_ca ON cabinets_comptables(chiffre_affaires);
```

### Clés API externes

#### Pappers API
1. Créer un compte sur [Pappers.fr](https://www.pappers.fr/api)
2. Récupérer votre clé API
3. Ajouter dans `.env` : `PAPPERS_API_KEY=votre-cle`

#### OpenAI (optionnel)
Pour le scoring IA avancé :
1. Créer un compte sur [OpenAI](https://platform.openai.com)
2. Générer une clé API
3. Ajouter dans `.env` : `OPENAI_API_KEY=sk-...`

## 📊 Utilisation

### 1. Import de données

- **CSV** : Glisser-déposer ou sélectionner un fichier CSV
- Format requis : colonnes `siren` et `nom_entreprise` minimum
- Encodages supportés : UTF-8, Latin1

### 2. Scraping automatique

- **Pappers** : Recherche par code NAF et département
- **Société.com** : Extraction détaillée avec Playwright
- **Infogreffe** : Enrichissement des données financières

### 3. Filtrage et export

- Filtres combinables : CA, effectif, ville, statut
- Export CSV des résultats filtrés
- Téléchargement immédiat

## 🔒 Sécurité

- Authentification JWT
- Mots de passe hashés (bcrypt)
- CORS configuré
- Variables d'environnement pour secrets
- HTTPS en production (nginx)

## 🐛 Troubleshooting

### Erreur de connexion Supabase
- Vérifier les clés dans `.env`
- Tester la connexion : http://localhost:8000/docs

### Scraping bloqué
- Captcha sur Société.com : relancer plus tard
- Quota Pappers dépassé : vérifier votre plan

### Performance lente
- Augmenter les ressources Docker
- Optimiser les requêtes (pagination)

## 📈 Roadmap

- [ ] Authentification 2FA
- [ ] Webhooks pour intégrations
- [ ] Export Excel avancé
- [ ] API publique
- [ ] Application mobile
- [ ] IA conversationnelle

## 🤝 Support

Pour toute question ou assistance :
- Email : support@ma-intelligence.com
- Documentation API : http://localhost:8000/docs

## 📄 Licence

Propriétaire - Cabinet M&A Arthur © 2025