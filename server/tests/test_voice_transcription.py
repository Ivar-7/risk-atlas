"""Voice intake is bounded, authenticated and never stores raw audio in a run."""

import asyncio
import os
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app import main
from app.auth import require_auth
from app.main import app
from app.engine.voice_transcription import MAX_AUDIO_BYTES, transcribe_recording


class VoiceTranscriptionTests(unittest.TestCase):
    def test_requires_authentication(self):
        response = TestClient(app).post('/api/exposure/transcribe', files={'file': ('offer.webm', b'audio', 'audio/webm')})
        self.assertEqual(response.status_code, 401)

    def test_authenticated_upload_returns_transcript(self):
        app.dependency_overrides[require_auth] = lambda: {'sub': 'voice_user'}
        try:
            with patch.object(main, 'transcribe_recording', new_callable=AsyncMock, return_value={'text': '25 houses in Kibera', 'model': 'gpt-transcribe'}) as transcribe:
                response = TestClient(app).post('/api/exposure/transcribe', files={'file': ('offer.webm', b'audio', 'audio/webm')})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['text'], '25 houses in Kibera')
            transcribe.assert_awaited_once_with(b'audio', 'audio/webm')
        finally:
            app.dependency_overrides.clear()

    def test_rejects_unsupported_or_oversize_audio(self):
        with self.assertRaisesRegex(ValueError, 'WebM'):
            asyncio.run(transcribe_recording(b'audio', 'text/plain'))
        with self.assertRaisesRegex(ValueError, 'smaller than 8 MB'):
            asyncio.run(transcribe_recording(b'x' * (MAX_AUDIO_BYTES + 1), 'audio/webm'))

    def test_transcript_uses_server_key_and_returns_editable_text(self):
        def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual(str(request.url), 'https://api.openai.com/v1/audio/transcriptions')
            self.assertEqual(request.headers['authorization'], 'Bearer test-key')
            body = request.read()
            self.assertIn(b'gpt-transcribe', body)
            self.assertIn(b'exposure.webm', body)
            return httpx.Response(200, json={'text': '25 iron-sheet houses in Kibera, KES 800,000 each.'})

        client_class = httpx.AsyncClient
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}), patch('app.engine.voice_transcription.httpx.AsyncClient', side_effect=lambda **kwargs: client_class(transport=httpx.MockTransport(handler))):
            result = asyncio.run(transcribe_recording(b'audio bytes', 'audio/webm;codecs=opus'))
        self.assertEqual(result, {'text': '25 iron-sheet houses in Kibera, KES 800,000 each.', 'model': 'gpt-transcribe'})

    def test_missing_key_fails_without_provider_call(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': ''}):
            with self.assertRaisesRegex(RuntimeError, 'OPENAI_API_KEY'):
                asyncio.run(transcribe_recording(b'audio', 'audio/webm'))

    def test_exhausted_provider_credits_have_a_specific_error(self):
        client_class = httpx.AsyncClient
        transport = httpx.MockTransport(lambda _: httpx.Response(429, json={'error': {'code': 'credit_balance_exhausted'}}))
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}), patch('app.engine.voice_transcription.httpx.AsyncClient', side_effect=lambda **kwargs: client_class(transport=transport)):
            with self.assertRaisesRegex(RuntimeError, 'credits are exhausted'):
                asyncio.run(transcribe_recording(b'audio', 'audio/webm'))


if __name__ == '__main__':
    unittest.main()
