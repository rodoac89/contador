from urllib import request
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from .models import PlayerProfile, Match, MatchRecord
from .serializers import UserDataSerializer


def auth_profile(request, username, password):

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        serializer = UserDataSerializer(user)
        return serializer.data
    else:
        return None 
    
def get_player(player_name):
    try:
        player = PlayerProfile.objects.get(player_name=player_name)
        return player
    except PlayerProfile.DoesNotExist:
        return None
    
def get_all_players():
    return PlayerProfile.objects.all()
    

def add_player(player_name):
    player = PlayerProfile(player_name=player_name)
    player.save()
    return player

def get_match_by_id(match_id):
    try:
        match = Match.objects.get(id=match_id)
        return match
    except Match.DoesNotExist:
        return None

def get_all_matches():
    return Match.objects.all()  