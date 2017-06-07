
onload = function (){

Vue.component('StatisticAllocationBox', {

	props: {
		character: Object,
		rules : Object,
	},

	template: `
		<div class="allocation-box">
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
			<span v-for="s_pk in rules.statistics_order" class="card label-bed-container">
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
		set_stat: function(s_pk, value){
			Vue.set(this.character.base_statistics, s_pk, value);
		},

		clear_value: function(value){
			//clears any base stat that has the value passed in
			for(var s_pk in this.character.base_statistics) {
				// skip loop if the property is from prototype
				if (!this.character.base_statistics.hasOwnProperty(s_pk))
					continue;
				if(this.character.base_statistics[s_pk] == value){
					Vue.delete(this.character.base_statistics, s_pk);
				}
			}

		},

		dragstart: function(){

			this.picked_up_node = event.target;
			this.clear_value(parseInt(this.picked_up_node.innerHTML));
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
			var stat_value = parseInt(this.picked_up_node.innerHTML);
			for(var i=event.target.classList.length ; --i >= 0;){
				if(event.target.classList[i] == "destination")
					break;
			}
			if(i >= 0){
				//if i is non-negative then we are dragging to a destination
				if(event.target.dataset.sPk){
					console.log('in',event.target.dataset.sPk);
					this.set_stat(
						event.target.dataset.sPk,
						stat_value
					);
				}else{

				}
				document.getElementById('stat_bed_'+event.target.dataset.sPk).value = 
					this.character.base_statistics[event.target.dataset.sPk];
				
			}else{
				//we dragged a number back to one of the starting points,
				//so update the character object to match
				this.clear_value(stat_value);
			}

			event.preventDefault();
			event.target.appendChild(this.picked_up_node);
		},
		drag: function(){
		}
	},

});

Vue.component('ClassSelector', {
	props: {
		cc_pk : Number,
		rules : Object,
		character : Object,
	},
	template: `
		<div class="card">
			<div class="card-block">
				<h4 class="card-title">{{rules.class_collections[cc_pk].name}}</h4>	
			
				<p>{{rules.class_collections[cc_pk].short_description}}</p>

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

				<p>
					{{description_text}}
				</p>
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

				<div v-if="has_effects">
					<h5>Effects</h5>
					<effects-view
						:rules="rules"
						:character="character"></effects-view>	
				</div>

			</div>
		
		</div>`,
	
	data: function () {
		return {
			selected_class_pk: -1,
		};
	},

	computed:{
		description_text: function(){
			console.log("this.selected_class_pk", this.selected_class_pk);
			if(this.selected_class_pk == -1)
				return "";
			else
				return rules.classes[this.selected_class_pk].description;
		},
		modifiers: function(){
			if(this.selected_class_pk == -1)
				return {};
			else
				return rules.classes[this.selected_class_pk].modifiers;
		},
		has_effects: function(){
			if(this.selected_class_pk == -1)
				return false;
			else
				return rules.classes[this.selected_class_pk].effects.length > 0;
		},
	},
	methods: {
		change_selection: function() {
			console.log("change!!!");
			//if there was a class amongst the character's classes that has the
			//same class collection, and delete them
			//id like to use the Array.filter function, but there is just too many
			//parameters to pass in to make it terse.
			for(var i=0; i<this.character.classes.length; i++){
				if(this.rules.classes[this.character.classes[i]].class_collection_pk ==
					this.cc_pk){
					this.character.classes.splice(i, 1);
					break;
				}
			}

			this.character.classes.push(this.selected_class_pk);
			console.log("this.character.classes",this.character.classes);
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


Vue.component('NewCharacterView', {
	props: {
		rules : Object,
		character: Object,
	},

	template: `
		<div>
			<h1>
				{{character.name}}
				<small>{{character.generated_description}}</small>
			</h1>

			<h2>Statistics</h2>
			<div class="row">
				<div class="col-md-2" v-for="s_pk in rules.statistics_order">

					<statistic-summary-card
							:s_pk="s_pk"
							:rules="rules"
							:character="character"></statistic-summary-card>
				</div>
			</div>

			<h2>Effects</h2>

			<div class="row">			
				<effects-view
					:rules="rules"
					:character="character"></effects-view>
			</div>
	
		</div>
	`,
	
	data: function () {
		return {
		};
	},

});

app = new Vue({
	el: '#app',

	methods: {
		submit: function(){
			$.post("/rpg/create_character/",
				{
					character: JSON.stringify(this.character),
					campaign_pk: campaign_pk,
					campaign_access_code: campaign_access_code,
					'csrfmiddlewaretoken': getCookie('csrftoken'),
				},
				function(response){
					window.location.href = "/rpg/session/"+response['c_pk'];
				},
			);
		},
	},

	data: {
		//these is a little bit of rules data we need to stash into our
		//app data, so we can loop over it.  for simplicity most data is
		//stored in the 'rules' library.
		character : character,
		rules : rules,
	},
});
}

