import os
import requests

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

load_dotenv()

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5174"
)

KAGGLE_MODEL_API_URL = os.getenv(
    "KAGGLE_MODEL_API_URL",
    ""
).rstrip("/")

app = FastAPI(
    title="Sketch2Shape AI",
    description="2D Image to 3D Model Generation API",
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

    allowed_types = {
        "image/png",
        "image/jpeg",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PNG, JPG and WEBP images are supported."
        )

    if not KAGGLE_MODEL_API_URL:
        raise HTTPException(
            status_code=503,
            detail="The AI model API URL is not configured."
        )

    image_data = await file.read()

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    try:
        response = requests.post(
            f"{KAGGLE_MODEL_API_URL}/generate",
            files={
                "file": (
                    file.filename or "sketch.png",
                    image_data,
                    file.content_type
                )
            },
            timeout=(15, 660)
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="The AI model service failed to generate the 3D model."
            )

        content_type = response.headers.get(
            "content-type",
            ""
        )

        if content_type != "model/gltf-binary":
            raise HTTPException(
                status_code=502,
                detail="The AI service did not return a GLB model."
            )

        return Response(
            content=response.content,
            media_type="model/gltf-binary",
            headers={
                "Content-Disposition":
                    'attachment; filename="sketch2shape.glb"'
            }
        )

    except requests.Timeout:
        raise HTTPException(
            status_code=504,
            detail="3D generation took too long. Please try again."
        )

    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the AI model service."
        )
