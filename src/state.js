import Freezer from 'freezer-js';

const State = new Freezer({
	ui: { 
		status: "ready"
	},
	resource: null,
	profiles: null
});

export default State;
