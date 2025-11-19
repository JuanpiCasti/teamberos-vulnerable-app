#!/bin/bash
# Script para iniciar el backend del casino

cd "$(dirname "$0")"

# Agregar Go al PATH
export PATH=$HOME/go1.24.0/bin:$PATH
export GOPATH=$HOME/go
export CGO_ENABLED=1

# Crear directorio de base de datos si no existe
mkdir -p database

# Iniciar el servidor
echo "🎰 Iniciando Casino Backend..."
echo "⚠️  WARNING: This is an educational project with intentional vulnerabilities"
echo "   DO NOT use in production or expose to the internet!"
echo ""

./main

