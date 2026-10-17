from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import pandas as pd

from app.engine.exposure_rules import parse_free_text
from app.engine.ai_provider import available, api_key, gemini_text, gemini_url, model, provider


def ai_available() -> bool:
    return available()


def preview_exposure(text: str, hotspots: pd.DataFrame) -> dict:
    if not text.strip():
        return {'source': 'none', 'groups': [], 'notes': ['No extra exposure supplied.'], 'rows_added': 0, 'total_tiv_kes': 0}
    if not ai_available():
        _, meta = parse_free_text(text, hotspots)
        groups = meta.get('groups', [])
        return {'source': 'rules', 'groups': groups, 'notes': meta['notes'], 'rows_added': sum(g['count'] for g in groups), 'total_tiv_kes': sum(g['total_tiv_kes'] for g in groups)}

    names = hotspots['name'].tolist()
    schema = {
        'type': 'object',
        'properties': {'groups': {'type': 'array', 'items': {'type': 'object', 'properties': {
            'count': {'type': 'integer'},
            'housing_class': {'type': 'string', 'enum': ['informal_iron_sheet', 'semi_permanent', 'permanent_masonry', 'concrete_rcc']},
            'place': {'type': 'string', 'enum': names},
            'tiv_each_kes': {'type': 'number'},
        }, 'required': ['count', 'housing_class', 'place', 'tiv_each_kes'], 'additionalProperties': False}}},
        'required': ['groups'], 'additionalProperties': False,
    }
    body = {
        'model': model(),
        'input': [
            {'role': 'system', 'content': 'Extract only explicitly stated synthetic exposure groups. A value is per building only if the text says so. Never guess missing count, class, location, or KES value. Return an empty groups array if any required detail is absent. Valid places: ' + ', '.join(names)},
            {'role': 'user', 'content': text},
        ],
        'text': {'format': {'type': 'json_schema', 'name': 'exposure_groups', 'strict': True, 'schema': schema}},
    }
    selected = provider()
    if selected == 'gemini':
        gemini_schema = json.loads(json.dumps(schema))
        gemini_schema.pop('additionalProperties', None)
        gemini_schema['properties']['groups']['items'].pop('additionalProperties', None)
        body = {
            'systemInstruction': {'parts': [{'text': body['input'][0]['content']}]},
            'contents': [{'role': 'user', 'parts': [{'text': text}]}],
            'generationConfig': {'responseMimeType': 'application/json', 'responseSchema': gemini_schema, 'temperature': 0},
        }
    req = Request(gemini_url() if selected == 'gemini' else 'https://api.openai.com/v1/responses',
                  data=json.dumps(body).encode(), headers={
        **({'x-goog-api-key': api_key()} if selected == 'gemini' else {'Authorization': 'Bearer ' + api_key()}),
        'Content-Type': 'application/json',
    }, method='POST')
    try:
        with urlopen(req, timeout=30) as response:
            result = json.load(response)
    except HTTPError as exc:
        try:
            upstream_error = json.loads(exc.read()).get('error') or {}
        except (ValueError, AttributeError):
            upstream_error = {}
        if exc.code == 429 and upstream_error.get('code') in {'credit_balance_exhausted', 'insufficient_quota'}:
            _, meta = parse_free_text(text, hotspots)
            groups = meta.get('groups', [])
            return {'source': 'rules', 'groups': groups,
                    'notes': [f'{selected.title()} API credits are exhausted. Validated rules were used; no AI extraction occurred.', *meta['notes']],
                    'rows_added': sum(group['count'] for group in groups),
                    'total_tiv_kes': sum(group['total_tiv_kes'] for group in groups)}
        raise ValueError('AI extraction service unavailable; retry or use the validated rules preview.') from exc
    except URLError as exc:
        raise ValueError('AI extraction service unavailable; retry or use the validated rules preview.') from exc
    content = [gemini_text(result)] if selected == 'gemini' else [part.get('text') for item in result.get('output', []) for part in item.get('content', []) if part.get('type') == 'output_text']
    if not content:
        raise ValueError('AI extraction returned no reviewable exposure groups')
    groups = json.loads(content[0]).get('groups', [])
    if not isinstance(groups, list) or len(groups) > 10:
        raise ValueError('AI extraction returned an invalid number of groups')
    checked = []
    for group in groups:
        if not isinstance(group, dict) or not 1 <= group.get('count', 0) <= 80 or group.get('place') not in names or group.get('housing_class') not in schema['properties']['groups']['items']['properties']['housing_class']['enum'] or not 0 < group.get('tiv_each_kes', 0) <= 1_000_000_000:
            raise ValueError('AI extraction returned an invalid exposure group')
        checked.append({**group, 'total_tiv_kes': group['count'] * group['tiv_each_kes']})
    actual_model = model() if selected == 'gemini' else result.get('model')
    response_id = result.get('responseId') if selected == 'gemini' else result.get('id')
    if not isinstance(actual_model, str) or not actual_model or not isinstance(response_id, str) or not response_id:
        raise ValueError('AI extraction response lacks model provenance')
    return {'source': selected, 'model': actual_model, 'response_id': response_id, 'groups': checked, 'notes': ['Review every extracted value before running the model.'] if checked else ['No complete exposure groups found.'], 'rows_added': sum(g['count'] for g in checked), 'total_tiv_kes': sum(g['total_tiv_kes'] for g in checked)}
