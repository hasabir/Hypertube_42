
# from django.db import models
# from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
# from django.utils.translation import gettext_lazy as _

# class CustomUserManager(BaseUserManager):
#     def create_user(self, email, first_name, last_name, username, password=None):
#         if not email:
#             raise ValueError("Email is required")
#         user = self.model(
#             email=self.normalize_email(email),
#             first_name=first_name,
#             last_name=last_name,
#             username=username,
#         )
#         user.set_password(password)
#         user.save(using=self._db)
#         return user

#     def create_superuser(self, email, first_name, last_name, username, password=None):
#         user = self.create_user(email, first_name, last_name, username, password)
#         user.is_admin = True
#         user.is_staff = True
#         user.save(using=self._db)
#         return user

# class CustomUser(AbstractBaseUser):
#     email = models.EmailField(unique=True)
#     username = models.CharField(max_length=150, unique=True)
#     first_name = models.CharField(max_length=30)
#     last_name = models.CharField(max_length=30)
#     profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
#     preferred_language = models.CharField(max_length=10, default='en')
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)
#     is_admin = models.BooleanField(default=False)

#     USERNAME_FIELD = 'username'  # Can log in with this
#     REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

#     objects = CustomUserManager()

#     def __str__(self):
#         return self.username

#     def has_perm(self, perm, obj=None):
#         return True

#     def has_module_perms(self, app_label):
#         return True