from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class StatusEnum(str, Enum):
    A_CONTACTER = "à contacter"
    EN_DISCUSSION = "en discussion"
    EN_NEGOCIATION = "en négociation"
    DEAL_SIGNE = "deal signé"
    ABANDONNE = "abandonné"

class CompanyBase(BaseModel):
    siren: str
    nom_entreprise: str
    forme_juridique: Optional[str] = None
    date_creation: Optional[datetime] = None
    adresse: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None
    numero_tva: Optional[str] = None
    chiffre_affaires: Optional[float] = None
    resultat: Optional[float] = None
    effectif: Optional[int] = None
    capital_social: Optional[float] = None
    code_naf: Optional[str] = None
    libelle_code_naf: Optional[str] = None
    dirigeant_principal: Optional[str] = None
    statut: StatusEnum = StatusEnum.A_CONTACTER
    score_prospection: Optional[float] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    nom_entreprise: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    statut: Optional[StatusEnum] = None
    effectif: Optional[int] = None
    capital_social: Optional[float] = None

class Company(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CompanyDetail(Company):
    dirigeants_json: Optional[Dict[str, Any]] = None
    score_details: Optional[Dict[str, Any]] = None
    activity_logs: Optional[List[Dict[str, Any]]] = None
    details_complets: Optional[Dict[str, Any]] = None

class ScrapingStatus(BaseModel):
    is_running: bool
    progress: int
    message: str
    error: Optional[str] = None
    new_companies: int = 0
    skipped_companies: int = 0
    source: Optional[str] = None

class Stats(BaseModel):
    total: int
    ca_moyen: float
    ca_total: float
    effectif_moyen: float
    avec_email: int
    avec_telephone: int
    taux_email: float
    taux_telephone: float
    par_statut: Dict[str, int]

class FilterParams(BaseModel):
    ca_min: Optional[float] = None
    effectif_min: Optional[int] = None
    ville: Optional[str] = None
    statut: Optional[StatusEnum] = None
    search: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    username: str
    password: str