#!/usr/bin/env zsh

echo "Iniciando instalación y despliegue del proyecto JS Solutions..."

# Función para cerrar los procesos hijos al salir
cleanup() {
    echo "\nCerrando todos los microfrontends..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM

echo "==========================================="
echo "⚙️  1/3 Configurando Landing (Astro)..."
echo "==========================================="
cd landing || exit
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias de landing..."
    npm install
fi
# Astro levanta en el puerto 4321 por defecto
npm run dev &
cd ..

echo "==========================================="
echo "⚙️  2/3 Configurando Portal (Next.js)..."
echo "==========================================="
cd portal || exit
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias de portal..."
    npm install
fi
# Next.js levanta en el 3000 por defecto, lo pasamos al 3001
PORT=3001 npm run dev &
cd ..

echo "==========================================="
echo "⚙️  3/3 Configurando Admin (Next.js)..."
echo "==========================================="
cd admin || exit
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias de admin..."
    npm install
fi
# Next.js levanta en el 3000 por defecto, lo pasamos al 3002
PORT=3002 npm run dev &
cd ..

echo ""
echo "🚀 ¡Todos los servicios han sido iniciados!"
echo "   - Landing : http://localhost:4321"
echo "   - Portal  : http://localhost:3001"
echo "   - Admin   : http://localhost:3002"
echo ""
echo "Presiona Ctrl+C para detener todos los servidores."

# Espera a que los procesos en background terminen
wait
