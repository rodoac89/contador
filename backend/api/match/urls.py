from django.contrib import admin
from django.urls import path
from .apiviews import MatchRecordView, MatchView

urlpatterns = [
    path('records/', MatchRecordView.as_view()),
    path('all/', MatchView.as_view()),
    path('create', MatchView.as_view()),    
]