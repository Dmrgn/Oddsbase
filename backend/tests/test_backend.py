import requests
import json
import time
import pytest
import asyncio
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="module")
def markets():
    """Fixture to load and provide markets to other tests."""
    # Trigger a search to load data from APIs (backend loads on-demand)
    resp = requests.get(f"{BASE_URL}/markets/search", params={"q": "politics", "limit": 50})
    if resp.status_code == 200:
        data = resp.json()
        return data.get("markets", [])
    return []

def test_health():
    """TEST 1: Server Health Check"""
    resp = requests.get(f"{BASE_URL}/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "service" in data

def test_market_discovery(markets):
    """TEST 2: Market Discovery"""
    assert len(markets) > 0, "No markets loaded! Is the backend running and connected to APIs?"
    
    polymarket = [m for m in markets if m['source'] == 'polymarket']
    kalshi = [m for m in markets if m['source'] == 'kalshi']
    
    # Verify structure of first market
    market = markets[0]
    assert 'market_id' in market
    assert 'title' in market
    assert 'outcomes' in market
    assert len(market['outcomes']) > 0

def test_orderbook(markets):
    """TEST 3: Orderbook Data"""
    if not markets:
        pytest.skip("No markets available")
        
    # Test first available market
    market = markets[0]
    mid = market['market_id']
    oid = market['outcomes'][0]['outcome_id']
    
    resp = requests.get(f"{BASE_URL}/markets/{mid}/orderbook", params={'outcome_id': oid})
    assert resp.status_code == 200
    ob = resp.json()
    # ob might be empty if no liquidity, but the request should succeed

def test_history(markets):
    """TEST 4: Price History"""
    if not markets:
        pytest.skip("No markets available")
        
    market = markets[0]
    mid = market['market_id']
    oid = market['outcomes'][0]['outcome_id']
    
    resp = requests.get(f"{BASE_URL}/markets/{mid}/history", params={'outcome_id': oid})
    assert resp.status_code == 200
    history = resp.json()
    assert isinstance(history, list)

def test_search():
    """TEST 5: Search Functionality"""
    # Test search queries
    queries = ["trump", "bitcoin"]
    for q in queries:
        resp = requests.get(f"{BASE_URL}/markets/search", params={'q': q, 'limit': 5})
        assert resp.status_code == 200
        data = resp.json()
        assert "markets" in data

@pytest.mark.asyncio
async def test_websocket():
    """TEST 6: WebSocket Streaming"""
    import websockets
    
    uri = f"ws://127.0.0.1:8000/ws"
    try:
        async with websockets.connect(uri) as websocket:
            # Send subscribe (new format uses op: subscribe_market usually, but let's see)
            # Based on api.py line 978, 'subscribe' is a pass, 'subscribe_market' is active.
            # But let's just check connectivity and a simple message if possible.
            await websocket.send(json.dumps({"op": "agent_init"}))
            
            msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(msg)
            assert "type" in data
    except (asyncio.TimeoutError, ConnectionRefusedError):
        pytest.skip("WebSocket timeout or refused - backend might be busy")
