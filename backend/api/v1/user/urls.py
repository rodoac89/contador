from django.contrib import admin
from django.urls import path
from .apiviews import UserApiView

    

urlpatterns = [
    path('login/', UserApiView.as_view()),    
]
