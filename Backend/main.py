from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import satellites, passes

app = FastAPI(title="Satellite Monitor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # в проде заменить на адрес фронта
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(satellites.router, prefix="/api/satellites", tags=["satellites"])
app.include_router(passes.router, prefix="/api/passes", tags=["passes"])

@app.get("/")
def root():
    return {"status": "ok", "message": "Satellite Monitor API"}