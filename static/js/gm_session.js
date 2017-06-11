
//cache character changes so we can submit it batches
function reset_character_changes() {
	character_changes = {
		items_equipped: [],
		items_unequipped: [],
		derived_statistic: {},
	};
};

reset_character_changes();

function gm_submit_character_changes(character_pk){
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

	

Vue.component('DerivedStatisticGmControl', {
	props: {
		s_pk : Number,
		rules : Object,
		character: Object,
	},

	template: `
		<span v-if="rules.derived_statistics[s_pk].depleatable">
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
		</span>`,

	methods: {
		increment: function(){
			this.character.derived_statistics[this.s_pk]++;
			character_changes.derived_statistic[this.s_pk] = 
				this.character.derived_statistics[this.s_pk];
			gm_submit_character_changes(this.character.pk);
			//TODO implement a timer to wait a second before sending
		},

		decrement: function(){
			this.character.derived_statistics[this.s_pk]--;
			character_changes.derived_statistic[this.s_pk] = 
				this.character.derived_statistics[this.s_pk];
			gm_submit_character_changes(this.character.pk);
			//TODO implement a timer to wait a second before sending
		},
	},
})
