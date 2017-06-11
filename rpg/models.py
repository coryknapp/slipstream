from __future__ import unicode_literals

from django.core import serializers
from django.db import models
from django.contrib.auth.models import User

import json

#define a couple properties we reuse again and again
MAX_DESCRIPTION_LENGTH = 800
MAX_NAME_LENGTH = 100

class RuleSet(models.Model):
    name = models.CharField(
            max_length=MAX_NAME_LENGTH
            )

    """These are actions that every character starts with"""
    basic_actions = models.ManyToManyField('Action');

    default_inventory_set = models.ForeignKey('InventorySet', null=True)

    def equipableitem_set(self):
        """
        work around for getting the _set of a subclass.  Perhaps there is a better way
        """
        return EquipableItem.objects.filter(rule_set = self)

    def __unicode__(self):
        return 'RuleSet: {}'.format(self.name)

class Statistic(models.Model):
    """
    A statistic that a character has (think strength, charisma, dexterity)
    """

    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)

    name = models.CharField(max_length=MAX_NAME_LENGTH)       
    description = models.CharField( max_length=MAX_DESCRIPTION_LENGTH)
    selection_order = models.IntegerField()

    class Meta:
        ordering = ['selection_order']

    def __unicode__(self):    
        return 'Statistic: {}'.format(self.name)

class StatisticInstance(models.Model):
    statistic = models.ForeignKey('Statistic', on_delete=models.CASCADE)
    value = models.IntegerField(default=0)
    def __unicode__(self):    
        return '%+d %s ' % (self.value, self.statistic.name)


class StatisticInstanceSet(models.Model):
    """
    a set of statistics instances.  For example a set of the stat modifiers
    bestowed on a player by a class or effect.
    """
    statistic_modifiers = models.ManyToManyField('StatisticInstance')    
    derived_statistic_modifiers = models.ManyToManyField('DerivedStatistic')    

    def set_modifier(self, stat_object, value):
        #try to get the stat out of our list (it may or may not exist)
        try:
            stat_instance = self.statistic_modifiers.get(statistic=stat_object)
            stat_instance.value = value
            stat_instance.save()
        except StatisticInstance.DoesNotExist:
            self.statistic_modifiers.create(statistic=stat_object, value=value)

    def get_modifier(self, stat_object):
        #try to get the stat out of our list (it may or may not exist)
        try:
            stat_instance = self.statistic_modifiers.get(statistic=stat_object)
            return stat_instance.value
        except StatisticInstance.DoesNotExist:
            return 0

    @property 
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
    def __unicode__(self):    
        sm_text = ""
        for sm in self.statistic_modifiers.all():
            sm_text += str(sm)
        return sm_text

class DerivedStatistic(models.Model):
    """
    A statistic that depends on another (think hit points, armour)
    """
    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)
    name = models.CharField(max_length=MAX_NAME_LENGTH)       
    description = models.CharField( max_length=MAX_DESCRIPTION_LENGTH)
    selection_order = models.IntegerField()

    base_statistic = models.ForeignKey(
            'Statistic',
            on_delete=models.CASCADE,
            null=True)
    multiplier = models.DecimalField(max_digits=5, decimal_places=2, default=1)

    #unfortunately a lot of the logic here is implemented by a bunch of
    #flags that control how the front end handles display
    
    depleatable = models.BooleanField(default=False)
    always_instantiated = models.BooleanField(default=False)

    # secondary stats are displayed differently.  They are grouped onto
    # another page, and only show the modifiers, not the stat itself
    secondary = models.BooleanField(default=False)
    

    class Meta:
        ordering = ['selection_order']

class DerivedStatisticInstance(models.Model):
    character = models.ForeignKey('Character', on_delete=models.CASCADE)
    statistic = models.ForeignKey('DerivedStatistic', on_delete=models.CASCADE)
    depleted_value = models.IntegerField(default=0)

    def value(self):
        if self.statistic.base_statistic:
            return 0
        max_value = self.character.statistics.get_modifier(statistic.base_statistic).value
            #statistic.multiplier;

class Character(models.Model):
    owning_user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=MAX_NAME_LENGTH)
    campaign = models.ForeignKey('Campaign', on_delete=models.CASCADE)

    base_statistics = models.ForeignKey(
            'StatisticInstanceSet',
            null=True,
            on_delete=models.CASCADE)    
    classes = models.ManyToManyField('Class')

    #this field should be generated on character creation.  It should be
    #a short phrase based on the it's classes.  Simpler and cheaper to
    #generate it once instead of every time. 
    generated_description = models.CharField(max_length=MAX_DESCRIPTION_LENGTH)

    inventory_set = models.ForeignKey(
            'InventorySet',
            null=True,
            on_delete=models.CASCADE)

    def __unicode__(self):    
        return '%s the %s ' % (self.name, self.generated_description)

    def json_representation(self):
        return {
                'name': self.name,
                'generated_description': self.generated_description,
                'base_statistics' : self.base_statistics.get_all_modifiers(),
                }

class Campaign(models.Model):

    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)

    name = models.CharField(
            max_length=MAX_NAME_LENGTH
            )
    access_code = models.CharField(max_length=8)
    owning_user = models.ForeignKey(User, on_delete=models.CASCADE)

    active_session = models.BooleanField(default=False)

    world_time = models.IntegerField(default=0)
    def __unicode__(self):    
        return '%s' % (self.name)

class Class(models.Model):
    """
    What might be thought of as a race or class in traditional rpgs. Dwarf, Mage
    Wizard, Kilingon, Scientist.
    """

    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)
    collection = models.ForeignKey('ClassCollection', on_delete=models.CASCADE)
    
    name = models.CharField(max_length=MAX_NAME_LENGTH)
    short_description = models.CharField(max_length=MAX_DESCRIPTION_LENGTH)

    statistic_modifiers = models.ForeignKey('StatisticInstanceSet', null=True, on_delete=models.CASCADE)    

    slots = models.ManyToManyField('ItemSlot')
    
    class_effects = models.ManyToManyField('Effect')
    def __unicode__(self):    
        return '%s' % (self.name)

class ClassCollection(models.Model):
    """
    A collection of classes. Wizard, Fighter, Mage would be a ClassCollection.
    Dwarf, Elf, Human might be a ClassCollection.
    """
    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)

    name = models.CharField(max_length=MAX_NAME_LENGTH)
    short_description = models.CharField(max_length=MAX_DESCRIPTION_LENGTH)
    selection_order = models.IntegerField(default=0)
    def __unicode__(self):    
        return '%s' % (self.name)

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
    def __unicode__(self):    
        return '%s' % (self.name)

class Action(models.Model):
    """
    Something a character can do, like lockpick, stab, or cast magic missile.
    """
    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)

    name = models.CharField(max_length=MAX_NAME_LENGTH)
    description = models.CharField(max_length=MAX_DESCRIPTION_LENGTH)

    #TODO store icon data in a database blob, rather then a url
    icon_url = models.CharField(max_length=MAX_NAME_LENGTH)

    associated_statistic = models.ForeignKey('Statistic', null=True)    
    def __unicode__(self):    
        return '%s' % (self.name)

class InventorySet(models.Model):
    currency_quantities = models.ManyToManyField('CurrencyQuantity')
    items = models.ManyToManyField('Item')

    def deep_copy(self):
        print('deep copy InventorySet')
        """return a deep copy of this inventory set.  The copy is already saved
        at return time.
        """
        copy = InventorySet.objects.get(pk=self.pk)
        copy.pk = None
        copy.save()
        #copy the currency quantities
        for cq in self.currency_quantities.all():
            cq_copy = cq
            cq_copy.pk = None
            cq_copy.save()
            copy.currency_quantities.add(cq_copy)
        copy.save()

        #copy the items
        for i in self.items.all():
            copy.items.add(i)
        copy.save()


        return copy

class Currency(models.Model):
    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)
    name = models.CharField(max_length=MAX_NAME_LENGTH)
    icon_url = models.URLField()
    selection_order = models.IntegerField(default=True)
    def __unicode__(self):    
        return '%s' % (self.name)

class CurrencyQuantity(models.Model):
    currency = models.ForeignKey('Currency')
    count = models.IntegerField(default=0)
    def __unicode__(self):    
        return '%s %s' % (self.count, self.currency)


class Item(models.Model):
    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)

    name = models.CharField(max_length=MAX_NAME_LENGTH)
    description = models.CharField(max_length=MAX_DESCRIPTION_LENGTH)
    icon_url = models.URLField()

class EquipableItem(Item):

    slots = models.ManyToManyField('ItemSlot')
    
    actions = models.ManyToManyField('Action');

class ItemSlot(models.Model):
    """
    item slots describe 
    """
    rule_set = models.ForeignKey('RuleSet', on_delete=models.CASCADE)
    name = models.CharField(max_length=MAX_NAME_LENGTH)
    def __unicode__(self):
        return '%s (pk=%s)' % (self.name, self.pk)

class CharacterItemSlot(models.Model):
    """
    links an item slot to a class.
    contains information about where to draw the slot on a picture
    of the character.
    It was extremely difficult to come up with a name for this class.
    """
    character = models.ForeignKey('Character', on_delete=models.CASCADE)
    item_slot = models.ForeignKey('ItemSlot', on_delete=models.CASCADE)
    item = models.ForeignKey('Item', null=True, on_delete=models.CASCADE)
