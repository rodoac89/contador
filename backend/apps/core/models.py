import uuid
from django.db import models

class PlayerProfile(models.Model):
    name = models.CharField(max_length=100, unique=True, primary_key=True)
    total_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class MatchRecord(models.Model):
    player_obj = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE)
    match_obj = models.ForeignKey('Match', on_delete=models.CASCADE)
    placement = models.CharField(max_length=6, choices=[('winner', 'Winner'), ('second', 'Second')], default=None)
    kills = models.IntegerField(default=0)
    date_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - winner: {self.placement} - player: {self.player_obj.name} - match: {self.match_obj.match_id}"
    
class Match(models.Model):
    match_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    match_date = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.match_id)[-6:]