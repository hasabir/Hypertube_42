from rest_framework import serializers
from ..models import User


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for GET /users - returns id and username only"""
    class Meta:
        model = User
        fields = ['id', 'username']
        read_only_fields = ['id', 'username']


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for GET /users/:id - returns username, email, profile picture URL"""
    profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile_picture']
        read_only_fields = ['id', 'username', 'email', 'profile_picture']
    
    def get_profile_picture(self, obj):
        """Return the URL of the profile picture if it exists"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for PATCH /users/:id - allows updating username, email, password, profile picture"""
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'profile_picture']
        read_only_fields = ['id']
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        # Update fields
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        
        if 'profile_picture' in validated_data:
            instance.profile_picture = validated_data['profile_picture']
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance
    
    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value
    
    def validate_username(self, value):
        user = self.context['request'].user
        if User.objects.filter(username=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("This username is already in use.")
        return value


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture', 'preferred_language', 'email']
        read_only_fields = ['id']
    
    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.username = validated_data.get('username', instance.username)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.preferred_language = validated_data.get('preferred_language', instance.preferred_language)
        instance.save()
        return instance
    
    def validate(self, attrs):
        return super().validate(attrs)
    
    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value
    
    def validate_username(self, value):
        user = self.context['request'].user
        if User.objects.filter(username=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("This username is already in use.")
        return value




class PublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'profile_picture']
        read_only_fields = ['username', 'first_name', 'last_name', 'profile_picture']