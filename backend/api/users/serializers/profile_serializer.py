from rest_framework import serializers
from ..models import User


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture', 'preferred_language']
        read_only_fields = ['id', 'username']
    
    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.preferred_language = validated_data.get('preferred_language', instance.preferred_language)
        instance.save()
        return instance






class PublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'profile_picture']
        read_only_fields = ['username', 'first_name', 'last_name', 'profile_picture']