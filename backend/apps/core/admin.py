from django.contrib import admin

from apps.core.models import PlayerProfile, MatchRecord, Match

admin.site.register(PlayerProfile)
admin.site.register(MatchRecord)
admin.site.register(Match)


