
//cache character changes so we can submit it batches
function gm_reset_character_changes() {
	gm_character_changes = {};
	var keys = Object.getOwnPropertyNames(characters);
	for(var i = 0; i < keys.length; i++){
		gm_character_changes[keys[i]] = {
			items_equipped: [],
			items_unequipped: [],
			derived_statistic: {},
		};
	}
};

gm_reset_character_changes();

function gm_submit_character_changes(character_pk){
	$.post("/rpg/gm_modify_characters/",
		{
			payload: JSON.stringify(gm_character_changes),
		   	'csrfmiddlewaretoken': getCookie('csrftoken'),
		},
		function(response){
			gm_reset_character_changes();
		},
	);
};

	

Vue.component('DerivedStatisticGmControl', {
	props: {
		s_pk : Number,
		rules : Object,
		character: Object,
	},

	template: `
		<div v-if="rules.derived_statistics[s_pk].depleatable">
			<button type="button"
				class="btn btn-secondary btn-sm"
				@click="increment">
				+
			</button>
	
			<button type="button"
				class="btn btn-secondary btn-sm"
				@click="decrement">	
				-
			</button>
		</div>`,

	methods: {
		increment: function(){
			this.character.derived_statistics[this.s_pk]++;
			gm_character_changes[this.character.pk].derived_statistic[this.s_pk] = 
				this.character.derived_statistics[this.s_pk];
			gm_submit_character_changes();
			//TODO implement a timer to wait a second before sending
		},

		decrement: function(){
			this.character.derived_statistics[this.s_pk]--;
			gm_character_changes[this.character.pk].derived_statistic[this.s_pk] = 
				this.character.derived_statistics[this.s_pk];
			gm_submit_character_changes();
			//TODO implement a timer to wait a second before sending
		},
	},
})
