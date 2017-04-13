import string
import random

from django.shortcuts import render

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect
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

# Create your views here.
def landing_page_view(request, access_code_error = False):
    context = {
            'user' : request.user,
            'access_code_error' : access_code_error
            } 
    if request.user.is_authenticated:
        context['campaign_list'] = Campaign.objects.filter(owning_user=request.user)

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
    context = {
        'campaign': campaign,
        #'class_list': class_list,
    }

    return render(request, 'gm_session.html', context)

@login_required
def new_character_view(request):
    """
    Display the form for character creation.

    Directed from:
    home, user_profile_view, create_character_and_redirect (with message about
    why the create failed)

    Directs to:
    create_character_and_redirect,

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
    print(context) 

    return render(request, 'new_character.html', context)

def populate(request):

    RuleSet.objects.all().delete()
    Statistic.objects.all().delete()
    StatisticInstance.objects.all().delete()
    Character.objects.all().delete()
    Campaign.objects.all().delete()
    Class.objects.all().delete()
    ClassCollection.objects.all().delete()

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

    #Effects
    zoltran_radiation_immunity_effect = Effect(
            rule_set = beta_rule_set,            
            name = 'radiation immunity',
            description = 'The Zoltran people are immune to the effects of radiation poisoning.',
            icon_url = 'zoltran_radiation.png')
    zoltran_radiation_immunity_effect.save()

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
    
    #Classes
    conartist_class = Class(
        rule_set = beta_rule_set,
        collection = class_cc,
        name = 'Con artist',
        short_description = 'The master of the grift.',)
    conartist_class.statistic_modifiers = StatisticInstanceSet()

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
    return HttpResponse("success, I guess.")
