from rest_framework import serializers
from django.contrib.auth.models import User


class UserDataSerializer(serializers.Serializer):
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    date_joined = serializers.DateTimeField()
    last_login = serializers.DateTimeField() 

    class Meta:
        model = User

class PlayerProfileSerializer(serializers.Serializer):
    class Meta:
        model = 'PlayerProfile'
        fields = '__all__'

class MatchRecordSerializer(serializers.Serializer):
    class Meta:
        model = 'MatchRecord'
        fields = '__all__'

class MatchSerializer(serializers.Serializer):
    class Meta:
        model = 'Match'
        fields = '__all__'
    