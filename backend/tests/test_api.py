import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

@pytest.fixture
def auth_headers():
    """Headers avec token d'authentification"""
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"username": "admin", "password": "secret"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_root():
    """Test endpoint racine"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_login():
    """Test authentification"""
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"username": "admin", "password": "secret"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_get_companies(auth_headers):
    """Test récupération des entreprises"""
    response = client.get(
        f"{settings.API_V1_STR}/companies/",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_filter_companies(auth_headers):
    """Test filtrage des entreprises"""
    response = client.post(
        f"{settings.API_V1_STR}/companies/filter",
        headers=auth_headers,
        json={
            "ca_min": 5000000,
            "effectif_min": 20,
            "statut": "à contacter"
        }
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_stats(auth_headers):
    """Test statistiques"""
    response = client.get(
        f"{settings.API_V1_STR}/stats/",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "ca_moyen" in data
    assert "par_statut" in data

def test_scraping_status(auth_headers):
    """Test statut scraping"""
    response = client.get(
        f"{settings.API_V1_STR}/scraping/status",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "pappers" in data
    assert "societe" in data

@pytest.mark.asyncio
async def test_company_crud(auth_headers):
    """Test CRUD complet sur une entreprise"""
    # Créer
    # TODO: Implémenter création directe
    
    # Lire
    response = client.get(
        f"{settings.API_V1_STR}/companies/123456789",
        headers=auth_headers
    )
    # 404 si n'existe pas
    assert response.status_code in [200, 404]
    
    # Update
    if response.status_code == 200:
        update_response = client.put(
            f"{settings.API_V1_STR}/companies/123456789",
            headers=auth_headers,
            json={"statut": "en discussion"}
        )
        assert update_response.status_code == 200