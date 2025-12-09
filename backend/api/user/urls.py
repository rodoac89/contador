from django.contrib import admin
from django.urls import path
from .apiviews import LoginAPIView, LogoutAPIView, UserDataAPIView

    

urlpatterns = [
    path('login/', LoginAPIView.as_view()), 
    path('logout/', LogoutAPIView.as_view()),
    path('data/', UserDataAPIView.as_view())   

]
