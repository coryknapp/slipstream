
onload = function (){

Vue.component('StatisticAllocationBox', {
	created: function(){
		this.allocations = {};
	},

	props: {
		rules : Object,
	},

	template: `
		<div>
		<div>
			<span v-for="d in rules.allocatable_stat_values">
				<span
					class="bed"
					@drop="drop"
					@drag="drag"
					@dragover="allowDrop">
					<span
						class="draggables"
						draggable="true"
						@dragstart="dragstart"
						@drop="drop"
						@drag="drag"
						@dragover="allowDrop">
						{{d}}
					</span>
				</span>
			</span>
		</div>
		<div>
			<span v-for="s_pk in rules.statistics_order" class="label-bed-container">
				<span
					class="bed destination"
					@drop="drop"
					@drag="drag"
					@dragover="allowDrop"
					:data-s-pk="s_pk">
				</span>
				<br>
				<span class="label-bed-label">
					{{rules.statistics[s_pk].name}}
				</span>

				<input type="hidden"
					:name="'stat_bed_'+s_pk"
					:id="'stat_bed_'+s_pk"
					value="doop">
				

			</span>
		</div>
		</div>
	`,

	data: function(){
		return {
			// maps pk to allocated value
			// allocations: {}, //<-- does not require reactivity
		}
	},
	
	methods: {
		dragstart: function(){
			//is this draggable in labeled bed already?
			var this_bed = event.target.parentNode;

			if(this_bed.dataset.sPk){ //yes
				delete this.allocations[parseInt(this_bed.dataset.sPk)];
			}
		},
		
		allowDrop: function(){
			//in this case, the event target is 
			var target = event.target;
			
			//does the target node have the `bed` class?
			for(var i=target.classList.length ; --i >= 0;){
				if(target.classList[i] == "bed")
					break;
			}
			if(i >= -0 && event.target.childNodes.length == 0)
				event.preventDefault();	
		},
		drop: function(){
			//does the target node have the `destination` class?
			for(var i=event.target.classList.length ; --i >= 0;){
				if(event.target.classList[i] == "destination")
					break;
			}
			if(i >= 0){
				this.allocations[event.target.dataset.sPk] =
					parseInt(this.picked_up_node.innerHTML);
				document.getElementById('stat_bed_'+event.target.dataset.sPk).value = 
					this.allocations[event.target.dataset.sPk];
				console.log(document.getElementById('stat_bed_'+event.target.dataset.sPk));
				
			} else {
				//if it's not a `destination` we need to remove the pk from
				//our allocations map, as the value is no longer allocated
				//delete this.allocations[event.target.dataset.sPk];
				//console.log(Vue.delete);
				//Vue.delete(this.allocations, event.target.dataset.sPk);
				console.log(event.target.dataset.sPk);
			}


			event.preventDefault();
			event.target.appendChild(this.picked_up_node);
			this.$emit(
				'allocations_changed',
				this.allocations
			);
		},
		drag: function(){
			this.picked_up_node = event.target;
		}
	},

});


Vue.component('statistics-summary-table', {

	props: {
		modifiers : Object,
		rules: Object,
	},


	template: `
	<div class="container">
		<div class="row" v-for="s_pk in rules.statistics_order">
			<hr>
			<div class="col-md-1 h1">
				<span class="h4">{{rules.statistics[s_pk].name}}</span>
	
				{{sum_for_stat(s_pk)}}
			</div>
			<div class="col-md-1 h1">
				{{mod_for_stat_value(sum_for_stat(s_pk))}}
			</div>
			<span class="h4">{{rules.statistics[s_pk].name}}</span>
			<p>{{rules.statistics[s_pk].description}}</p>

			<span v-if="mod.value > 0" v-for="mod in stat_to_modifier_dict[s_pk]">
				{{mod.value}} from
				<em>{{rules.classes[mod.c_pk].name}}
				{{rules.class_collections[mod.cc_pk].name}}</em>	
				
				
			</span>
		</div>
	</div>`,

	data: function(){
		return {
			stat_to_modifier_dict: {
				//stat_pk as pk : [
					//{
					//	cc_pk : Number
					//  c_pk : Number
					//  value : Number
				//},
			}, //populated by the modifiers_changed

			allocations: {}, //populated by allocations_changed
		}
	},
	
	methods: {
		sum_for_stat: function(s_pk){
			var sum = 0;
			if(this.stat_to_modifier_dict[s_pk]){
				for(var i = 0; i < this.stat_to_modifier_dict[s_pk].length; i++){
					sum += this.stat_to_modifier_dict[s_pk][i].value;
				}
			}
			if(this.allocations[s_pk]){
				sum+=this.allocations[s_pk];
			}
			return sum;
		},
		
		mod_for_stat_value: function(value){
			if(value < 4 ){
			   return -3;
			} else if(value < 6){
				return -2;
			} else if(value < 9){
				return	-1;
			} else if(value < 13){
				return 0;
			} else if( value < 16){
				return 1;
			} else if( value < 18){
				return 2;
			}
			return 3;
		},

		modifiers_changed:
			function(selected_class_collection, selected_class_pk, modifier){	

			//remove any modifiers already associated with another class in 
			for(var s_pk in this.stat_to_modifier_dict) {
 				if (this.stat_to_modifier_dict.hasOwnProperty(s_pk)) {
					for(var i = 0; i < this.stat_to_modifier_dict[s_pk].length; i++) {
						if(this.stat_to_modifier_dict[s_pk][i].cc_pk ==
							selected_class_collection){
								//remove the stat from the list
								this.stat_to_modifier_dict[s_pk].splice(i,1);
							break;
  						}
					}
    				
  				}
			}

			//add each modifier to our mod list
			for(var s_pk in modifier) {
 				if (modifier.hasOwnProperty(s_pk)) {
					//if it doesn't exist yet, add an empty list
					if(this.stat_to_modifier_dict[s_pk] == undefined)
						this.stat_to_modifier_dict[s_pk] = [];
					//add the mod to our active mods
					this.stat_to_modifier_dict[s_pk].push( {
						cc_pk : selected_class_collection,
						c_pk : selected_class_pk,
						value: modifier[s_pk]
					});

  				}
			}
			
			this.$forceUpdate();
		},

		allocations_changed: function(allocations){
			this.allocations = allocations;
			this.$forceUpdate();			
		}
	},
});

Vue.component('class-selector', {
	props: {
		cc_pk : Number,
		rules : Object,
	},
	template: `
		<div class="well">
			<h4>{{rules.class_collections[cc_pk].name}}</h4>	
			
			<p>{{rules.class_collections[cc_pk].short_description}}</p>
			
			<label for="some_name" class="hidden">
				{{rules.class_collections[cc_pk].name}}
			</label>

			<select size="5"
				class="form-control"
				v-model="selected_class_pk"
				v-on:change="change_selection"
				:name="'class_collection_'+cc_pk"
				:id="'class_collection_'+cc_pk">
				<option
					v-for="c in this.rules.class_collections[cc_pk].classes" 
					:value="c">
					{{rules.classes[c].name}}
				</option>
			</select>

			<div class="row">
				<div class="col-mod-4 little-padding">
					{{description_text}}
				</div>
			</div>
			<div v-if="selected_class_pk != -1 && Object.keys(modifiers).length > 0">
				<h5>Statistic Modifiers</h5>
				<div class="row justify-content-around">
					<span
						v-for="(value, s_pk) in modifiers"
						class="col-mod-4" > 
						<class-selector-statistic-box
							:s_pk="s_pk"
							:value="value"
							:rules="rules"></class-selector-statistic-box>
					</span>
				</div>
			</div>

			<div v-if="selected_class_pk != -1 && effects.length > 0">
				<h5>Effects</h5>
				<div class="row justify-content-around">
					<span
						v-for="e_pk in effects"
						class="col-mod-4" > 
						<class-selector-effects-box
							:e_pk="e_pk"
							:rules="rules"></class-selector-effects-box>
					</span>
				</div>
			</div>


		
		</div>`,
	
	data: function () {
		return {
			selected_class_pk: -1,
			description_text: "",
			modifiers: [],
			effects: [],
		};
	},

	methods: {
		change_selection: function() {
			this.description_text =
				this.rules.classes[this.selected_class_pk].description;
			this.modifiers = this.rules.classes[this.selected_class_pk].modifiers;
			this.effects = this.rules.classes[this.selected_class_pk].class_effects;
			//TODO we probably only need this if there are any stats associated 
			//with this class, and only if it changes
			this.$emit(
				'modifiers_changed',
				this.cc_pk,
				this.selected_class_pk,
			   	this.modifiers
			);
		},
	}

});

Vue.component('class-selector-statistic-box', {
	props: {
		s_pk : String, //TODO why is this a string?!!?
		value: Number,
		rules : Object,
	},

	template: `
		<span class="stat-and-label-box small">
			{{rules.statistics[s_pk].name}}:
			<span v-bind:class="value >= 0 ? 'pos-stat' : 'neg-stat'"> 
				{{value > 0 ? '+' : ''}}
				{{value}}
			</span>
		</span>`,
	
	data: function () {
		return {
		};
	},

});

Vue.component('class-selector-effects-box', {
	props: {
		e_pk : Number,
		rules : Object,
	},

	template: `
		<span class="class-selector-effects-box small">
			<h5>{{rules.effects[e_pk].name}}</h5>
			{{rules.effects[e_pk].description}}
			<img class="effect-icon" :src="'/static/images/'+rules.effects[e_pk].icon_url">
		</span>`,
	
	data: function () {
		return {
		};
	},

});

app = new Vue({
	el: '#app',

	methods: {
		modifiers_changed: function(selected_class_collection, selected_class_pk, modifiers) {
			this.$refs.statisticsSummaryTable.modifiers_changed(
				selected_class_collection, selected_class_pk, modifiers
			);
		},
		allocations_changed: function(allocations){
			this.$refs.statisticsSummaryTable.allocations_changed(
				allocations,
			);
		}
	},

	data: {
		//these is a little bit of rules data we need to stash into our
		//app data, so we can loop over it.  for simplicity most data is
		//stored in the 'rules' library.
		rules : rules,
	},
});
}

