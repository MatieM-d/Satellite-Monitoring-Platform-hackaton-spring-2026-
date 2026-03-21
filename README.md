# 🛰 Satellite Monitoring Platform

Веб-платформа мониторинга пролётов спутников на основе TLE-данных.

## 🚀 Быстрый запуск (Docker)

### Требования
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Запуск
```bash
docker-compose up --build
```

Откройте в браузере: **http://localhost**

---

## 💻 Запуск без Docker

### Backend
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Mac/Linux  
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Откройте: **http://localhost:5173**

---

## 🛠 Стек
| Слой | Технологии |
|------|-----------|
| Frontend | React, Vite, Leaflet.js, satellite.js, Tailwind CSS |
| Backend | Python, FastAPI, sgp4 |
| Данные | CelesTrak TLE API |

## 📡 Функционал
- Интерактивная карта с 20+ группами спутников
- Расчёт орбит по алгоритму SGP4 в реальном времени
- Фильтрация по назначению, оператору, типу орбиты
- Трек орбиты и зона радиовидимости при клике
- Таймлайн с симуляцией времени (×1/5/10/60)
- Загрузка своих TLE из файла или по URL