"""Gemini routing and authenticated access to the current result."""
import asyncio
import json
import os
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app import main
from app.auth import require_auth
from app.engine.ai_provider import generate_text
from app.engine.voice_transcription import transcribe_recording

AsyncClient = httpx.AsyncClient


class GeminiVoiceTests(unittest.TestCase):
    def test_gemini_chat_uses_selected_model_and_system_context(self):
        def handler(request):
            self.assertIn('/models/gemini-2.5-flash:generateContent', str(request.url))
            self.assertEqual(request.headers['x-goog-api-key'], 'test-key')
            body = json.loads(request.content)
            self.assertIn('calculated loss', body['systemInstruction']['parts'][0]['text'])
            self.assertEqual(body['contents'][0]['parts'][0]['text'], 'Explain it')
            self.assertEqual(body['generationConfig']['thinkingConfig']['thinkingBudget'], 0)
            return httpx.Response(200, json={'candidates': [{'content': {'parts': [{'text': 'KES 10,000.'}]}}]})
        with patch.dict(os.environ, {'RISK_ATLAS_AI_PROVIDER': 'gemini', 'RISK_ATLAS_GEMINI_MODEL': 'gemini-2.5-flash', 'GEMINI_API_KEY': 'test-key'}), patch('app.engine.ai_provider.httpx.AsyncClient', side_effect=lambda **kw: AsyncClient(transport=httpx.MockTransport(handler))):
            answer = asyncio.run(generate_text('Current calculated loss is KES 10,000.', [{'role': 'user', 'content': 'Explain it'}]))
        self.assertEqual(answer, 'KES 10,000.')

    def test_gemini_transcribes_audio(self):
        def handler(request):
            body = json.loads(request.content)
            self.assertEqual(body['contents'][0]['parts'][1]['inlineData']['mimeType'], 'audio/webm')
            return httpx.Response(200, json={'candidates': [{'content': {'parts': [{'text': 'What is the loss?'}]}}]})
        with patch.dict(os.environ, {'RISK_ATLAS_AI_PROVIDER': 'gemini', 'RISK_ATLAS_GEMINI_MODEL': 'gemini-test', 'GEMINI_API_KEY': 'test-key'}), patch('app.engine.voice_transcription.httpx.AsyncClient', side_effect=lambda **kw: AsyncClient(transport=httpx.MockTransport(handler))):
            result = asyncio.run(transcribe_recording(b'audio', 'audio/webm'))
        self.assertEqual(result, {'text': 'What is the loss?', 'model': 'gemini-test'})

    def test_voice_chat_uses_owned_run_and_rejects_other_users_run(self):
        run = {'run_id': 'run-one', 'owner_id': 'alice', 'created_at': 'now', 'metrics': {'aal_kes': 1000}, 'scenarios': [], 'locations': [], 'briefing': 'Illustrative result'}
        main.app.dependency_overrides[require_auth] = lambda: {'sub': 'alice'}
        try:
            with patch.object(main, 'STORE', {'run-one': run}), patch.object(main, 'generate_text', new_callable=AsyncMock, return_value='The modelled AAL is KES 1,000.') as generate:
                response = TestClient(main.app).post('/api/voice/chat', json={'run_id': 'run-one', 'history': [{'role': 'user', 'content': 'What is AAL?'}]})
            self.assertEqual(response.status_code, 200)
            self.assertIn('1000', generate.await_args.args[0])
            self.assertEqual(response.json()['answer'], 'The modelled AAL is KES 1,000.')
            main.app.dependency_overrides[require_auth] = lambda: {'sub': 'bob'}
            with patch.object(main, 'STORE', {'run-one': run}), patch.object(main, 'load_run', return_value=None):
                response = TestClient(main.app).post('/api/voice/chat', json={'run_id': 'run-one', 'history': [{'role': 'user', 'content': 'What is AAL?'}]})
            self.assertEqual(response.status_code, 404)
        finally:
            main.app.dependency_overrides.clear()


if __name__ == '__main__':
    unittest.main()
