import { Resource } from 'fhir/r4';
import Freezer from 'freezer-js';
import { SageNodeInitialized, SimplifiedProfiles, SimplifiedValuesets } from './helpers/schema-utils';

export interface StateVars {
	ui: {
		status: SageUiStatus,
		openMode?: string,
		replaceId?: number,
		count?: number,
		update?: {from: string, to: string}[],
		selectedNode?: SageNodeInitialized,
	},
	VSACEndpoint: string,
	UMLSKey: string,
	CPGName: string,
	authorName: string,
	canonicalUris: {uri: string, resourceType: string}[],
	showHiddenElements: boolean,
	resource?: SageNodeInitialized,
	bundle?: {
		pos: number
		resources: Resource[],
	},
	profiles: SimplifiedProfiles,
	valuesets: SimplifiedValuesets,
}

export type SageUiStatus = 'ready' | 'contained' | 'open' | 'validation_error' | 'resource_load_error' | 'ref_warning' | 'codePicker' | 'change_profile';

const defaultState: StateVars = {
	ui: { 
		status: "ready",
	},
	VSACEndpoint: "https://cts.nlm.nih.gov/fhir/r4",
	UMLSKey: "",
	CPGName: "",
	authorName: "",
	canonicalUris: [], // URIs to reference in canonical elements
	showHiddenElements: false,
	profiles: {},
	valuesets: {},
}

const State = new Freezer(defaultState);

export default State;
