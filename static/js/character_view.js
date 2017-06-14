//shim Object.values
Object.values = Object.values || (obj => Object.keys(obj).map(key => obj[key]));

//cache character changes so we can submit it batches
function reset_character_changes() {
	character_changes = {
		items_equipped: [],
		items_unequipped: [],
		derived_statistic: {}
	};
}
reset_character_changes();

function submit_character_changes(character_pk){
	$.post("/rpg/modify_character/",
		{
			character_pk: character_pk,
			mods: JSON.stringify(character_changes),
		   	'csrfmiddlewaretoken': getCookie('csrftoken'),
		},
		function(response){
			reset_character_changes();
		},
	);
};

function equip_item(i_pk, character_pk){
	console.log("character_pk", character_pk);
	//call unequip so that the proper triggers happen.
	//only need to check for one slot, because unequip_item will figure out what to do
	if(rules.equipable_items[i_pk].slots[0]){
		unequip_item(i_pk, character_pk);
	}
	for(var i=0; i<rules.equipable_items[i_pk].slots.length; i++){
		characters[character_pk].equipped_items[
			rules.equipable_items[i_pk].slots[i]
		] = i_pk;
	}
	character_changes.items_equipped.push(i_pk);
};

function unequip_item(i_pk, character_pk){
	console.log("character_pk", character_pk);
	for(var i=0; i<rules.equipable_items[i_pk].slots.length; i++){
		characters[character_pk].equipped_items[
			rules.equipable_items[i_pk].slots[i]
		] = false;
	}
	character_changes.items_unequipped.push(i_pk);
};

card_with_model_template = '<div></div>'

Vue.component('StandardIconCardWithModel', {
	props: {
		unique_id : String,
		icon_image_name : String,
		icon_css_class: {
			type: String,
			required: false,
		},
		model_title : {
			type: String,
			required: false,
		},
		model_body : {
			type: String,
			required: false,
		}
	},
	
	template: `
		<div class="card">
			<a :id="unique_id + '_model_trigger'"
				data-toggle="modal"
				:data-target="'#' + unique_id + '_model'">
				<img
					:src="'/static/images/' + icon_image_name"
					:class="icon_css_class ? icon_css_class : 'effects-icon'">
			</a>
			<div
				class="modal fade"
				:id="unique_id + '_model'"
				tabindex="-1"
				role="dialog"
				aria-labelledby="exampleModalLabel"
				aria-hidden="true">
				<div class="modal-dialog" role="document">
					<div class="modal-content">
						<div class="modal-header">
							<h3 class="modal-title" id="exampleModalLabel">
								{{model_title}}
							</h3>
						</div>
						<div v-if="model_body" class="modal-body">
							{{ model_body }}
						</div>
						<div v-else class="modal-body">
							<slot></slot>
						</div>

					</div>
				</div>

			</div>

		</div>`,
});


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
					:rules="rules"
					:character_pk="character.pk"></effect-summary-card>
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
		character_pk: Number,
		rules : Object,
	},

	computed: {
		unique_id: function() {
			return `c`+this.character_pk+`e`+this.e_pk;
		},
		icon_image_name: function() {
			return `<img
						:src="'/static/images/'images`+
						this.rules.effects[e_pk].icon_url`"
						class="effects-icon">`;
		},
		title: function() {
			return this.rules.effects[e_pk].name;
		},
		description: function() {
			return this.rules.effects[e_pk].description;
		},
	},

	template: `<standard-icon-card-with-model
					:unique_id="unique_id"
					:icon_image_name="icon_image_name"
					:model_title="title"
					:model_body="description" ></standard-icon-card-with-model>`,
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
					:rules="rules"
					:character_pk="character.pk"></action-summary-card>
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
		character_pk: Number,		
		rules : Object,
	},
	
	computed: {
		unique_id: function() {
			return `c`+this.character_pk+`a`+this.a_pk;
		},
		icon_image_name: function() {
			return this.rules.actions[this.a_pk].icon_url;
		},
		title: function() {
			return this.rules.actions[this.a_pk].name;
		},
		description: function() {
			return this.rules.actions[this.a_pk].description;
		},
	},

	template: `<standard-icon-card-with-model
					:unique_id="unique_id"
					:icon_image_name="icon_image_name"
					:model_title="title"
					:model_body="description" ></standard-icon-card-with-model>`,
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

	computed: {
		unique_id: function() {
			return `c`+this.character_pk+`a`+this.e_pk;
		},
		card_html: function() {
			return `<img
					:src="/static/images/`+this.rules.currencies[c_pk].icon_url+`"
					class="currencies-icon">
				X`+this.character.currency_quantity[c_pk];
		},
		model_title: function() {
			return this.rules.currencies[c_pk].name;
		},
		model_body: function() {
			return this.rules.currencies[c_pk].description;
		},
	},

	template: card_with_model_template,

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
			console.log("this.character", this.character);
			console.log("this.character.pk", this.character.pk);
			unequip_item(this.i_pk, this.character.pk);
			submit_character_changes(this.character.pk);
		},

		equip_item: function(){
			console.log("this.character", this.character);
			console.log("this.character.pk", this.character.pk);
			equip_item(this.i_pk, this.character.pk);
			submit_character_changes(this.character.pk);
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

		icon_image_name: function(){
			return this.rules.items[this.i_pk].icon_url;
		},

		unique_id: function() {
			return `c`+this.character.pk+`i`+this.i_pk;
		},

		title: function() {
			return this.rules.items[this.i_pk].name;
		},

	},

	template: `
	<standard-icon-card-with-model
		:unique_id="unique_id"
		:icon_image_name="icon_image_name"
		:icon_css_class="icon_css_class"
		:model_title="title" >
		<div v-if="equipable">
			in slots... <br />
			<div
				v-for="s_pk in rules.equipable_items[i_pk].slots">
				{{rules.slots[s_pk].name}}
				(occupied by
				{{ character.equipped_items[this.s_pk] ?
				rules.items[
					character.equipped_items[this.s_pk]
				].name : "nothing" }}
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
		</div>
	</standard-icon-card-with-model>`,
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
		<derived-statistic-gm-control
			:s_pk="s_pk"
			:rules="rules"
			:character="character"></derived-statistic-gm-control>
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
