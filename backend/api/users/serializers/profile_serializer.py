from rest_framework import serializers
from ..models import User


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture', 'preferred_language']
        read_only_fields = ['id', 'username']
