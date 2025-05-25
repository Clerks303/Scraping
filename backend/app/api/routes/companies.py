from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from app.models.schemas import Company, CompanyCreate, CompanyUpdate, CompanyDetail, FilterParams
from app.core.database import get_db
from app.services.data_processing import process_csv_file
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[Company])
async def get_companies(
    skip: int = 0,
    limit: int = 100,
    db = Depends(get_db)
):
    """Get all companies with pagination"""
    try:
        response = db.table('cabinets_comptables').select('*').range(skip, skip + limit - 1).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching companies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/filter", response_model=List[Company])
async def filter_companies(
    filters: FilterParams,
    db = Depends(get_db)
):
    """Filter companies based on criteria"""
    try:
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
        
        response = query.order('score_prospection', desc=True).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error filtering companies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{siren}", response_model=CompanyDetail)
async def get_company(siren: str, db = Depends(get_db)):
    """Get company details by SIREN"""
    try:
        # Get company
        response = db.table('cabinets_comptables').select('*').eq('siren', siren).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company = response.data
        
        # Get activity logs
        logs_response = db.table('activity_logs').select('*').eq('cabinet_id', company['id']).order('created_at', desc=True).limit(10).execute()
        company['activity_logs'] = logs_response.data
        
        return company
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching company {siren}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{siren}", response_model=Company)
async def update_company(
    siren: str,
    company_update: CompanyUpdate,
    db = Depends(get_db)
):
    """Update company information"""
    try:
        update_data = company_update.model_dump(exclude_unset=True)
        response = db.table('cabinets_comptables').update(update_data).eq('siren', siren).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Log activity
        company_id = response.data[0]['id']
        db.table('activity_logs').insert({
            'cabinet_id': company_id,
            'action': 'update',
            'details': {'fields_updated': list(update_data.keys())},
            'user_info': 'API User'
        }).execute()
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating company {siren}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{siren}")
async def delete_company(siren: str, db = Depends(get_db)):
    """Delete a company"""
    try:
        # Get company first
        company = db.table('cabinets_comptables').select('id, nom_entreprise').eq('siren', siren).single().execute()
        if not company.data:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Log before deletion
        db.table('activity_logs').insert({
            'cabinet_id': company.data['id'],
            'action': 'delete',
            'details': {'nom_entreprise': company.data['nom_entreprise']},
            'user_info': 'API User'
        }).execute()
        
        # Delete
        db.table('cabinets_comptables').delete().eq('siren', siren).execute()
        
        return {"success": True, "message": "Company deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting company {siren}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    update_existing: bool = False,
    db = Depends(get_db)
):
    """Upload and process CSV file"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
        result = await process_csv_file(file, db, update_existing)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing CSV: {e}")
        raise HTTPException(status_code=500, detail=str(e))