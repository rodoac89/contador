import uuid
from django.db import models

class PlayerProfile(models.Model):
    player_name = models.CharField(max_length=100, unique=True)
    email = models.EmailField()
    join_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.player_name

class MatchRecord(models.Model):
    player_obj = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE)
    match_obj = models.ForeignKey('Match', on_delete=models.CASCADE)
    points_earned = models.IntegerField()
    date_of_match = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.match_id
    
class Match(models.Model):
    match_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    match_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.match_id)[-6:]