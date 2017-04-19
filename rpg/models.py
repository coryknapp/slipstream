from __future__ import unicode_literals

from django.core import serializers
from django.db import models
from django.contrib.auth.models import User

import json

#define a couple properties we reuse again and again
MAX_DESCRIPTION_LENGTH = 800
MAX_NAME_LENGTH = 100

def HasStatisticModifier(class_object):
    """
    class decorator for models that are associated with a rule_set
    """
    class_object.statistic_modifiers = models.ManyToManyField('StatisticInstance')

    return class_object

class RuleSet(models.Model):
    name = models.CharField(
            max_length=MAX_NAME_LENGTH
            )

class Statistic(models.Model):
    """
    A statistic that a character has (think strength, charisma, dexterity)
    """

    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)

    name = models.CharField(max_length=MAX_NAME_LENGTH)       
    description = models.CharField( max_length=MAX_DESCRIPTION_LENGTH)    
    selection_order = models.IntegerField()

class StatisticInstance(models.Model):
    statistic = models.ForeignKey('Statistic', on_delete=models.CASCADE)
    value = models.IntegerField(default=0)

class StatisticInstanceSet(models.Model):
    """
    a set of statistics instances.  For example a set of the stat modifiers
    bestowed on a player by a class or effect.
    """
    statistic_modifiers = models.ManyToManyField(StatisticInstance)    

    def set_modifier(self, stat_object, value):
        #try to get the stat out of our list (it may or may not exist)
        try:
            stat_instance = self.statistic_modifiers.get(statistic=stat_object)
            stat_instance.value = value
            stat_instance.save()
        except StatisticInstance.DoesNotExist:
            print('CREATING STAT')
            self.statistic_modifiers.create(statistic=stat_object, value=value)

    def get_modifier(self, stat_object):
        #try to get the stat out of our list (it may or may not exist)
        try:
            stat_instance = self.statistic_modifiers.get(statistic=stat_object)
            return stat_instance.value
        except StatisticInstance.DoesNotExist:
            return 0

    def get_all_modifiers(self):
        """
        get a json representation off all stat instances associated with this
        class, so we can dump it into a template
        """
        sm_list = []
        for sm in self.statistic_modifiers.all():
            sm_list.append({
                'statistic_pk' : sm.statistic.pk,
                'value' : sm.value
                })
        return sm_list

class Character(models.Model):
    owning_user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=MAX_NAME_LENGTH)
    campaign = models.ForeignKey('Campaign', on_delete=models.CASCADE)

    base_statistics = models.ForeignKey('StatisticInstanceSet', null=True)    
    classes = models.ManyToManyField('Class')

    #this field should be generated on character creation.  It should be
    #a short phrase based on the it's classes.  Simpler and cheaper to
    #generate it once instead of every time. 
    generated_description = models.CharField(max_length=MAX_DESCRIPTION_LENGTH)

class Campaign(models.Model):

    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)

    name = models.CharField(
            max_length=MAX_NAME_LENGTH
            )
    access_code = models.CharField(max_length=8)
    owning_user = models.ForeignKey(User, on_delete=models.CASCADE)

    active_session = models.BooleanField(default=False)

    world_time = models.IntegerField(default=0)

class Class(models.Model):
    """
    What might be thought of as a race or class in traditional rpgs. Dwarf, Mage
    Wizard, Kilingon, Scientist.
    """

    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)
    collection = models.ForeignKey('ClassCollection', on_delete=models.CASCADE)
    
    name = models.CharField(max_length=MAX_NAME_LENGTH)
    short_description = models.CharField(max_length=MAX_DESCRIPTION_LENGTH)

    statistic_modifiers = models.ForeignKey('StatisticInstanceSet', null=True)    

    class_effects = models.ManyToManyField('Effect')

class ClassCollection(models.Model):
    """
    A collection of classes. Wizard, Fighter, Mage would be a ClassCollection.
    Dwarf, Elf, Human might be a ClassCollection.
    """
    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)

    name = models.CharField(max_length=MAX_NAME_LENGTH)
    short_description = models.CharField(max_length=MAX_DESCRIPTION_LENGTH)
    selection_order = models.IntegerField(default=0)

class Effect(models.Model):
    """
    Some mojo that a character has on them.  For example: Poisoned, Crippled,
    Immune to radiation, etc...
    """
    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)

    name = models.CharField(max_length=MAX_NAME_LENGTH)
    description = models.CharField(max_length=MAX_DESCRIPTION_LENGTH)

    #TODO store icon data in a database blob, rather then a url
    icon_url = models.CharField(max_length=MAX_NAME_LENGTH)

    statistic_modifiers = models.ForeignKey('StatisticInstanceSet', null=True)    

