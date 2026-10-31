import os
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI(
    title="Sketch2Shape AI",
    description="2D Sketch to 3D Model Generation API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to Sketch2Shape AI API",
        "status": "Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "project": "Sketch2Shape AI"
    }


@app.post("/generate")
async def generate_model(file: UploadFile = File(...)):

    allowed_types = ["image/png", "image/jpeg", "image/webp"]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PNG, JPG and WEBP images are supported."
        )

    image_data = await file.read()

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    return {
        "message": "Sketch uploaded successfully!",
        "filename": file.filename,
        "size": len(image_data),
        "status": "received"
    }