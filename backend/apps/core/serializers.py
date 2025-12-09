from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Match, PlayerProfile


class UserDataSerializer(serializers.Serializer):
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    date_joined = serializers.DateTimeField()
    last_login = serializers.DateTimeField() 

    class Meta:
        model = User

class PlayerProfileSerializer(serializers.ModelSerializer):
    totalPoints = serializers.IntegerField(source='total_points')
    
    class Meta:
        model = PlayerProfile
        fields = ['name', 'totalPoints']

class MatchRecordSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source='match_id')
    updated_at = serializers.DateTimeField(source='match_date')
    playerScores = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = ['id', 'updated_at', 'playerScores']

    def get_playerScores(self, obj:Match):
        records = obj.matchrecord_set.select_related('player_obj').all()
        scores = {}
        for record in records:
            player_name = record.player_obj.name
            placement = record.placement if record.placement else 'none'
            scores[player_name] = {
                'kills': record.kills,
                'placement': placement
            }
        return scores

    

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = '__all__'
    