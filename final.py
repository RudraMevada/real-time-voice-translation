from pathlib import Path
from faster_whisper import WhisperModel
from deep_translator import GoogleTranslator
from gtts import gTTS

print("Loading Whisper model...")
model = WhisperModel("medium", compute_type="int8")
print("Model loaded")

AUDIO_DIR = Path("generated_audio")
AUDIO_DIR.mkdir(exist_ok=True)


translation_language_map = {
    "english": "en",
    "hindi": "hi",
    "gujarati": "gu",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "chinese": "zh-CN",
    "italian": "it",
    "portuguese": "pt",
    "dutch": "nl",
    "russian": "ru",
    "japanese": "ja",
    "arabic": "ar",
    "korean": "ko",
    "turkish": "tr",
    "polish": "pl",
    "vietnamese": "vi",
    "indonesian": "id",
    "thai": "th"
}

tts_language_map = {
    "english": "en",
    "hindi": "hi",
    "gujarati": "gu",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "chinese": "zh-CN",
    "italian": "it",
    "portuguese": "pt",
    "dutch": "nl",
    "russian": "ru",
    "japanese": "ja",
    "arabic": "ar",
    "korean": "ko",
    "turkish": "tr",
    "polish": "pl",
    "vietnamese": "vi",
    "indonesian": "id",
    "thai": "th"
}

whisper_source_map = {
    "english": "en",
    "hindi": "hi",
    "gujarati": "gu",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "chinese": "zh",
    "italian": "it",
    "portuguese": "pt",
    "dutch": "nl",
    "russian": "ru",
    "japanese": "ja",
    "arabic": "ar",
    "korean": "ko",
    "turkish": "tr",
    "polish": "pl",
    "vietnamese": "vi",
    "indonesian": "id",
    "thai": "th"
}

source_translation_map = {
    "english": "en",
    "hindi": "hi",
    "gujarati": "gu",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "chinese": "zh-CN",
    "italian": "it",
    "portuguese": "pt",
    "dutch": "nl",
    "russian": "ru",
    "japanese": "ja",
    "arabic": "ar",
    "korean": "ko",
    "turkish": "tr",
    "polish": "pl",
    "vietnamese": "vi",
    "indonesian": "id",
    "thai": "th"
}


def process_audio(audio_path, target_language, source_language=None):
    try:
        print("Transcribing audio...")

        whisper_language = None
        if source_language:
            whisper_language = whisper_source_map.get(source_language.lower())

        transcribe_kwargs = {
            "beam_size": 8,
            "best_of": 5,
            "temperature": 0.0,
            "vad_filter": True,
            "condition_on_previous_text": False
        }

        if whisper_language:
            transcribe_kwargs["language"] = whisper_language

        segments, info = model.transcribe(audio_path, **transcribe_kwargs)

        text_parts = [seg.text.strip() for seg in segments if seg.text.strip()]
        text = " ".join(text_parts).strip()

        print("Detected:", info.language)
        print("Text:", text)

        if not text:
            return {"error": "Speech not detected. Please speak clearly."}

        target_name = target_language.lower().strip()
        translate_code = translation_language_map.get(target_name)

        if not translate_code:
            return {"error": "Language not supported"}

        source_translate_code = "auto"
        if source_language:
            source_translate_code = source_translation_map.get(
                source_language.lower().strip(),
                "auto"
            )

        translated = GoogleTranslator(
            source=source_translate_code,
            target=translate_code
        ).translate(text)

        if not translated:
            return {"error": "Translation failed."}

        print("Translated:", translated)

        audio_url = ""
        tts_code = tts_language_map.get(target_name)

        if tts_code:
            try:
                speech_file = AUDIO_DIR / "latest_translation.mp3"

                if speech_file.exists():
                    speech_file.unlink()

                tts = gTTS(text=translated, lang=tts_code)
                tts.save(str(speech_file))

                audio_url = f"/audio/latest_translation.mp3?v={Path(speech_file).stat().st_mtime_ns}"
            except Exception as tts_error:
                print("TTS error:", tts_error)
                audio_url = ""

        return {
            "source_text": text,
            "translated_text": translated,
            "detected_language": info.language,
            "audio_url": audio_url
        }

    except Exception as e:
        return {"error": str(e)}