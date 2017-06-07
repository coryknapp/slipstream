rules = {};

rules.modifier_map = [
	03 , -3, //3 and under, map to -3
	05 , -2, // under 5, map to -2
	08 , -1,
	12 , 0,
	15 , 1,
	17 , 2,
	18 , 3,
]

rules.statistics = {
	{% for s in rule_set.statistic_set.all %}
		{{s.pk}}: {
			name: "{{s.name}}",
			description: "{{s.description}}",
		},
	{% endfor %}
}; //end statistic dict

rules.statistics_order = [
	{% for s in rule_set.statistic_set.all %}
		{{s.pk}},
	{% endfor %}
];

rules.derived_statistics = {
	{% for s in rule_set.derivedstatistic_set.all %}
		{{s.pk}}: {
			name: "{{s.name}}",
			description: "{{s.description}}",
			base_statistic:
				{% if s.base_statistic %}
					{{s.base_statistic.pk}}
				{% else %}
					false
				{% endif %},
			multiplier: {{s.multiplier}},
			depleatable: {{s.depleatable|yesno:"true,false"}},
			always_instantiated: {{s.always_instantiated|yesno:"true,false"}},
			secondary: {{s.secondary|yesno:"true,false"}},
		},
	{% endfor %}
}; //end statistic dict

rules.classes = {
	{% for c in rule_set.class_set.all %}
		{{c.pk}}: {
			name: "{{c.name}}",
			class_collection_pk: {{c.collection.pk}},
			description: "{{c.short_description}}",
			modifiers: {
				{% for s_mod in c.statistic_modifiers.get_all_modifiers %}
					{{s_mod.statistic_pk}} : {{s_mod.value}},
				{% endfor %}
				},
			effects: [
				{% for e in c.class_effects.all %}
					{{e.pk}},
				{% endfor %}
				],
			actions: [
				],

		},
	{% endfor %}
};

rules.effects = {
	{% for e in rule_set.effect_set.all %}
		{{e.pk}}: {
			name: "{{e.name}}",
			description: "{{e.description}}",
			icon_url: "{{e.icon_url}}",
			modifiers: {
				{% for s_mod in e.statistic_modifiers.get_all_modifiers %}
					s_mod.statistic.pk : s_mod.value,
				{% endfor %}
				},
			},
	{% endfor %}
};

rules.actions = {
	{% for a in rule_set.action_set.all %}
		{{a.pk}}: {
			name: "{{a.name}}",
			description: "{{a.description}}",
			icon_url: "{{a.icon_url}}",
			associated_statistic: {{a.associated_statistic.pk}},
		},
	{% endfor %}
};

rules.basic_actions = [
	{% for a in rule_set.basic_actions.all %}
		{{a.pk}},
	{% endfor %}
];

rules.currencies = {
	{% for c in currencies%}
		{{c.pk}}: {
			name: "{{c.name}}",
			icon_url: "{{c.icon_url}}",
		},
	{% endfor %}
};

rules.currency_order = [
	{% for c in currencies %}
		{{c.pk}},
	{% endfor %}
];

rules.items = {
	{% for i in rule_set.item_set.all %}
		{{i.pk}}: {
			name: "{{i.name}}",
			icon_url: "{{i.icon_url}}",			
			description: "{{i.description}}",
		}
	{% endfor %}
};

rules.slots = {
	{% for i in rule_set.itemslot_set.all %}
		{{i.pk}}: {
			name: "{{i.name}}"
		},
	{% endfor %}
}

rules.equipable_items = {
	{% for e in rule_set.equipableitem_set.all %}
		{{e.pk}}: {
			actions: [
				{% for a in e.actions.all %}
					{{a.pk}},
				{% endfor %}
			],
			slots: [
				{% for a in e.slots.all %}
					{{a.pk}},	
				{% endfor %}
			],
		}
	{% endfor %}
};
