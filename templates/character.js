{
	pk: {{character.pk}},
	name: "{{character.name}}",
	generated_description: "{{character.generated_description}}",

	base_statistics: {
		{% for bs in character.base_statistics.statistic_modifiers.all %}
			{{bs.statistic.pk}} : {{bs.value}},
		{% endfor %}
	},

	derived_statistics: {
		{% for ds in character.derivedstatisticinstance_set.all %}
			{{ds.statistic.pk}} : {{ds.depleted_value}},
		{% endfor %}
	},

	effects: [
		{% for e in character.effects.all %}
			{{e.pk}},
		{% endfor %}
	],

	classes: [
		{% for c in character.classes.all %}
			{{c.pk}},
		{% endfor %}
	],

	currency_quantity: {
		{% for cq in character.inventory_set.currency_quantities.all %}
			{{cq.currency.pk}} : {{cq.count}},
		{% endfor %}
	},

	items: [
		{% for i in character.inventory_set.items.all %}
			{{i.pk}},
		{% endfor %}
	],

	equipped_items: {
		{% for i in character.characteritemslot_set.all %}
			{{i.item_slot.pk}}: 
				{% if i.item %}
					{{i.item.pk}},
				{% else %}
					false,
				{% endif %}
		{% endfor %}	
	}

}
