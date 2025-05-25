from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import Stats, FilterParams
from app.core.database import get_db
import pandas as pd
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=Stats)
async def get_stats(db = Depends(get_db)):
    """Get overall statistics"""
    try:
        # Get all data
        response = db.table('cabinets_comptables').select('*').execute()
        if not response.data:
            return Stats(
                total=0, ca_moyen=0, ca_total=0, effectif_moyen=0,
                avec_email=0, avec_telephone=0, taux_email=0, taux_telephone=0,
                par_statut={}
            )
        
        df = pd.DataFrame(response.data)
        
        # Calculate stats
        stats = {
            'total': len(df),
            'ca_moyen': df['chiffre_affaires'].mean() if 'chiffre_affaires' in df else 0,
            'ca_total': df['chiffre_affaires'].sum() if 'chiffre_affaires' in df else 0,
            'effectif_moyen': df['effectif'].mean() if 'effectif' in df else 0,
            'avec_email': df['email'].notna().sum() if 'email' in df else 0,
            'avec_telephone': df['telephone'].notna().sum() if 'telephone' in df else 0,
            'par_statut': df['statut'].value_counts().to_dict() if 'statut' in df else {}
        }
        
        stats['taux_email'] = (stats['avec_email'] / stats['total'] * 100) if stats['total'] > 0 else 0
        stats['taux_telephone'] = (stats['avec_telephone'] / stats['total'] * 100) if stats['total'] > 0 else 0
        
        return Stats(**stats)
    except Exception as e:
        logger.error(f"Error calculating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/filtered", response_model=Stats)
async def get_filtered_stats(filters: FilterParams, db = Depends(get_db)):
    """Get statistics for filtered data"""
    try:
        # Build query with filters
        query = db.table('cabinets_comptables').select('*')
        
        if filters.ca_min:
            query = query.gte('chiffre_affaires', filters.ca_min)
        if filters.effectif_min:
            query = query.gte('effectif', filters.effectif_min)
        if filters.ville:
            query = query.ilike('adresse', f'%{filters.ville}%')
        if filters.statut:
            query = query.eq('statut', filters.statut)
        if filters.search:
            query = query.or_(f'nom_entreprise.ilike.%{filters.search}%,siren.ilike.%{filters.search}%')
        
        response = query.execute()
        
        if not response.data:
            return Stats(
                total=0, ca_moyen=0, ca_total=0, effectif_moyen=0,
                avec_email=0, avec_telephone=0, taux_email=0, taux_telephone=0,
                par_statut={}
            )
        
        df = pd.DataFrame(response.data)
        
        # Same calculations as above
        stats = {
            'total': len(df),
            'ca_moyen': df['chiffre_affaires'].mean() if 'chiffre_affaires' in df else 0,
            'ca_total': df['chiffre_affaires'].sum() if 'chiffre_affaires' in df else 0,
            'effectif_moyen': df['effectif'].mean() if 'effectif' in df else 0,
            'avec_email': df['email'].notna().sum() if 'email' in df else 0,
            'avec_telephone': df['telephone'].notna().sum() if 'telephone' in df else 0,
            'par_statut': df['statut'].value_counts().to_dict() if 'statut' in df else {}
        }
        
        stats['taux_email'] = (stats['avec_email'] / stats['total'] * 100) if stats['total'] > 0 else 0
        stats['taux_telephone'] = (stats['avec_telephone'] / stats['total'] * 100) if stats['total'] > 0 else 0
        
        return Stats(**stats)
    except Exception as e:
        logger.error(f"Error calculating filtered stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cities")
async def get_cities(db = Depends(get_db)):
    """Get list of unique cities"""
    try:
        response = db.table('cabinets_comptables').select('adresse').execute()
        
        cities = set()
        for company in response.data:
            if company['adresse']:
                # Extract city from address
                parts = company['adresse'].split(',')
                if len(parts) > 1:
                    ville_cp = parts[-1].strip()
                    ville_parts = ville_cp.split(' ', 1)
                    if len(ville_parts) > 1:
                        cities.add(ville_parts[1])
        
        return {"cities": sorted(list(cities))}
    except Exception as e:
        logger.error(f"Error fetching cities: {e}")
        raise HTTPException(status_code=500, detail=str(e))