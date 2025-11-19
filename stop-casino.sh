#!/bin/bash
# Script para detener los servidores del casino

cd "$(dirname "$0")"

if [ -f ".casino-pids" ]; then
    source .casino-pids
    echo "🛑 Deteniendo servidores..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null && echo "✅ Backend detenido (PID: $BACKEND_PID)"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null && echo "✅ Frontend detenido (PID: $FRONTEND_PID)"
    fi
    
    rm .casino-pids
    echo "✅ Servidores detenidos correctamente"
else
    echo "⚠️  No se encontró el archivo de PIDs"
    echo "Buscando procesos manualmente..."
    
    # Buscar y matar el proceso del backend
    BACKEND_PID=$(ps aux | grep '[.]casino-back/main' | awk '{print $2}')
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null && echo "✅ Backend detenido (PID: $BACKEND_PID)"
    fi
    
    # Buscar y matar el proceso de Vite
    FRONTEND_PID=$(pgrep -f 'vite.*ruleta')
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null && echo "✅ Frontend detenido (PID: $FRONTEND_PID)"
    fi
fi


