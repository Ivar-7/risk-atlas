"""Evidence-first extraction for property offers; never makes an underwriting decision."""
from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
import re

from docx import Document
from pypdf import PdfReader

from app.engine.hazard_validation import TIERS, proxy_point_covered, proxy_score
from app.engine.config_load import load_parameters
from app.engine.vulnerability import damage_ratio
import numpy as np

MAX_BYTES = 10 * 1024 * 1024
MAX_PAGES = 60
MAX_TEXT_CHARS = 150_000


@dataclass
class Line:
    text: str
    source: str


def _lines(filename: str, data: bytes) -> list[Line]:
    if not data or len(data) > MAX_BYTES:
        raise ValueError('Upload a non-empty file smaller than 10 MB.')
    suffix = filename.lower().rsplit('.', 1)[-1]
    if suffix == 'pdf':
        try:
            reader = PdfReader(BytesIO(data))
            if reader.is_encrypted:
                raise ValueError('Encrypted PDFs are not supported.')
            if len(reader.pages) > MAX_PAGES:
                raise ValueError('PDF exceeds the 60-page limit.')
            result = [Line(re.sub(r'\s+', ' ', line).strip(), f'Page {index}')
                      for index, page in enumerate(reader.pages, 1)
                      for line in (page.extract_text() or '').splitlines() if line.strip()]
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError('Could not read this PDF.') from exc
    elif suffix == 'docx':
        try:
            document = Document(BytesIO(data))
            result = []
            for index, block in enumerate(document.iter_inner_content(), 1):
                if hasattr(block, 'rows'):
                    texts = [' | '.join(cell.text for cell in row.cells) for row in block.rows]
                else:
                    texts = [block.text]
                result.extend(Line(re.sub(r'\s+', ' ', line).strip(), f'Block {index}') for text in texts for line in text.splitlines() if line.strip())
        except Exception as exc:
            raise ValueError('Could not read this Word document.') from exc
    else:
        raise ValueError('Upload a PDF or Word .docx file.')
    if sum(len(line.text) for line in result) < 80:
        raise ValueError('No extractable text found. For scanned PDFs, run OCR before uploading.')
    if sum(len(line.text) for line in result) > MAX_TEXT_CHARS:
        raise ValueError('Extracted text exceeds the 150,000-character limit.')
    return result


def _find(lines: list[Line], pattern: str, group: int = 0, *, last: bool = False):
    matches = [(line, match) for line in lines if (match := re.search(pattern, line.text, re.I))]
    if not matches:
        return None
    line, match = matches[-1] if last else matches[0]
    return {'value': match.group(group).strip(), 'source': line.source, 'excerpt': line.text[:300]}


def _first(*values):
    return next((value for value in values if value), None)


def _modelled_financial_scenarios(fields: dict, evidence: dict | None) -> dict | None:
    """Illustrative physical loss from document TIV and point proxy, never a coverage decision."""
    if not evidence or not evidence['proxy_covered'] or not fields['total_insured_value'] or not fields['construction']:
        return None
    construction = fields['construction']['value'].lower()
    if 'rcc' in construction or 'reinforced concrete' in construction or 'concrete' in construction:
        klass = 'concrete_rcc'
    elif 'masonry' in construction or 'brick' in construction:
        klass = 'permanent_masonry'
    elif 'semi-permanent' in construction or 'semi permanent' in construction:
        klass = 'semi_permanent'
    elif 'iron sheet' in construction or 'informal' in construction:
        klass = 'informal_iron_sheet'
    else:
        return None
    tiv = float(fields['total_insured_value']['value'].replace(',', ''))
    if not np.isfinite(tiv) or tiv <= 0:
        return None
    params = load_parameters()
    scenarios = []
    for tier, spec in sorted(params['return_periods'].items(), key=lambda item: item[1]['years']):
        score = float(evidence['tiers'][tier])
        depth = score * float(params['hazard']['max_depth_m'])
        ratio = float(damage_ratio(np.array([depth]), np.array([klass]), params)[0])
        scenarios.append({
            'tier': tier,
            'return_period_years': spec['years'],
            'annual_exceedance': spec['annual_exceedance'],
            'hazard_score': score,
            'damage_ratio': ratio,
            'ground_up_loss_kes': round(ratio * tiv, 2),
        })
    return {
        'tiv_kes': tiv,
        'housing_class': klass,
        'basis': 'Point proxy score × assumed maximum depth, then the adapted JRC Africa residential vulnerability function × document-stated TIV.',
        'construction_warning': 'The vulnerability curve is adapted from residential reference data. Verify that it applies to this property; this is not a calibrated claims estimate.',
        'scenarios': scenarios,
    }


def review_document(filename: str, data: bytes) -> dict:
    lines = _lines(filename, data)
    fields = {
        'reference': _find(lines, r'\bREFERENCE:\s*([A-Z0-9-]+)', 1),
        'insured': _first(_find(lines, r'\bCLIENT:\s*(.+)', 1), _find(lines, r'\b(?:INSURED|POLICYHOLDER):\s*(.+)', 1)),
        'address': _first(_find(lines, r'\bSTREET ADDRESS:\s*(.+)', 1), _find(lines, r'\b(?:PROPERTY ADDRESS|RISK ADDRESS|LOCATION):\s*(.+)', 1)),
        'coordinates': _first(_find(lines, r'\bGPS COORDINATES:\s*(.+)', 1), _find(lines, r'\bCOORDINATES:\s*(.+)', 1)),
        'construction': _first(_find(lines, r'\bCONSTRUCTION CLASSIFICATION:\s*(.+)', 1), _find(lines, r'\bCONSTRUCTION TYPE:\s*(.+)', 1)),
        'floors': _find(lines, r'\bTotal Number of Floors:\s*(.+)', 1),
        'flood_history': _find(lines, r'No flood losses recorded[^.]*\.', 0),
        'pump_capacity': _find(lines, r'Sump pump capacity:\s*(.+)', 1),
        'coverage': _first(_find(lines, r'\bCOVERAGE TYPE:\s*(.+)', 1), _find(lines, r'\b(?:COVER|COVERAGE):\s*(.+)', 1)),
        'total_insured_value': _first(_find(lines, r'full TIV\s*\(KES\s*([\d,]+)\)', 1), _find(lines, r'\b(?:TOTAL INSURED VALUE|SUM INSURED|TIV)\s*[:=]\s*(?:KES\s*)?([\d,]+)', 1)),
        'flood_deductible': _first(_find(lines, r'(\d+(?:\.\d+)?% deductible or KES\s*[\d,]+\s*minimum)', 1), _find(lines, r'\b(?:FLOOD\s+)?DEDUCTIBLE\s*[:=]\s*(.+)', 1)),
        'ground_up_loss': _find(lines, r'\bGROUND[ -]UP LOSS\s*[:=]\s*(?:KES\s*)?([\d,]+(?:\.\d+)?)', 1),
        'limit': _find(lines, r'\b(?:(?:POLICY|FLOOD|COVERAGE)\s+)?LIMIT\s*[:=]\s*(?:KES\s*)?([\d,]+(?:\.\d+)?)', 1),
        'gross_loss': _find(lines, r'\bGROSS LOSS\s*[:=]\s*(?:KES\s*)?([\d,]+(?:\.\d+)?)', 1),
        'quota_share': _find(lines, r'\bQUOTA SHARE\s*[:=]\s*(\d+(?:\.\d+)?\s*%)', 1),
        'catastrophe_excess_of_loss': _find(lines, r'\b(?:CATASTROPHE|CAT)\s+EXCESS OF LOSS\s*[:=]\s*(.+)', 1),
        'net_loss': _find(lines, r'\bNET LOSS\s*[:=]\s*(?:KES\s*)?([\d,]+(?:\.\d+)?)', 1),
        'broker_recommendation': _find(lines, r'\bACCEPT at standard rates\b[^.]*\.?', 0),
        'roof_condition': _find(lines, r'(Proof of annual roofing membrane inspection[^)]*\))', 1),
        'tank_condition': _find(lines, r'(Completion of basement 2 fuel tank secondary containment improvement[^)]*\))', 1),
        'lighting_condition': _find(lines, r'(Emergency lighting replacement[^)]*\))', 1),
    }
    # Some PDFs wrap sentences across lines; keep only source-backed values.
    missing = [key for key in ('insured', 'address', 'coordinates', 'construction', 'total_insured_value', 'coverage') if not fields[key]]
    scores = None
    coordinates = fields['coordinates']
    if coordinates:
        match = re.search(r'(-?\d+(?:\.\d+)?)\s*°?\s*([NS])[,;\s]+(-?\d+(?:\.\d+)?)\s*°?\s*([EW])', coordinates['value'], re.I)
        if match:
            lat = abs(float(match.group(1))) * (-1 if match.group(2).upper() == 'S' else 1)
            lon = abs(float(match.group(3))) * (-1 if match.group(4).upper() == 'W' else 1)
        else:
            decimal = re.search(r'(-?\d+(?:\.\d+)?)[,;\s]+(-?\d+(?:\.\d+)?)', coordinates['value'])
            lat, lon = (float(decimal.group(1)), float(decimal.group(2))) if decimal else (None, None)
        if lat is not None and lon is not None:
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                covered = proxy_point_covered(lat, lon)
                scores = {'latitude': lat, 'longitude': lon, 'proxy_covered': covered, 'tiers': {tier: proxy_score(lat, lon, tier) for tier in TIERS} if covered else {}}
                if not covered:
                    missing.append('coordinates inside the Nairobi hazard layer')
            else:
                missing.append('coordinates inside the Nairobi hazard layer')
        else:
            missing.append('parseable coordinates')

    checks = []
    if not fields['coverage']:
        checks.append('Confirm whether flood cover is requested and obtain the coverage wording.')
    elif 'excluding flood' in fields['coverage']['value'].lower():
        checks.append('Confirm whether flood cover is requested: the stated all-risks placement excludes it.')
    if scores and scores['proxy_covered'] and not any(value > 0 for value in scores['tiers'].values()):
        checks.append('The point has no signal in the hazard proxy. Obtain a site flood and drainage assessment; zero proxy signal is not proof of safety.')
    elif scores and scores['proxy_covered']:
        checks.append('Review the site flood and drainage assessment against the proxy signal before setting flood terms.')
    else:
        checks.append('Verify geocoded coordinates before using the hazard layer.')
    if fields['floors'] and 'basement' in fields['floors']['value'].lower():
        checks.append('Inspect basement ingress routes, sump capacity, backup power and maintenance records.')
    if fields['total_insured_value']:
        checks.append('Obtain an independent valuation and schedule; the extracted TIV is a document-stated amount.')
    else:
        checks.append('Obtain total insured value and an independent valuation before considering limits.')
    if fields['flood_history']:
        checks.append('Verify the stated absence of flood claims with the insurer and inspect prior water ingress records.')
    if fields['construction'] and 'RCC' in fields['construction']['value'].upper():
        checks.append('Do not apply the model’s residential RCC vulnerability curve to this commercial building without validation.')
    for key in ('roof_condition', 'tank_condition', 'lighting_condition'):
        if fields[key]:
            checks.append(f"Confirm completion: {fields[key]['value']}")
    if missing:
        checks.insert(0, 'Request the missing fields and verify any uncertain extraction against the original document.')

    return {
        'filename': filename,
        'fields': {key: value for key, value in fields.items() if value},
        'missing': missing,
        'model_evidence': scores,
        'financial_model': _modelled_financial_scenarios(fields, scores),
        'advice': {
            'status': 'Underwriter review required',
            'summary': 'Do not infer a flood premium, limit, or acceptance decision from this document and the point proxy alone. Review source claims and the checks below before deciding terms.',
            'checks': checks,
        },
        'limitations': [
            'Extraction uses deterministic text patterns; fields must be checked against the source.',
            'The hazard layer is a 0–1 susceptibility proxy, not measured flood depth; it can miss drainage-driven flooding.',
            'The current vulnerability curves are for residential classes, not this commercial property.',
            'This review does not add the offered property to the sample portfolio or calculate a decision-grade loss.',
        ],
    }
