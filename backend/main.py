from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os

# Create the FastAPI application
app = FastAPI(title="PDF Utility Backend", version="1.0.0")

# Configure CORS (Cross-Origin Resource Sharing)
# In production, we should be more strict, but for local electron app, this is generally safe.
# We explicitly allow localhost ports.
origins = [
    "http://localhost:5173",  # Vite Dev Server
    "http://localhost:3000",  # React default
    "app://."                 # Electron production (sometimes needed)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local desktop app, "*" is acceptable as it's isolated.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "PDF Utility Backend is running"}

@app.get("/health")
async def health_check():
    """
    Simple health check endpoint for the frontend to verify connectivity.
    """
    return {"status": "ok", "service": "backend"}

# Register Routers
from api_router import router as pdf_router
app.include_router(pdf_router, prefix="/api/pdf", tags=["PDF Operations"])

from routers.convert_router import router as convert_router
app.include_router(convert_router)

def start():
    """Launched with `poetry run start` at root level"""
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    # When run directly (or via Electron spawn)
    uvicorn.run(app, host="127.0.0.1", port=8000)
