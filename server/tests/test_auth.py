import os
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.auth import verify_session
from app import main
from app.main import app
from app.engine.ingestion import load_portfolio


class AuthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        cls.private_key = private
        cls.public_pem = private.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode()

    def token(self, **changes):
        now = datetime.now(timezone.utc)
        claims = {
            'iss': 'https://test.clerk.accounts.dev',
            'sub': 'user_test',
            'sid': 'sess_test',
            'azp': 'http://localhost:5173',
            'iat': now,
            'nbf': now,
            'exp': now + timedelta(minutes=1),
        }
        claims.update(changes)
        return jwt.encode(claims, self.private_key, algorithm='RS256')

    def test_api_requires_session_even_when_frontend_is_bypassed(self):
        client = TestClient(app)
        self.assertEqual(client.get('/api/health').status_code, 200)
        for method, path in [('get', '/api/defaults'), ('get', '/api/runs/latest'), ('get', '/api/audit'), ('post', '/api/runs'), ('post', '/api/exposure/preview'), ('post', '/api/documents/analyze')]:
            with self.subTest(path=path):
                self.assertEqual(getattr(client, method)(path).status_code, 401)

    def test_verifies_signature_issuer_time_and_authorized_origin(self):
        settings = {
            'CLERK_ISSUER': 'https://test.clerk.accounts.dev',
            'CLERK_JWT_KEY': self.public_pem,
            'RISK_ATLAS_CORS_ORIGINS': 'http://localhost:5173',
        }
        with patch.dict(os.environ, settings):
            self.assertEqual(verify_session(self.token())['sub'], 'user_test')
            response = TestClient(app).get('/api/defaults', headers={'Authorization': f'Bearer {self.token()}'})
            self.assertEqual(response.status_code, 200)
            valid = self.token()
            header, payload, signature = valid.split('.')
            tampered = f"{header}.{payload}.{('x' if signature[0] != 'x' else 'y')}{signature[1:]}"
            for token in [
                self.token(iss='https://other.clerk.accounts.dev'),
                self.token(azp='https://untrusted.example'),
                self.token(exp=datetime.now(timezone.utc) - timedelta(minutes=2)),
                self.token(sts='pending'),
                tampered,
            ]:
                with self.subTest(token=token[:20]), self.assertRaises(HTTPException):
                    verify_session(token)

    def test_unconfigured_verifier_fails_closed(self):
        with patch.dict(os.environ, {'CLERK_ISSUER': ''}):
            with self.assertRaises(HTTPException) as caught:
                verify_session(self.token())
            self.assertEqual(caught.exception.status_code, 503)

    def test_runs_are_visible_only_to_their_owner(self):
        sample = {'run_id': 'sample', 'owner_id': None, 'sample_run': True, 'created_at': '2026-10-08T00:00:00+00:00'}
        owned = {'run_id': 'owned', 'owner_id': 'user_a', 'created_at': '2026-10-08T01:00:00+00:00'}
        other = {'run_id': 'other', 'owner_id': 'user_b', 'created_at': '2026-10-08T02:00:00+00:00'}
        with patch.object(main, 'STORE', {row['run_id']: row for row in (sample, owned, other)}), patch.object(main, 'SAMPLE_RUN_ID', 'sample'), patch.object(main, 'load_run', return_value=None), patch.object(main, 'load_latest_run', return_value=None):
            self.assertEqual(main.latest_run(claims={'sub': 'user_a'})['run_id'], 'owned')
            self.assertEqual(main.latest_run(claims={'sub': 'new_user'})['run_id'], 'sample')
            self.assertEqual(main.get_run('owned', claims={'sub': 'user_a'})['run_id'], 'owned')
            with self.assertRaises(HTTPException) as caught:
                main.get_run('other', claims={'sub': 'user_a'})
            self.assertEqual(caught.exception.status_code, 404)

    def test_authenticated_run_cannot_be_read_by_another_account(self):
        settings = {
            'CLERK_ISSUER': 'https://test.clerk.accounts.dev',
            'CLERK_JWT_KEY': self.public_pem,
            'RISK_ATLAS_CORS_ORIGINS': 'http://localhost:5173',
        }
        with patch.dict(os.environ, settings), patch.object(main, 'PORTFOLIO', load_portfolio()), patch.object(main, 'STORE', {}), patch.object(main, 'save_run'), patch.object(main, 'append_run', return_value={}):
            client = TestClient(app)
            created = client.post('/api/runs', json={}, headers={'Authorization': f'Bearer {self.token()}'})
            self.assertEqual(created.status_code, 200)
            run_id = created.json()['run_id']
            own_response = client.get(f'/api/runs/{run_id}', headers={'Authorization': f'Bearer {self.token()}'})
            self.assertEqual(own_response.status_code, 200)
            other_token = self.token(sub='user_other')
            response = client.get(f'/api/runs/{run_id}', headers={'Authorization': f'Bearer {other_token}'})
            self.assertEqual(response.status_code, 404)


if __name__ == '__main__':
    unittest.main()
