from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import shutil
from pathlib import Path
from uuid import uuid4

from final import process_audio

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

TEMP_DIR = Path("temp_audio")
AUDIO_DIR = Path("generated_audio")

TEMP_DIR.mkdir(exist_ok=True)
AUDIO_DIR.mkdir(exist_ok=True)


@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/translator")
async def translator(request: Request):
    return templates.TemplateResponse("translator.html", {"request": request})


@app.post("/translate")
async def translate(
    audio: UploadFile = File(...),
    target_language: str = Form(...),
    source_language: str = Form(None)
):
    temp = TEMP_DIR / f"temp_audio_{uuid4().hex}.webm"

    try:
        with open(temp, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        result = process_audio(
            str(temp),
            target_language,
            source_language
        )

        return JSONResponse(content=result)

    finally:
        if temp.exists():
            temp.unlink()


@app.get("/audio/{filename}")
async def get_audio(filename: str):
    file_path = AUDIO_DIR / filename

    if not file_path.exists() or file_path.suffix.lower() != ".mp3":
        return JSONResponse(
            content={"error": "Audio file not found"},
            status_code=404
        )

    return FileResponse(
        file_path,
        media_type="audio/mpeg",
        filename=filename,
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )