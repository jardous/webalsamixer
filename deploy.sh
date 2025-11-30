#!/bin/bash

echo "--- WebAlsaMixer Deployment ---"

# 1. Build the React Frontend
echo "1. Building React Frontend..."
cd web-alsa-mixer
npm install
npm run build
cd ..

# 2. check if dist exists
if [ ! -d "./web-alsa-mixer/dist" ]; then
    echo "Error: React build failed. 'dist' folder not found."
    exit 1
fi

echo "2. Frontend built successfully."

# 3. Setup Systemd Service
echo "3. Installing Systemd Service..."

# Update the working directory in the service file to current location
CURRENT_DIR=$(pwd)
sed -i "s|WorkingDirectory=.*|WorkingDirectory=$CURRENT_DIR|g" alsamixer.service

# Copy service file
sudo cp alsamixer.service /etc/systemd/system/alsamixer.service

# Reload daemons and start
sudo systemctl daemon-reload
sudo systemctl enable alsamixer.service
sudo systemctl restart alsamixer.service

echo "--- Success! ---"
echo "App is running at http://$(hostname -I | awk '{print $1}'):5000"
echo "Check status with: sudo systemctl status alsamixer.service"
