#!/bin/bash

# Vaultify Backend Startup Script
echo "🚀 Starting Vaultify Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please update .env file with your configuration before running again."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "💡 You can start it with: brew services start postgresql (macOS) or sudo systemctl start postgresql (Linux)"
    exit 1
fi

# Check if database exists
DB_NAME=$(grep DATABASE_NAME .env | cut -d '=' -f2)
if [ -z "$DB_NAME" ]; then
    DB_NAME="vaultify_db"
fi

echo "🗄️  Checking database: $DB_NAME"
if ! psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "📊 Creating database: $DB_NAME"
    createdb $DB_NAME
fi

# Run migrations
echo "🔄 Running database migrations..."
npm run migration:run

# Run seeds
echo "🌱 Running database seeds..."
npm run seed:run

# Start the application
echo "🎯 Starting Vaultify Backend..."
npm run start:dev
