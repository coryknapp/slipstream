from django.contrib import admin

from models import RuleSet
from models import Statistic
from models import Character
from models import Campaign
from models import Class
from models import ClassCollection


# Register your models here.
admin.site.register(RuleSet)
admin.site.register(Statistic)
admin.site.register(Character)
admin.site.register(Campaign)
admin.site.register(Class)
admin.site.register(ClassCollection)

