from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from app.models.schemas import ScrapingStatus
from app.scrapers import pappers, societe, infogreffe
from app.core.database import get_db
import asyncio
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Global status tracking
scraping_status = {
    'pappers': ScrapingStatus(is_running=False, progress=0, message=''),
    'societe': ScrapingStatus(is_running=False, progress=0, message=''),
    'infogreffe': ScrapingStatus(is_running=False, progress=0, message='')
}

async def run_pappers_scraping(db):
    """Run Pappers API scraping in background"""
    global scraping_status
    try:
        scraping_status['pappers'] = ScrapingStatus(
            is_running=True,
            progress=0,
            message="Initialisation du scraping Pappers...",
            source='pappers'
        )
        
        scraper = pappers.PappersAPIClient(db)
        await scraper.run_full_scraping(scraping_status['pappers'])
        
    except Exception as e:
        scraping_status['pappers'].error = str(e)
        logger.error(f"Pappers scraping error: {e}")
    finally:
        scraping_status['pappers'].is_running = False
        scraping_status['pappers'].progress = 100

async def run_societe_scraping(db):
    """Run Societe.com scraping in background"""
    global scraping_status
    try:
        scraping_status['societe'] = ScrapingStatus(
            is_running=True,
            progress=0,
            message="Initialisation du scraping Société.com...",
            source='societe'
        )
        
        scraper = societe.SocieteScraper(db)
        await scraper.run_full_scraping(scraping_status['societe'])
        
    except Exception as e:
        scraping_status['societe'].error = str(e)
        logger.error(f"Societe scraping error: {e}")
    finally:
        scraping_status['societe'].is_running = False
        scraping_status['societe'].progress = 100

@router.post("/pappers")
async def start_pappers_scraping(
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """Start Pappers API scraping"""
    if scraping_status['pappers'].is_running:
        raise HTTPException(status_code=400, detail="Pappers scraping already running")
    
    background_tasks.add_task(run_pappers_scraping, db)
    return {"message": "Pappers scraping started", "status": "running"}

@router.post("/societe")
async def start_societe_scraping(
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """Start Societe.com scraping"""
    if scraping_status['societe'].is_running:
        raise HTTPException(status_code=400, detail="Societe scraping already running")
    
    background_tasks.add_task(run_societe_scraping, db)
    return {"message": "Societe.com scraping started", "status": "running"}

@router.post("/infogreffe")
async def start_infogreffe_enrichment(
    background_tasks: BackgroundTasks,
    min_ca: int = 10000000,
    min_score: int = 70,
    siren: Optional[str] = None,
    db = Depends(get_db)
):
    """Start Infogreffe enrichment"""
    if scraping_status['infogreffe'].is_running:
        raise HTTPException(status_code=400, detail="Infogreffe enrichment already running")
    
    # TODO: Implement Infogreffe enrichment
    return {"message": "Infogreffe enrichment started", "status": "running"}

@router.get("/status/{source}")
async def get_scraping_status(source: str):
    """Get scraping status for a specific source"""
    if source not in scraping_status:
        raise HTTPException(status_code=404, detail="Invalid source")
    
    return scraping_status[source]

@router.get("/status")
async def get_all_status():
    """Get status for all scraping sources"""
    return scraping_status