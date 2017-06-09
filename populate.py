from rpg.models import RuleSet
from rpg.models import Statistic
from rpg.models import StatisticInstance
from rpg.models import Character
from rpg.models import Campaign
from rpg.models import Class
from rpg.models import ClassCollection
from rpg.models import StatisticInstanceSet
from rpg.models import Effect
from rpg.models import Action
from rpg.models import InventorySet
from rpg.models import Currency
from rpg.models import CurrencyQuantity
from rpg.models import Item
from rpg.models import EquipableItem
from rpg.models import ItemSlot
from rpg.models import CharacterItemSlot
from rpg.models import DerivedStatistic
from rpg.models import DerivedStatisticInstance

RuleSet.objects.all().delete()
# Statistic.objects.all().delete()
# StatisticInstance.objects.all().delete()
# DerivedStatistic.objects.all().delete()
# Character.objects.all().delete()
# Campaign.objects.all().delete()
# Effect.objects.all().delete()
# Action.objects.all().delete()
# Class.objects.all().delete()
# ClassCollection.objects.all().delete()
# Currency.objects.all().delete()
# InventorySet.objects.all().delete()
# CurrencyQuantity.objects.all().delete()
# EquipableItem.objects.all().delete()
# Item.objects.all().delete()

beta_rule_set = RuleSet(name = 'Slipstream BETA')
beta_rule_set.save()

#stats
guts_stat = Statistic(
        rule_set = beta_rule_set,
        name = 'Guts',
        description = 'Does your character have guts?  A higher guts stat indicates a braver and bolder character, while a more timid character have lower number ',
        selection_order = 1)
guts_stat.save()

gusto_stat = Statistic(
        rule_set = beta_rule_set,
        name = 'Gusto',
        description = "Is your character quick to act?  A character with higher gusto get's to jump into action sooner then more hesitant characters.",
        selection_order = 2)
gusto_stat.save()

gumption_stat = Statistic(
        rule_set = beta_rule_set,
        name = 'Gumptioun',
        description = "How resourceful is your character?",
        selection_order = 3)
gumption_stat.save()

guile_stat = Statistic(
        rule_set = beta_rule_set,
        name = 'Gumptioun',
        description = "Is your character good at making friends and influencing people",
        selection_order = 4)
guile_stat.save()

#derived stats
hit_points_stat = DerivedStatistic(
        rule_set = beta_rule_set,
        name = 'hit points',
        description = '',
        selection_order = 1,
        base_statistic = guts_stat,
        multiplier = 2,
        depleatable = True,
        always_instantiated = True,
        secondary = False)
hit_points_stat.save()
        
armor_class_stat = DerivedStatistic(
        rule_set = beta_rule_set,
        name = 'armor class',
        description = '',
        selection_order = 2,
        base_statistic = None,
        depleatable = False,
        always_instantiated = True,
        secondary = False)       
armor_class_stat.save()
        
#Effects
zoltran_radiation_immunity_effect = Effect(
        rule_set = beta_rule_set,            
        name = 'radiation immunity',
        description = 'The Zoltran people are immune to the effects of radiation poisoning.',
        icon_url = 'zoltran_radiation.png')
zoltran_radiation_immunity_effect.save()



#ItemSlots
dominant_hand_slot = ItemSlot(
        rule_set = beta_rule_set,
        name = 'dominant hand')
dominant_hand_slot.save()

nondominant_hand_slot = ItemSlot(
        rule_set = beta_rule_set,
        name = 'nondominant hand')
nondominant_hand_slot.save()

feet_slot = ItemSlot(
        rule_set = beta_rule_set,
        name = 'feet')
feet_slot.save()

torso_slot = ItemSlot(
        rule_set = beta_rule_set,
        name = 'torso')
torso_slot.save()

head_slot = ItemSlot(
        rule_set = beta_rule_set,
        name = 'head')
head_slot.save()

#ClassCollection

race_cc = ClassCollection(
        rule_set = beta_rule_set,
        name = 'Race',
        short_description = "The universe if filled with all kinds of freaky aliens! Or you could be a boring human being.",
        selection_order = 1)
race_cc.save()

class_cc = ClassCollection(
    rule_set = beta_rule_set,
    name = 'Class',
    short_description = "What's your specialty?",
    selection_order = 2)
class_cc.save()

#races
p10p10p10p10 = StatisticInstanceSet()
p10p10p10p10.save()    
p10p10p10p10.set_modifier(guts_stat, 10)
p10p10p10p10.set_modifier(gusto_stat, 10)
p10p10p10p10.set_modifier(gumption_stat, 10)
p10p10p10p10.set_modifier(guile_stat, 10)
p10p10p10p10.save()

human_race = Class(
    rule_set = beta_rule_set,
    collection = race_cc,
    name = 'Human',
    short_description = 'Just a boring old human being.',
    statistic_modifiers = p10p10p10p10)
human_race.save()

human_race.slots.add(dominant_hand_slot)
human_race.slots.add(nondominant_hand_slot)
human_race.slots.add(feet_slot)
human_race.slots.add(torso_slot)
human_race.slots.add(head_slot)

p20p20p0p0 = StatisticInstanceSet()
p20p20p0p0.save()    
p20p20p0p0.set_modifier(guts_stat, 20)
p20p20p0p0.set_modifier(gusto_stat, 20)
p20p20p0p0.save()

mantis_race = Class(
    rule_set = beta_rule_set,
    collection = race_cc,
    name = 'Mantis',
    short_description = 'Large, insect-like creatures. Often quick to anger, and then violence.  Good at close quarters combat.',
    statistic_modifiers = p20p20p0p0)
mantis_race.save()

mantis_race.slots.add(nondominant_hand_slot)
mantis_race.slots.add(nondominant_hand_slot)
mantis_race.slots.add(torso_slot)
mantis_race.slots.add(head_slot)

p10p10p20p0 = StatisticInstanceSet()
p10p10p20p0.save()    
p10p10p20p0.set_modifier(guts_stat, 10)
p10p10p20p0.set_modifier(gusto_stat, 10)
p10p10p20p0.set_modifier(gumption_stat, 20)
p10p10p20p0.save()


zoltran_race = Class(
    rule_set = beta_rule_set,
    collection = race_cc,
    name = 'Zoltran',
    short_description = 'Featureless humanoids that emit a bright green light.  They are immune to radiation poisoning, and can produce electrical current',)

zoltran_race.save()
zoltran_race.class_effects.add(zoltran_radiation_immunity_effect);

zoltran_race.slots.add(dominant_hand_slot)
zoltran_race.slots.add(dominant_hand_slot)
zoltran_race.slots.add(feet_slot)
zoltran_race.slots.add(torso_slot)
zoltran_race.slots.add(head_slot)

#Classes
conartist_class = Class(
    rule_set = beta_rule_set,
    collection = class_cc,
    name = 'Con artist',
    short_description = 'The master of the grift.',)
conartist_class.save()

magistrate_class = Class(
    rule_set = beta_rule_set,
    collection = class_cc,
    name = 'Magistrate',
    short_description = "You're an official government officer, acting on official  government business. Or are you?",)
magistrate_class.save()

bountyhunter_class = Class(
    rule_set = beta_rule_set,
    collection = class_cc,
    name = 'Bounty Hunter',
    short_description = "You scour space looking for your big payday.",)
bountyhunter_class.save();

galactic_credits_currency = Currency(
    rule_set = beta_rule_set,
    name = 'Galactic Credits',
    icon_url = 'galactic_credits.png',
    selection_order = 1)
galactic_credits_currency.save()

federation_script_currency = Currency(
    rule_set = beta_rule_set,
    name = 'Federation Script',
    icon_url = 'galactic_credits.png',
    selection_order = 1)
federation_script_currency.save()

default_inventory_set = InventorySet()
default_inventory_set.save()

two_hundred_galactic_credits = CurrencyQuantity(
    currency = galactic_credits_currency,
    count = 200)
two_hundred_galactic_credits.save()
default_inventory_set.currency_quantities.add(two_hundred_galactic_credits)

#actions
laser_pistol_shoot_action = Action(
    rule_set = beta_rule_set,
    name = 'Shoot',
    icon_url = 'laser_pistol.png',
    description = "Shoot your laser pistol at a target.",       
    associated_statistic = guts_stat)
laser_pistol_shoot_action.save()

laser_pistol = EquipableItem(
    rule_set = beta_rule_set,
    name = "laser pistol",
    description = "standard issue federation laser pistol",
    icon_url = 'laser_pistol.png',)
laser_pistol.save()
laser_pistol.actions.add(laser_pistol_shoot_action)
laser_pistol.slots.add(dominant_hand_slot)
default_inventory_set.items.add(laser_pistol)

default_inventory_set.save()

beta_rule_set.default_inventory_set = default_inventory_set
beta_rule_set.save()

#actions
punch_action = Action(
    rule_set = beta_rule_set,
    name = 'Punch',
    icon_url = 'punch.png',
    description = "Punch a guy in the face",       
    associated_statistic = guts_stat)
punch_action.save()
beta_rule_set.basic_actions.add(punch_action)
beta_rule_set.save()



print("success, I guess.")
