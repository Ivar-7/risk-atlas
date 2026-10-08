from __future__ import annotations

import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import pandas as pd

from app.engine.exposure_rules import parse_free_text


def ai_available() -> bool:
    return bool(os.environ.get('OPENAI_API_KEY'))


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
        'model': os.environ.get('RISK_ATLAS_OPENAI_MODEL', 'gpt-4o-mini'),
        'input': [
            {'role': 'system', 'content': 'Extract only explicitly stated synthetic exposure groups. A value is per building only if the text says so. Never guess missing count, class, location, or KES value. Return an empty groups array if any required detail is absent. Valid places: ' + ', '.join(names)},
            {'role': 'user', 'content': text},
        ],
        'text': {'format': {'type': 'json_schema', 'name': 'exposure_groups', 'strict': True, 'schema': schema}},
    }
    req = Request('https://api.openai.com/v1/responses', data=json.dumps(body).encode(), headers={
        'Authorization': 'Bearer ' + os.environ['OPENAI_API_KEY'], 'Content-Type': 'application/json',
    }, method='POST')
    try:
        with urlopen(req, timeout=30) as response:
            result = json.load(response)
    except (HTTPError, URLError) as exc:
        raise ValueError('AI extraction service unavailable; retry or use the validated rules preview.') from exc
    content = [part.get('text') for item in result.get('output', []) for part in item.get('content', []) if part.get('type') == 'output_text']
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
    return {'source': 'openai', 'model': body['model'], 'groups': checked, 'notes': ['Review every extracted value before running the model.'] if checked else ['No complete exposure groups found.'], 'rows_added': sum(g['count'] for g in checked), 'total_tiv_kes': sum(g['total_tiv_kes'] for g in checked)}
