Aplicación VulnQ propuesta para el TFG de la ESI UCLM en colaboración grupo GSyA
# VulnQ – Manual de instalación y arranque (sin Docker)

> Última actualización: **10 jul 2025**  
> Repositorio: <https://github.com/gonzalodlr/vulnq_TFG>

---

## Índice
1. [Requisitos previos](#requisitos-previos)  
2. [Clonar el repositorio](#clonar-el-repositorio)  
3. [Base de datos MySQL](#base-de-datos-mysql)  
4. [Archivos `.env`](#archivos-env)  
5. [Instalación y arranque de servicios](#instalación-y-arranque-de-servicios)  
6. [Flujo de trabajo recomendado](#flujo-de-trabajo-recomendado)
---

## Requisitos previos

| Componente | Versión recomendada | Instalación rápida (Ubuntu / WSL / macOS) |
|------------|--------------------|-------------------------------------------|
| **Node.js** | ≥ 20 LTS | `nvm install 20 && nvm use 20` |
| **npm** | viene con Node | — |
| **TypeScript CLI** | 5 (opcional) | `npm i -g typescript` |
| **Python** | 3.10 – 3.12 | `sudo apt install python3 python3-venv` |
| **MySQL 8 / MariaDB 10.6** | servidor local | `sudo apt install mysql-server` |
| **Git** | 2.30+ | `sudo apt install git` |

---

## Clonar el repositorio

```bash
git clone https://github.com/gonzalodlr/vulnq_TFG.git
cd vulnq_TFG
```

## Base de datos MySQL
```bash
CREATE DATABASE vulnq_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vulnq'@'localhost' IDENTIFIED BY 'changeme';
GRANT ALL PRIVILEGES ON vulnq_db.* TO 'vulnq'@'localhost';
FLUSH PRIVILEGES;
```

## Archivos .env
### Backend
```bash
PORT=5002
IP_ADDRESS=localhost
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=vulnq
DB_PASSWORD=changeme
DB_NAME=vulnq_db
JWT_SECRET=change_me
ACCESS_TOKEN_SECRET=change_me_access
REFRESH_TOKEN_SECRET=change_me_refresh
RESEND_API_KEY=your_resend_key
```

### Backend ML
```bash
# BBDD
DB_HOST=localhost
DB_USER=vulnq
DB_PASSWORD=changeme
DB_NAME=vulnq_db
# ML model configuration
SERVER_IP="localhost"
SERVER_PORT=5003
# AUTH TOKEN
TOKEN="tu_token"
```

### Frontend
```bash
PORT=3000
BACKEND_URL="http://localhost:5002"
BACKEND_ML_URL="http://localhost:5003"
JWT_SECRET="tu_token"
TOKEN_ML="tu_token"
DB_HOST="localhost"
DB_USER="user"
DB_PASSWORD="password"
DB_CVE="cve_db"
DB_CWE="cwe_db"
DB_CPE="cpe_db"
DB_CAPEC="capec_db"
```

## Instalación y arranque de servicios
### Backend (Node/TypeScript)
```bash
cd backend
npm install
npm run dev          # reinicio automático con nodemon

# Producción:
# npm run build && npm run start
```

### Backend ML (Flask)
```bash
cd backend_ml
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python run.py
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000

# Producción:
# npm run build && npm run start
```

## Flujo de trabajo recomendado
1. Inicia backend con npm run dev.
2. Inicia backend_ml con python run.py (.venv activado)
3. Arranca frontend con npm run dev.
6. Ves a la URL del frontend.
