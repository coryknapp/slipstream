from django.contrib import admin

from models import RuleSet
from models import Statistic
from models import Character
from models import Campaign
from models import Effect
from models import Class
from models import Currency
from models import CurrencyQuantity
from models import InventorySet
from models import ClassCollection


# Register your models here.
admin.site.register(RuleSet)
admin.site.register(Statistic)
admin.site.register(Character)
admin.site.register(Campaign)
admin.site.register(Class)
admin.site.register(ClassCollection)
admin.site.register(Effect)
admin.site.register(InventorySet)
admin.site.register(Currency)
admin.site.register(CurrencyQuantity)
