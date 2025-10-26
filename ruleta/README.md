# Casino Virtual - Trabajo Práctico de Seguridad en Aplicaciones Web

> ⚠️ **ADVERTENCIA**: Esta aplicación contiene vulnerabilidades de seguridad **INTENCIONALES** con fines educativos. **NO debe ser utilizada en producción ni expuesta a internet.**

## Descripción del Proyecto

Este proyecto es un trabajo práctico para la materia **Seguridad en Aplicaciones Web** que simula un Casino Virtual con múltiples vulnerabilidades basadas en el **OWASP Top 10**.

El objetivo es demostrar una **cadena de explotación** donde cada vulnerabilidad permite al atacante escalar privilegios y comprometer la integridad del sistema.

## Sistema Víctima

Una aplicación web de juego en línea (Casino Virtual) donde los usuarios pueden tener dos roles:

### Roles de Usuario

- **Jugadores**:
  - Registrarse gratuitamente
  - Apostar en juegos de ruleta
  - Administrar su saldo personal

- **Administradores**:
  - Gestionar saldos de usuarios
  - Revisar historial de apuestas
  - Administrar usuarios del sistema

## Tecnologías

- **Frontend**: React Router 7 + TypeScript + Tailwind CSS v4
- **SSR**: Server-side rendering con Node.js
- **Backend**: *(A implementar)*
- **Base de Datos**: *(A implementar)*

## Instalación y Uso

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start
```

La aplicación estará disponible en `http://localhost:5173` (o el siguiente puerto disponible).

## Cadena de Vulnerabilidades (OWASP Top 10)

Este proyecto implementa las siguientes vulnerabilidades en secuencia:

### 1. A01: Broken Access Control (IDOR en perfiles de usuario)

**Descripción**:
- Ruta vulnerable: `/user/profile?id=123`
- No hay verificación de permisos
- Un jugador autenticado puede cambiar el `id` en la URL y acceder a información de otros usuarios

**Explotación**:
```
/user/profile?id=123  → Ve su propio perfil
/user/profile?id=124  → Ve el perfil de otro usuario (username, email)
```

**Resultado**:
El atacante obtiene información de diferentes cuentas, incluyendo correos electrónicos necesarios para el siguiente paso.

---

### 2. A02: Cryptographic Failures (Tokens inseguros)

**Descripción**:
- Endpoint vulnerable: `/reset?token=MD5(email)`
- El token de recuperación de contraseña es predecible
- Se genera solo con MD5 del email (obtenido en el paso anterior)

**Explotación**:
```javascript
// El atacante conoce el email de la víctima
email = "victim@example.com"
token = MD5(email)  // Genera el token
// Accede a: /reset?token=<token_generado>
```

**Resultado**:
El atacante compromete la cuenta de una víctima con saldo real usando el email obtenido por IDOR.

---

### 3. A03: Injection (SQL Injection en historial de apuestas)

**Descripción**:
- Endpoint vulnerable: `/bets?filter=2024-01-01`
- El backend construye queries SQL de forma insegura
- Cada usuario normalmente solo ve su propio historial

**Explotación**:
```sql
/bets?filter=2024-01-01' UNION SELECT * FROM users--
/bets?filter=2024-01-01' UNION SELECT balance,deposits FROM accounts WHERE user_id=5--
```

**Resultado**:
Con las credenciales obtenidas en el paso anterior, el atacante puede:
- Leer información de movimientos de otras cuentas
- Determinar qué cuentas tienen saldo alto
- Decidir qué cuentas vale la pena comprometer

---

### 4. A04: Insecure Design / Race Condition (Condición de carrera al acreditar saldo)

**Descripción**:
- Endpoint vulnerable: `POST /balance/add`
- Cuando un jugador gana, se acredita el premio
- Validación insegura: primero verifica si debe acreditar, luego suma el balance
- No hay mecanismo de bloqueo (lock)
- La decisión de ganar se hace del lado del cliente

**Explotación**:
```python
# Script para explotar race condition
import requests
import threading

def add_balance():
    requests.post('/balance/add', json={'bet_id': 123, 'amount': 1000})

# Enviar múltiples requests concurrentes
threads = [threading.Thread(target=add_balance) for _ in range(10)]
for t in threads:
    t.start()
```

**Resultado**:
- El mismo premio se contabiliza múltiples veces
- El atacante infla artificialmente su saldo
- Se compromete la integridad económica del casino

---

## Flujo Completo de Ataque

```
1. IDOR → Obtiene emails de usuarios
         ↓
2. Token MD5 → Compromete cuenta con saldo
         ↓
3. SQL Injection → Obtiene información de movimientos
         ↓
4. Race Condition → Infla el saldo artificialmente
```

## Propósito Educativo

Este proyecto fue creado **exclusivamente con fines educativos** para:

- Comprender cómo funcionan las vulnerabilidades del OWASP Top 10
- Aprender a identificar y explotar vulnerabilidades en aplicaciones web
- Practicar técnicas de explotación en un entorno controlado
- Entender la importancia de implementar controles de seguridad adecuados

## Advertencias Legales

⚠️ **IMPORTANTE**:
- Este código contiene vulnerabilidades INTENCIONALES
- NO debe ser usado en entornos de producción
- NO debe ser expuesto a internet
- Solo debe ejecutarse en entornos de desarrollo locales y controlados
- El uso indebido de estas técnicas en sistemas reales es ilegal

## Autores

Trabajo práctico realizado para la materia Seguridad en Aplicaciones Web.

## Licencia

Este proyecto es solo para fines educativos y de investigación en seguridad.
