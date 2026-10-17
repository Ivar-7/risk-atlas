"""Bounded, server-side transcription of a recorded exposure description."""
from __future__ import annotations

import base64

import httpx
from app.engine.ai_provider import api_key, gemini_text, gemini_url, model, provider


MAX_AUDIO_BYTES = 8 * 1024 * 1024
ALLOWED_AUDIO_TYPES = {
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
}
TRANSCRIPTION_MODEL = 'gpt-transcribe'


async def transcribe_recording(data: bytes, content_type: str) -> dict[str, str]:
    """Send one short recording to OpenAI without exposing the API key to the browser."""
    media_type = content_type.split(';', 1)[0].strip().lower()
    extension = ALLOWED_AUDIO_TYPES.get(media_type)
    if extension is None:
        raise ValueError('Record audio as WebM, MP4, MP3 or WAV')
    if not data or len(data) > MAX_AUDIO_BYTES:
        raise ValueError('Recording must be non-empty and smaller than 8 MB')
    key = api_key()
    selected = provider()
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            if selected == 'gemini':
                response = await client.post(gemini_url(), headers={'x-goog-api-key': key}, json={
                    'contents': [{'role': 'user', 'parts': [
                        {'text': 'Transcribe the spoken words exactly. Return only the transcript.'},
                        {'inlineData': {'mimeType': media_type, 'data': base64.b64encode(data).decode('ascii')}},
                    ]}],
                    'generationConfig': {'thinkingConfig': {'thinkingBudget': 0}} if model().startswith('gemini-2.5-flash') else {},
                })
            else:
                response = await client.post(
                    'https://api.openai.com/v1/audio/transcriptions',
                    headers={'Authorization': f'Bearer {key}'},
                    data={'model': TRANSCRIPTION_MODEL},
                    files={'file': (f'exposure.{extension}', data, media_type)},
                )
            response.raise_for_status()
            transcript = gemini_text(response.json()) if selected == 'gemini' else response.json().get('text')
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        try:
            upstream_error = exc.response.json().get('error') or {}
        except (ValueError, AttributeError):
            upstream_error = {}
        if status == 429 and upstream_error.get('code') in {'credit_balance_exhausted', 'insufficient_quota'}:
            raise RuntimeError(f'{selected.title()} transcription credits are exhausted. Add API credits or use browser speech input.') from exc
        if status == 401:
            raise RuntimeError(f'{selected.title()} transcription rejected the API key. Check the server key or use browser speech input.') from exc
        if status == 429:
            raise RuntimeError(f'{selected.title()} transcription is rate-limited. Retry shortly or use browser speech input.') from exc
        raise RuntimeError('Voice transcription provider is unavailable; retry or use browser speech input') from exc
    except (httpx.HTTPError, ValueError, TypeError) as exc:
        raise RuntimeError('Voice transcription failed; retry or type the exposure') from exc
    if not isinstance(transcript, str) or not transcript.strip():
        raise RuntimeError('No speech was transcribed; retry or type the exposure')
    if len(transcript) > 4000:
        raise ValueError('Transcript exceeds the 4,000-character exposure limit')
    return {'text': transcript.strip(), 'model': model() if selected == 'gemini' else TRANSCRIPTION_MODEL}
