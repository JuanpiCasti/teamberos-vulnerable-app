#!/bin/bash
# Script para iniciar todo el proyecto del casino

echo "🎰 ==============================================="
echo "🎰  INICIANDO CASINO - APP DE RULETA"
echo "🎰 ==============================================="
echo ""
echo "⚠️  WARNING: This is an educational project with intentional vulnerabilities"
echo "   DO NOT use in production or expose to the internet!"
echo ""

# Verificar que estamos en el directorio correcto
cd "$(dirname "$0")"

# Cargar nvm y usar Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 > /dev/null 2>&1

# Agregar Go al PATH
export PATH=$HOME/go1.24.0/bin:$PATH
export CGO_ENABLED=1

# Iniciar el backend
echo "📡 Iniciando Backend (Go)..."
cd casino-back
mkdir -p database

# Verificar si el binario existe, si no, compilarlo
if [ ! -f "main" ]; then
    echo "🔨 Compilando backend..."
    go build -o main cmd/api/main.go
fi

# Iniciar backend en segundo plano
./main > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID) en http://localhost:8080"
echo "   Logs: casino-back/backend.log"

# Esperar a que el backend esté listo
echo "⏳ Esperando a que el backend esté listo..."
for i in {1..10}; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Backend listo!"
        break
    fi
    sleep 1
done

# Iniciar el frontend
echo ""
echo "🎨 Iniciando Frontend (React)..."
cd ../ruleta
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend iniciado (PID: $FRONTEND_PID)"
echo "   Logs: frontend.log"

echo ""
echo "🎰 ==============================================="
echo "🎰  CASINO INICIADO CORRECTAMENTE"
echo "🎰 ==============================================="
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080"
echo "   Health:   http://localhost:8080/health"
echo ""
echo "📝 PIDs guardados:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "Para detener los servidores:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "O ejecuta: ./stop-casino.sh"
echo ""

# Guardar los PIDs para poder detenerlos después
echo "BACKEND_PID=$BACKEND_PID" > .casino-pids
echo "FRONTEND_PID=$FRONTEND_PID" >> .casino-pids

# Esperar a que el usuario presione Ctrl+C
echo "Presiona Ctrl+C para detener los servidores..."
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '🛑 Servidores detenidos'; exit" INT
wait

