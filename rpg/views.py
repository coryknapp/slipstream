import string
import random
import json

from copy import deepcopy

from django.shortcuts import render

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.core.urlresolvers import reverse

from models import RuleSet
from models import Statistic
from models import StatisticInstance
from models import Character
from models import Campaign
from models import Class
from models import ClassCollection
from models import StatisticInstanceSet
from models import Effect
from models import Action
from models import InventorySet
from models import Currency
from models import CurrencyQuantity
from models import Item
from models import EquipableItem
from models import ItemSlot
from models import CharacterItemSlot
from models import DerivedStatistic
from models import DerivedStatisticInstance

def landing_page_view(request, access_code_error = False):
    context = {
            'user' : request.user,
            'access_code_error' : access_code_error
            } 
    if request.user.is_authenticated:
        context['campaign_list'] = Campaign.objects.filter(owning_user=request.user)
        context['character_list'] = Character.objects.filter(owning_user=request.user)


    return render(request, 'landing.html', context)

@login_required
def new_campaign_view(request):
    """
    Generate the page for creating a new campaign

    Directed from:
    home

    Directs to:
    create_campaign_and_redirect

    Request object:
    * requires a authenticated user    

    Associated html templates:
    'new_campaign.html'

    Side effects:
    None
    """

    context = {
            'rule_sets' : RuleSet.objects.all()
            }

    return render(request, 'new_campaign.html', context)

@login_required
def create_campaign_and_redirect(request):
    campaign_name = request.GET.get("campaign_name_field", None)
    rule_set_pk = request.GET.get("rule_set_field", None)

    #generate access code
    size = 8
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choice(chars) for _ in range(size))
        if Campaign.objects.filter(access_code = code).count() is 0:
            break

    new_campaign = Campaign(
            rule_set = RuleSet.objects.get(pk = rule_set_pk),
            name=campaign_name,
            owning_user=request.user,
            access_code = code
            )
    new_campaign.save()

    #redirect to the gm_session page
    return HttpResponseRedirect(reverse('gm_session', args=[new_campaign.pk]))

@login_required
def gm_session_view(request, campaign_pk):
    campaign = Campaign.objects.get(pk=campaign_pk)
    rule_set = campaign.rule_set

    characters = Character.objects.filter(campaign=campaign)

    context = {
        'campaign': campaign,
        'characters': characters,
        'rule_set': rule_set,
    }

    return render(request, 'gm_session.html', context)

@login_required
def session_view(request, character_pk):
    character = Character.objects.get(pk=character_pk)
    rule_set = character.campaign.rule_set

    context = {
        'rule_set': rule_set,
        'character': character,
    }

    return render(request, 'session.html', context)

@login_required
def modify_character(request):
    character_pk = int(request.POST.get('character_pk'))
    mods = json.loads(request.POST.get('mods'))

    items_equipped = mods['items_equipped']
    items_unequipped = mods['items_unequipped']

    for item_pk in items_unequipped:
        item = EquipableItem.objects.get(pk = item_pk)
        for slot in item.slots.all():
            cis = CharacterItemSlot.objects.get(
                    character_id = character_pk,
                    item_slot = slot)
            cis.item = None
            cis.save()


    for item_pk in items_equipped:
        #TODO respond with an error if we can equip this thing.
        item = EquipableItem.objects.get(pk = item_pk)
        for slot in item.slots.all():
            cis = CharacterItemSlot.objects.get(
                    character_id = character_pk,
                    item_slot = slot)
            cis.item = item
            cis.save()

    return JsonResponse({})

@login_required
def new_character_view(request):
    """
    Display the form for character creation.

    Directed from:
    home, user_profile_view, create_character (with message about
    why the create failed)

    Directs to:
    create_character,

    Request object:
    * requires a authenticated user
    * for create_character_and_redirect, a message explaining the failure in 
        the session with the key '_fail_message'

    Associated html templates:
    new_character.html, to which we pass a race list and a stat list.
        Additionally, this template makes requests to some JSON generating
        views: get_race_info_json, validate_campaign_access_code_json,
        and a yet to be written get_gear_info_json.

    Side effects:
    None
    """

    try:
        access_code = request.GET.get("access_code_field", None)
        campaign = Campaign.objects.get(access_code=access_code)
        rule_set = campaign.rule_set
    except Campaign.DoesNotExist:
        return landing_page_view(request, True)
    class_collections = []
    for cc in ClassCollection.objects.filter(
            rule_set=rule_set
            ).order_by('selection_order'):
        class_collections.append({
            'class_collection' : cc,
            'classes' : Class.objects.filter(collection = cc)
            })

    stat_list = Statistic.objects.filter(
            rule_set=rule_set
            ).order_by('selection_order')
    
    #effects TODO only send out effects that are to be used (as in effects that
    #part of a race or class)
    effects_list = Effect.objects.filter(rule_set=rule_set)
    

    context = {
        'rule_set' : rule_set,
        'stat_list': stat_list,
        'effects_list' : effects_list,
        'class_collections': class_collections,
        'class_collections_size': len(class_collections),        
        'campaign': campaign,
    }

    return render(request, 'new_character.html', context)

@login_required
def create_character(request):
    """
    
    Directed from:
    new_character_view

    Directs to:
    campaign_player_view,

    Request object:
    * requires a authenticated user
    * TODO a whole bunch of stuff

    Associated html templates:
    None (should redirect)
    
    Side effects:
    If everything is valid, create a new character object
    """

    character_submission = json.loads(request.POST.get('character'))
    
    #character_json_

    #get the campaign TODO validate that this user should be able to
    #join this campaign
    campaign_pk = int(request.POST.get('campaign_pk', None))
    campaign_access_code = request.POST.get('campaign_access_code')

    #get the campaign with this pk and access code.  We don't have to worry about
    #not finding it, because if that's the case, the user is doing something 
    #they're not supposed to be doing
    campaign = Campaign.objects.get(pk=campaign_pk, access_code=campaign_access_code)
    rule_set = campaign.rule_set

    #don't bother validating because, again, the if the name is missing then the
    #user is mucking around where they don't belong.  This should have been validated
    #on the front end.
    character_name = character_submission['name']

    #create the character 
    new_character = Character(
            owning_user=request.user,
            name=character_name,
            campaign=campaign)
    new_character.save()

    #set up a new StatisticInstanceSet for this chars base stats
    new_stat_set = StatisticInstanceSet()
    new_stat_set.save()
    for s_pk, value in character_submission['base_statistics'].items():
        new_stat_set.set_modifier(Statistic.objects.get(pk=s_pk), value);
    new_character.base_statistics = new_stat_set

    #set up a new DerivedStatisticInstance for every always_instantiated
    #DerivedStatistic
    for ds in DerivedStatistic.objects.filter(rule_set=rule_set, always_instantiated=True):
        dsi = DerivedStatisticInstance(
                character=new_character,
                statistic=ds)
        if dsi.statistic.depleatable:
            dsi.depleted_value = dsi.value()
        dsi.save()

    #add the classes to the character, and build the generated description
    generated_description = ""
    for c_pk in character_submission['classes']:
        class_object = Class.objects.get(pk=c_pk)
        generated_description += class_object.name + " "
        new_character.classes.add(class_object)
    new_character.generated_description = generated_description;
    #new_character.save()

    #put everything in the rules' defult inventory set into the characters
    #inventory
    #TODO we actually need to make a deeper copy XXX BUG
    if rule_set.default_inventory_set:
        new_character.inventory_set = rule_set.default_inventory_set.deep_copy()
    new_character.save()

    #add the slots
    for c in new_character.classes.all():
        print('char ', c)
        print('slots ', c.slots.all())
        for s in c.slots.all():
            new_character_item_slot = CharacterItemSlot(
                character = new_character,
                item_slot = s)
            new_character_item_slot.save()
            print('making them new slots!!!!')

    #success condition!!!
    return JsonResponse({
        'c_pk': new_character.pk
        })



def populate(request):

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
    
    

    return HttpResponse("success, I guess.")
