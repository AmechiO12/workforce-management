# backend/tests/test_home.py
import unittest
from app.app import create_app

class TestHomeRoutes(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_home_route(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn("Welcome", response.get_json()["message"])

    def test_health_route(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertIn("healthy", response.get_json()["status"])
