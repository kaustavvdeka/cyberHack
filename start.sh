#!/bin/bash

echo "=========================================="
echo "  Pentest AI Dashboard - Setup & Launch"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

USE_DOCKER=true

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker is not installed. Falling back to local native execution...${NC}"
    USE_DOCKER=false
fi

if [ "$USE_DOCKER" = "true" ]; then
    # Check for Docker Compose (either legacy docker-compose or modern docker compose)
    DOCKER_COMPOSE_CMD=""
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        echo -e "${YELLOW}Docker Compose is not installed. Falling back to local native execution...${NC}"
        USE_DOCKER=false
    fi
fi

if [ "$USE_DOCKER" = "true" ]; then
    echo -e "${GREEN}✓ Docker and Docker Compose found ($DOCKER_COMPOSE_CMD)${NC}"
    echo ""
    
    # Check if files exist
    if [ ! -f "backend/requirements.txt" ]; then
        echo -e "${YELLOW}Warning: Backend requirements file not found.${NC}"
        exit 1
    fi
    
    echo "Building and starting containers using $DOCKER_COMPOSE_CMD..."
    echo ""
    
    # Build and run with Docker Compose
    $DOCKER_COMPOSE_CMD up --build -d
    
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  Installation Complete!"
    echo "=========================================="
    echo ""
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    echo "  To stop: $DOCKER_COMPOSE_CMD down"
    echo "  To view logs: $DOCKER_COMPOSE_CMD logs -f"
    echo "==========================================${NC}"
else
    echo -e "${GREEN}Setting up local native environment...${NC}"
    echo ""
    
    # Check for Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Python3 is not installed. Please install Python3 or Docker first.${NC}"
        exit 1
    fi
    
    # Check for Node/NPM
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Node.js/npm is not installed. Please install Node.js/npm or Docker first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Python3 and npm found${NC}"
    
    # Setup backend
    echo "Setting up backend Python environment..."
    cd backend
    pip3 install -r requirements.txt
    cd ..
    
    # Setup frontend
    echo "Setting up frontend Node environment..."
    cd frontend
    npm install
    cd ..
    
    echo "Starting services locally..."
    
    # Start backend
    cd backend
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend
    cd frontend
    # Pass API url for local WebSocket connection
    REACT_APP_API_URL=http://localhost:8000 npm start &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  Local Native Launch Complete!"
    echo "=========================================="
    echo ""
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    echo "  Backend Log: backend/backend.log"
    echo "  Press Ctrl+C to stop both servers."
    echo "==========================================${NC}"
    
    # Wait for Ctrl+C and kill child processes
    trap "echo -e '\nStopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
    wait
fi