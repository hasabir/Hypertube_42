from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthFlowTests(APITestCase):
    def test_register_creates_user(self):
        response = self.client.post(
            reverse('register'),
            {
                'username': 'alice',
                'email': 'alice@example.com',
                'password': 'StrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['username'], 'alice')
        self.assertNotIn('password', response.data)
        self.assertTrue(User.objects.filter(username='alice').exists())

    def test_login_returns_jwt_tokens(self):
        User.objects.create_user(
            username='bob',
            email='bob@example.com',
            password='StrongPass123!',
        )

        response = self.client.post(
            reverse('token_obtain_pair'),
            {
                'username': 'bob',
                'password': 'StrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
