from django.urls import path
from . import views

urlpatterns = [
    path('api/branches/create/', views.create_branch, name='create_branch'),
    path('api/branches/verify/', views.verify_branch, name='verify_branch'),
    path('api/branches/', views.list_branches, name='list_branches'),
]
