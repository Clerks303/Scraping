import asyncio
import logging
from typing import List, Dict, Optional
import openai
from datetime import datetime

logger = logging.getLogger(__name__)

class EnrichmentService:
    """Service d'enrichissement des données entreprises"""
    
    def __init__(self, db_client, openai_api_key: Optional[str] = None):
        self.db = db_client
        self.openai_client = None
        if openai_api_key:
            openai.api_key = openai_api_key
            self.openai_client = openai
    
    async def enrich_companies(self, min_ca: int = 10000000, min_score: int = 70, siren: Optional[str] = None):
        """Enrichit les entreprises avec scoring IA et autres données"""
        try:
            # Construire la requête
            query = self.db.table('cabinets_comptables').select('*')
            
            if siren:
                query = query.eq('siren', siren)
            else:
                query = query.gte('chiffre_affaires', min_ca)
                if min_score:
                    query = query.or_(
                        f'score_prospection.is.null,score_prospection.gte.{min_score}'
                    )
            
            response = query.execute()
            companies = response.data
            
            logger.info(f"Enrichissement de {len(companies)} entreprises")
            
            enriched_count = 0
            for company in companies:
                try:
                    # Calculer le score de prospection
                    if not company.get('score_prospection') or siren:
                        score_data = await self.calculate_prospection_score(company)
                        
                        update_data = {
                            'score_prospection': score_data['score_global'],
                            'score_details': score_data
                        }
                        
                        self.db.table('cabinets_comptables').update(update_data).eq('id', company['id']).execute()
                        enriched_count += 1
                        
                        logger.info(f"Score calculé pour {company['nom_entreprise']}: {score_data['score_global']:.1f}")
                    
                    # TODO: Ajouter d'autres enrichissements
                    # - Recherche email/téléphone dirigeant
                    # - Vérification LinkedIn
                    # - Analyse comptes annuels
                    
                    # Pause pour éviter surcharge API
                    if enriched_count % 10 == 0:
                        await asyncio.sleep(1)
                        
                except Exception as e:
                    logger.error(f"Erreur enrichissement {company.get('nom_entreprise')}: {e}")
                    continue
            
            return {
                'success': True,
                'enriched_count': enriched_count,
                'total_processed': len(companies)
            }
            
        except Exception as e:
            logger.error(f"Erreur enrichissement global: {e}")
            raise
    
    async def calculate_prospection_score(self, company: Dict) -> Dict:
        """Calcule le score de prospection avec IA"""
        
        # Si pas d'OpenAI, utiliser scoring basique
        if not self.openai_client:
            return self._basic_scoring(company)
        
        try:
            # Préparer le prompt
            prompt = self._build_scoring_prompt(company)
            
            # Appel OpenAI
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.openai_client.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": "Tu es un expert en M&A spécialisé dans l'analyse de cabinets comptables. Tu dois évaluer le potentiel d'acquisition ou de vente d'entreprises."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.3,
                    max_tokens=500
                )
            )
            
            # Parser la réponse
            result_text = response.choices[0].message.content
            
            # Extraire les scores et infos
            import json
            try:
                result = json.loads(result_text)
            except:
                # Fallback si le JSON est invalide
                result = self._parse_text_response(result_text)
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur OpenAI: {e}")
            return self._basic_scoring(company)
    
    def _build_scoring_prompt(self, company: Dict) -> str:
        """Construit le prompt pour le scoring IA"""
        return f"""
        Analyse cette entreprise et détermine son potentiel M&A.
        
        Entreprise: {company.get('nom_entreprise', 'N/A')}
        Forme juridique: {company.get('forme_juridique', 'N/A')}
        Date création: {company.get('date_creation', 'N/A')}
        
        Données financières:
        - Chiffre d'affaires: {company.get('chiffre_affaires', 0):,.0f} €
        - Résultat: {company.get('resultat', 0):,.0f} €
        - Effectif: {company.get('effectif', 0)}
        - Capital social: {company.get('capital_social', 0):,.0f} €
        
        Historique (si disponible):
        - CA N-1: {company.get('chiffre_affaires_n1', 'N/A')}
        - CA N-2: {company.get('chiffre_affaires_n2', 'N/A')}
        
        Dirigeants: {company.get('dirigeant_principal', 'N/A')}
        
        Retourne un JSON avec:
        {{
            "score_achat": <0-100>,
            "score_vente": <0-100>,
            "score_global": <0-100>,
            "justification": "<explication courte>",
            "facteurs_positifs": ["<facteur1>", "<facteur2>"],
            "facteurs_negatifs": ["<facteur1>", "<facteur2>"],
            "recommandations": ["<action1>", "<action2>"]
        }}
        """
    
    def _basic_scoring(self, company: Dict) -> Dict:
        """Scoring basique sans IA"""
        score_achat = 50
        score_vente = 50
        facteurs_positifs = []
        facteurs_negatifs = []
        recommandations = []
        
        # Analyse du CA
        ca = company.get('chiffre_affaires', 0)
        if ca > 25000000:
            score_achat += 25
            facteurs_positifs.append("CA très élevé (>25M€)")
            recommandations.append("Cible prioritaire pour acquisition")
        elif ca > 15000000:
            score_achat += 15
            facteurs_positifs.append("CA élevé (>15M€)")
        elif ca < 5000000:
            score_vente += 20
            facteurs_negatifs.append("CA faible (<5M€)")
            recommandations.append("Candidat potentiel à la vente")
        
        # Analyse de la rentabilité
        resultat = company.get('resultat', 0)
        if resultat and ca:
            marge = (resultat / ca) * 100
            if marge > 10:
                score_achat += 15
                facteurs_positifs.append(f"Excellente rentabilité ({marge:.1f}%)")
            elif marge < 2:
                score_vente += 15
                facteurs_negatifs.append(f"Faible rentabilité ({marge:.1f}%)")
        
        # Analyse de l'effectif
        effectif = company.get('effectif', 0)
        if effectif > 70:
            score_achat += 10
            facteurs_positifs.append("Structure importante (>70 employés)")
        elif effectif < 15:
            score_vente += 10
            facteurs_negatifs.append("Petite structure (<15 employés)")
        
        # Analyse de l'ancienneté
        if company.get('date_creation'):
            try:
                date_creation = datetime.fromisoformat(company['date_creation'].replace('Z', '+00:00'))
                age = (datetime.now() - date_creation).days / 365
                
                if age > 20:
                    facteurs_positifs.append(f"Entreprise établie ({age:.0f} ans)")
                    score_achat += 5
                elif age < 5:
                    facteurs_negatifs.append(f"Entreprise récente ({age:.0f} ans)")
                    score_vente += 10
            except:
                pass
        
        # Capital social
        capital = company.get('capital_social', 0)
        if capital > 500000:
            facteurs_positifs.append("Capital social solide")
            score_achat += 5
        
        # Score global
        score_global = (score_achat * 0.4 + score_vente * 0.6)
        
        # Recommandations supplémentaires
        if score_global > 75:
            recommandations.append("Contact prioritaire - Fort potentiel M&A")
        elif score_global > 60:
            recommandations.append("À qualifier rapidement")
        
        if not company.get('email') and not company.get('telephone'):
            recommandations.append("Rechercher coordonnées de contact")
        
        return {
            "score_achat": min(100, score_achat),
            "score_vente": min(100, score_vente),
            "score_global": score_global,
            "justification": f"Cabinet avec CA de {ca/1000000:.1f}M€, {effectif} employés, rentabilité {(resultat/ca*100) if ca else 0:.1f}%",
            "facteurs_positifs": facteurs_positifs,
            "facteurs_negatifs": facteurs_negatifs,
            "recommandations": recommandations
        }
    
    def _parse_text_response(self, text: str) -> Dict:
        """Parse une réponse texte si le JSON échoue"""
        # Implémentation basique de parsing
        result = {
            "score_achat": 50,
            "score_vente": 50,
            "score_global": 50,
            "justification": "Analyse IA",
            "facteurs_positifs": [],
            "facteurs_negatifs": [],
            "recommandations": []
        }
        
        # Extraire les scores si présents
        import re
        
        score_achat_match = re.search(r'score_achat["\s:]+(\d+)', text)
        if score_achat_match:
            result["score_achat"] = int(score_achat_match.group(1))
        
        score_vente_match = re.search(r'score_vente["\s:]+(\d+)', text)
        if score_vente_match:
            result["score_vente"] = int(score_vente_match.group(1))
        
        result["score_global"] = (result["score_achat"] * 0.4 + result["score_vente"] * 0.6)
        
        return result