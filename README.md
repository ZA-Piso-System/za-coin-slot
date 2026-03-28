# ZA Coin Slot

## 🗺️ System Diagram
<p align="center">
<img width="622" height="561" alt="diagram" src="https://github.com/user-attachments/assets/91746030-287d-45e8-b700-16a717c52265" />
</p>

## 📀 1. Flash Armbian OS
- Download Armbian OS for your device.
- Install balenaEtcher.
- Insert your SD card into your computer.
- Open balenaEtcher and:
- Select the Armbian .img file
- Select your SD card
- Click Flash
- Insert the SD card into your device and power it on.

## 🔐 2. Connect via SSH
Find your device’s IP address, then connect:
```
ssh root@<DEVICE_IP>
```

## 🧰 3. Prerequisites
Make sure you have the following installed:
- Node.js (latest LTS)
- Git

## ⚙️ 4. Setup the Application
### 1. Clone the repository
```
git clone git@github.com:ZA-Piso-System/za-coin-slot.git
cd za-coin-slot
```

### 2. Install dependencies
```
npm install
```

### 3. Build the project
```
npm run build
```

## 🚀 5. Create Systemd Service
Create a systemd service so the app runs automatically.
```
sudo nano /etc/systemd/system/myapp.service
```

Paste this:
```
[Unit]
Description=ZA Coin Slot Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/npm start
WorkingDirectory=/root/za-coin-slot
Restart=always
User=root
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## ▶️ 6. Enable and Start the Service
```
sudo systemctl daemon-reload
sudo systemctl enable myapp
sudo systemctl start myapp
```

Check status:
```
sudo systemctl status myapp
```

View logs:
```
journalctl -u myapp -f
```
