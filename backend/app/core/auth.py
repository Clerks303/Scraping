from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime
from app.config import settings
from app.core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Valide le token JWT et retourne l'utilisateur"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Pour l'instant on retourne juste le username
    # TODO: Récupérer l'utilisateur depuis la base
    return {"username": username}

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Vérifie que l'utilisateur est actif"""
    # TODO: Vérifier le statut en base
    return current_user

# Dependency optionnelle pour les routes qui peuvent être publiques
async def get_optional_current_user(token: str = Depends(oauth2_scheme)):
    """Retourne l'utilisateur si authentifié, None sinon"""
    try:
        return await get_current_user(token)
    except HTTPException:
        return None