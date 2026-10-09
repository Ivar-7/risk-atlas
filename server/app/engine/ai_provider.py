"""Server-side AI provider selection and Gemini REST calls."""
from __future__ import annotations

import os
from urllib.parse import quote

import httpx


def provider() -> str:
    value = os.getenv('RISK_ATLAS_AI_PROVIDER', 'openai').strip().lower()
    if value not in {'openai', 'gemini'}:
        raise ValueError('RISK_ATLAS_AI_PROVIDER must be openai or gemini')
    return value


def model() -> str:
    if provider() == 'gemini':
        return os.getenv('RISK_ATLAS_GEMINI_MODEL', 'gemini-2.5-flash').strip() or 'gemini-2.5-flash'
    return os.getenv('RISK_ATLAS_OPENAI_MODEL', 'gpt-4o-mini').strip() or 'gpt-4o-mini'


def api_key() -> str:
    name = 'GEMINI_API_KEY' if provider() == 'gemini' else 'OPENAI_API_KEY'
    key = os.getenv(name, '').strip()
    if not key:
        raise RuntimeError(f'{name} is not configured on the API server')
    return key


def available() -> bool:
    return bool(os.getenv('GEMINI_API_KEY' if provider() == 'gemini' else 'OPENAI_API_KEY', '').strip())


def gemini_url() -> str:
    return f'https://generativelanguage.googleapis.com/v1beta/models/{quote(model(), safe="")}:generateContent'


def gemini_text(result: dict) -> str:
    return ''.join(part.get('text', '') for candidate in result.get('candidates', [])[:1]
                   for part in candidate.get('content', {}).get('parts', []) if isinstance(part.get('text'), str)).strip()


async def generate_text(instructions: str, history: list[dict[str, str]]) -> str:
    key = api_key()
    chosen = model()
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            if provider() == 'gemini':
                generation_config = {'maxOutputTokens': 420, 'temperature': 0.2}
                if chosen.startswith('gemini-2.5-flash'):
                    generation_config['thinkingConfig'] = {'thinkingBudget': 0}
                response = await client.post(gemini_url(), headers={'x-goog-api-key': key}, json={
                    'systemInstruction': {'parts': [{'text': instructions}]},
                    'contents': [{'role': 'model' if item['role'] == 'assistant' else 'user', 'parts': [{'text': item['content']}]} for item in history],
                    'generationConfig': generation_config,
                })
            else:
                response = await client.post('https://api.openai.com/v1/responses',
                    headers={'Authorization': f'Bearer {key}'}, json={
                        'model': chosen, 'instructions': instructions,
                        'input': [{'role': item['role'], 'content': item['content']} for item in history],
                        'max_output_tokens': 420,
                    })
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in {401, 403}:
            raise RuntimeError(f'{provider().title()} rejected the API key') from exc
        if exc.response.status_code == 429:
            raise RuntimeError(f'{provider().title()} is rate-limited or out of credits') from exc
        raise RuntimeError(f'{provider().title()} is unavailable ({exc.response.status_code})') from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise RuntimeError('AI provider request failed') from exc
    if provider() == 'gemini':
        answer = gemini_text(result)
    else:
        answer = ''.join(part.get('text', '') for item in result.get('output', [])
                         for part in item.get('content', []) if part.get('type') == 'output_text').strip()
    if not answer:
        raise RuntimeError('AI provider returned no answer')
    return answer
