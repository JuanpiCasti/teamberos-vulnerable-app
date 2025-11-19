#!/bin/bash
# Script para iniciar el frontend del casino

cd "$(dirname "$0")"

# Cargar nvm y usar Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

echo "🎨 Iniciando Frontend (React)..."
echo "📍 URL: http://localhost:5173"
echo ""

npm run dev


