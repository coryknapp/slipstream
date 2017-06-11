//shim Object.values
Object.values = Object.values || (obj => Object.keys(obj).map(key => obj[key]));

//cache character changes so we can submit it batches
function reset_character_changes() {
	character_changes = {
		items_equipped: [],
		items_unequipped: [],
	};
}
reset_character_changes();

function submit_character_changes(){
	console.log("character.pk", character.pk);
	$.post("/rpg/modify_character/",
		{
			character_pk: character.pk,
			mods: JSON.stringify(character_changes),
		   	'csrfmiddlewaretoken': getCookie('csrftoken'),
		},
		function(response){
			reset_character_changes();
		},
	);
};

function equip_item(i_pk){
	//call unequip so that the proper triggers happen.
	//only need to check for one slot, because unequip_item will figure out what to do
	if(rules.equipable_items[i_pk].slots[0]){
		unequip_item(i_pk);
	}
	for(var i=0; i<rules.equipable_items[i_pk].slots.length; i++){
		character.equipped_items[
			rules.equipable_items[i_pk].slots[i]
		] = i_pk;
	}
	character_changes.items_equipped.push(i_pk);
};

function unequip_item(i_pk){
	for(var i=0; i<rules.equipable_items[i_pk].slots.length; i++){
		character.equipped_items[
			rules.equipable_items[i_pk].slots[i]
		] = false;
	}
	character_changes.items_unequipped.push(i_pk);
};

/*
 * card_with_model_template
 * a lot of these templates have largely the same format so this function
 * generates those templates with a few paramters
 */

function card_with_model_template(
	card_html, // the template html for the card
	model_title, //header of the popup
	model_body, //body of the popup, can be a string or array someday TODO
	){
	//each card/model pair needs to have a unique id for internal use.
	if(typeof unique_global_counter === 'undefined'){
		unique_global_counter = 0;
	}
	unique_global_counter++;
	
	if(typeof model_body === 'string') 
		var final_model_body = '<div class="modal-body">'+model_body+'</div>';
	else{ //hopefully type of is a array
		var final_model_body = '';
		for(var i=0; i<model_body.length; i++){
			final_model_body += '<div class="modal-body">'+model_body[i]+'</div>';
		}
	}

	return `
		<div class="card">
			<a :id="'_`+unique_global_counter+`_model_trigger'"
				data-toggle="modal"
				:data-target="'#_`+unique_global_counter+`_model'">
				`+card_html+`
			</a>
			<div
				class="modal fade"
				:id="'_`+unique_global_counter+`_model'"
				tabindex="-1"
				role="dialog"
				aria-labelledby="exampleModalLabel"
				aria-hidden="true">
				<div class="modal-dialog" role="document">
					<div class="modal-content">
						<div class="modal-header">
							<h3 class="modal-title" id="exampleModalLabel">
								`+model_title+`
							</h3>
						</div>
						<div class="modal-body">
							`+final_model_body+`
						</div>
					</div>
				</div>

			</div>

		</div>`;
	
}


/*
 * Structure of the CharacterView
 *
 *	CharacterView
 *		StatisticSummaryCards
 *		DerivedStatisticSummaryCards
 *		EffectsView
 *			EffectSummaryCards
 *		ActionsView
 *			ActionSummaryCards
 */

Vue.component('CharacterView', {
	props: {
		rules : Object,
		character: Object,
	},

	template: `
		<div class="card"><div class="card-block">
			<h1 class="card-title">
				{{character.name}}
				<small class="text-muted">{{character.generated_description}}</small>
			</h1>


			<h2>Statistics</h2>
			<div class="row">
				<div
					class="col-md-2"
					v-for="(value, s_pk) in character.derived_statistics">

					<derived-statistic-summary-card
							:s_pk="Number(s_pk)"
							:rules="rules"
							:character="character"></derived-statistic-summary-card>
				</div>
			</div>
			<div class="row">
				<div class="col-md-2" v-for="s_pk in rules.statistics_order">

					<statistic-summary-card
							:s_pk="s_pk"
							:rules="rules"
							:character="character"></statistic-summary-card>
				</div>
			</div>


			<h2>Effects</h2>
			<effects-view
				:rules="rules"
				:character="character"></effects-view>


			<h2>Actions</h2>
			<actions-view
				:rules="rules"
				:character="character"></actions-view>


			<h2>Inventory</h2>
			<inventory-view	
				:rules="rules"
				:character="character"></inventory-view>
		</div></div>
	`,
	
	data: function () {
		return {
		};
	},

});

Vue.component('EffectsView', {
	props: {
		rules : Object,
		character: Object,
	},

	template: `
		<div>
			<div class v-for="e_pk in effects_pk_list">
				<effect-summary-card
					:e_pk="e_pk"
					:rules="rules"></effect-summary-card>
			</div>
		</div>
`,
	computed: {
		effects_pk_list: function(){
			var list = [].concat(this.character.effects);
			for(var i = 0; i < this.character.classes.length; i++){
				list = list.concat(
					this.rules.classes[this.character.classes[i]].effects
				);
			}
			return list;
		}
	},

	data: function () {
		return {
		};
	},

});

Vue.component('EffectSummaryCard', {
	props: {
		e_pk : Number,
		rules : Object,
	},

	template: card_with_model_template(
				`<img
					:src="'/static/images/'+rules.effects[e_pk].icon_url"
					class="effects-icon">`,
				`{{rules.effects[e_pk].name}}`,
				`{{rules.effects[e_pk].description}}`
		),
});

Vue.component('ActionsView', {
	props: {
		rules : Object,
		character: Object,
	},

	template: `
		<div>
			<div class v-for="a_pk in actions_pk_list">
				<action-summary-card
					:a_pk="a_pk"
					:rules="rules"></action-summary-card>
			</div>
		</div>
`,
	computed: {
		actions_pk_list: function(){
			var list = [].concat(this.rules.basic_actions);
			for(var i = 0; i < this.character.classes.length; i++){
				list = list.concat(
					this.rules.classes[this.character.classes[i]].actions
				);
			}
			return list;
		}
	},

	data: function () {
		return {
		};
	},

});
Vue.component('ActionSummaryCard', {
	props: {
		a_pk : Number,
		rules : Object,
	},

	template: card_with_model_template(
		`<img
			:src="'/static/images/'+rules.actions[a_pk].icon_url"
			class="actions-icon">`,
		`{{rules.actions[a_pk].name}}`,
		`{{rules.actions[a_pk].description}}`,
	),
});


Vue.component('InventoryView', {
	props: {
		rules : Object,
		character: Object,
	},

	template: `
		<div>
			<div class v-for="c_pk in rules.currency_order">
				<div v-if="character.currency_quantity[c_pk]">
					<currency-summary-card
						:c_pk="c_pk"
						:rules="rules"
						:character="character"></currency-summary-card>
				</div>
			</div>
			<div class v-for="i_pk in character.items">
				<item-summary-card
					:i_pk="i_pk"
					:rules="rules"
					:character="character"></item-summary-card>
			</div>
		</div>
`,

	data: function () {
		return {
		};
	},

});

Vue.component('CurrencySummaryCard', {
	props: {
		c_pk : Number,
		rules : Object,
		character: Object,		
	},

	template: card_with_model_template(
				`<img
					:src="'/static/images/'+rules.currencies[c_pk].icon_url"
					class="currencies-icon">
				X {{character.currency_quantity[c_pk]}}`,
				`<img
					:src="'/static/images/'+rules.currencies[c_pk].icon_url"
					class="currencies-icon">
				{{rules.currencies[c_pk].name}}`,
				`{{rules.currencies[c_pk].description}}`
	),
	
	data: function () {
		return {
		};
	},

});

Vue.component('ItemSummaryCard', {
	props: {
		i_pk : Number,
		rules : Object,
		character: Object,		
	},

	methods: {
		unequip_item: function(){
			console.log("UN");
			unequip_item(this.i_pk);
			submit_character_changes();
		},

		equip_item: function(){
			equip_item(this.i_pk);
			submit_character_changes();
		},
	},

	computed: {
		equipable: function(){
			return this.rules.equipable_items[this.i_pk] != undefined;
		},

		equipped: function(){
			var slot_pk = this.rules.equipable_items[this.i_pk].slots[0];
			return this.character.equipped_items[slot_pk] != false;
		},

		icon_css_class: function(){
			if(this.equipable){
				if(this.equipped){
					return "items-equipped-icon";
				}
				return "items-unequipped-icon";
			} else {
				return "items-icon";
			}
		},

		icon_url: function(){
			return '/static/images/' + this.rules.items[this.i_pk].icon_url;
		}
	},

	template: card_with_model_template(
				`<img
					:src="icon_url"
					:class="icon_css_class" />`,
				`<img
					:src="icon_url"
					class="items-icon" />
				{{rules.items[i_pk].name}}
				<div v-if="equipable">
					<div v-if="equipped" class="text-primary">
						equipped
					</div>
					<div v-else class="text-warning">
						unequipped
					</div>
				</div>`,
				[
					`{{rules.items[i_pk].description}}`,
					`<div v-if="equipable">
						in slots... <br />
						<div
							v-for="s_pk in rules.equipable_items[i_pk].slots">
							{{rules.slots[s_pk].name}}
							(occupied by
							{{ character.equipped_items[s_pk] ?
							rules.items[character.equipped_items[s_pk]].name:
							 "nothing"}})
						</div>
						<button
							v-if="equipped"
							class="btn btn-primary"
							@click="unequip_item">
								unequip
						</button>
						<button
							v-else
							class="btn btn-primary"
							@click="equip_item">
							equip
						</button>
					</div>`,
				]
	),
});


Vue.component('StatisticSummaryCard', {

	props: {
		s_pk : Number,
		rules : Object,
		character: Object,
	},

	methods: {
		signed_number: function(value){
			if(value < 0){
				return value;
			}
			return "+"+value;
		},
	},

	computed: {
		modified_stat : function(){
			if(this.character.base_statistics[this.s_pk]){
				var sum = this.character.base_statistics[this.s_pk];
				for(var i = 0; i < this.character.classes.length; i++){
					var c_pk = this.character.classes[i];
					if(this.rules.classes[c_pk].modifiers[this.s_pk])
						sum += this.rules.classes[c_pk].modifiers[this.s_pk];
				}
				return sum;
			}
			return null;
		},

		modifier: function(){
			var modified_stat = this.modified_stat;
			if(modified_stat == null)
				return null;			
			for(var i = 0; i < this.rules.modifier_map.length; i++){
				if(modified_stat <= this.rules.modifier_map[i++]){
					return this.signed_number(this.rules.modifier_map[i]);
				}
			}
			return this.signed_number(this.rules.modifier_map[--i]);
		},

	},

	template: `
		<a :id="'stat_'+s_pk+'_model_trigger'"
			data-toggle="modal"
			:data-target="'#stat_'+s_pk+'_model'">

			<div class="card">
				<h3 class="h5">{{rules.statistics[s_pk].name}}</h3>
				{{modified_stat}}
				{{modifier}}
			</div>

			<div
				class="modal fade"
				:id="'stat_'+s_pk+'_model'"
				tabindex="-1"
				role="dialog"
				aria-hidden="true">
				<div class="modal-dialog" role="document">
					<div class="modal-content">
						<div class="modal-header">
							<h3 class="modal-title">
								{{rules.statistics[s_pk].name}} {{modified_stat}} {{modifier}}
							</h3>
						</div>
						<div class="modal-body">
							{{rules.statistics[s_pk].description}}
							<hr>
							Base: {{character.base_statistics[s_pk]}} <br/>
							<span v-for="c_pk in character.classes">
								<span
									v-if="rules.classes[c_pk].modifiers[s_pk]">
									{{signed_number(rules.classes[c_pk].modifiers[s_pk])}}
									from
									{{rules.classes[c_pk].name}}
									{{rules.classes[c_pk].class_collections_name}}
								</span>
							</span>
						</div>

					</div>
				</div>

			</div>


		</a>
`,
	
	data: function () {
		return {
		};
	},

});

Vue.component('DerivedStatisticSummaryCard', {

	props: {
		s_pk : Number,
		rules : Object,
		character: Object,
	},

	created(){
		console.log("this.s_pk", typeof this.s_pk);
	},

	template: `
	<div>
		{{ rules.derived_statistics[s_pk].name }}: 
		{{ value_text }}

	</div>
	`,
	
	computed:{

		value_text: function(){
			// the value you text depends on if the stat is depleatable
			// for depleatable stats: depleted_value / max_value
			// otherwise: max_value
			if(this.rules.derived_statistics[this.s_pk].depleatable){
				return this.character.derived_statistics[this.s_pk] + "/" +
					this.max_value;
			}
			return this.max_value;
		},

		max_value: function(){
			var base_pk = this.rules.derived_statistics[this.s_pk].base_statistic;
			if(base_pk){
				return this.character.base_statistics[base_pk] *
					this.rules.derived_statistics[this.s_pk].multiplier;
			}
			else return 0;
		},

		base_statistic: function(){
			return this.rules.statistics[this.rules.derived_statistics[this.s_pk]];
		},
	}
});
