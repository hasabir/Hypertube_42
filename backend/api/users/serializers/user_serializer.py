from rest_framework import serializers
from ..models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth import get_user_model
from django.contrib.sites.shortcuts import get_object_or_404, get_current_site
from django.urls import reverse
from django.conf import settings
from ..utils import Utils



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_picture', 'preferred_language']
        read_only_fields = ['id']


class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    class Meta:
        fields = ['email']
    
    def validate(self, attrs):
        email = attrs['email']
        user = User.objects.filter(email=email).first()
        if not user:
            raise serializers.ValidationError("No user is associated with this email address.")

        request = self.context['request']
        uid64 = urlsafe_base64_encode(force_bytes(user.id))
        token = PasswordResetTokenGenerator().make_token(user)
        current_site = get_current_site(request).domain
        relative_link = reverse('password-reset-confirm', kwargs={'uidb64': uid64, 'token': token})
        absurl = f"http://{current_site}{relative_link}"
        email_body = (
            f"Hello,\n\nYou requested a password reset. "
            f"Please click the link below to reset your password:\n{absurl}\n\n"
            f"If you did not request this, please ignore this email.\n\nThank you."
        )
        Utils.send_email({
            'email_subject': 'Password Reset Request',
            'email_body': email_body,
            'to_email': user.email,
        })
        return attrs
    

