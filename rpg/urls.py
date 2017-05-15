"""slipstream URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url

from . import views

urlpatterns = [
    #pages
    url(r'^new_campaign/$', views.new_campaign_view, name='new_campaign'),
    url(r'^new_character/$',
        views.new_character_view,
        name='new_character'),

    url(r'^gm_session/(?P<campaign_pk>[0-9]+)/$',
        views.gm_session_view,
        name='gm_session'),

    url(r'^session/(?P<character_pk>[0-9]+)/$',
        views.session_view,
        name='session'),

    #???
    url(r'^create_campaign_and_redirect/$',
        views.create_campaign_and_redirect,
        name='create_campaign_and_redirect'),

    url(r'^create_character/$',
        views.create_character,
        name='create_character'),


    #for debugging
    url(r'^pop/$', views.populate, name='pop'),
    
]
