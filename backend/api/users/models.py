from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    profile_picture = models.ImageField(
        upload_to='media/avatars/', 
        null=True, 
        blank=True
    )
    preferred_language = models.CharField(
        max_length=10, 
        default='en'
    )
    # For OAuth provider linking
    oauth_provider = models.CharField(max_length=50, null=True, blank=True)
    oauth_uid = models.CharField(max_length=255, null=True, blank=True)