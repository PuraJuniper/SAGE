import * as cql from 'cql-execution';
import { Library } from 'fhir/r4';
import Freezer, { EventDict, FE, FreezerNode } from 'freezer-js';
import { SageNewResource, SageNode, SageNodeInitialized, SimplifiedProfiles, SimplifiedValuesets } from './helpers/schema-utils';

export interface StateVars {
	ui: {
		status: SageUiStatus,
		selectCanonicalResourceTypeFilter?: string[],
		openMode?: string,
		replaceId?: number,
		count?: number,
		update?: {from: string, to: string}[],
		selectedNode?: SageNodeInitialized
	},
	mode: "basic" | "advanced",
	VSACEndpoint: string,
	UMLSKey: string,
	version: string,
	date: string,
	status: string,
	experimental: boolean,
	copyright: string,
	approvalDate: string,
	lastReviewDate: string,
	author: string,
	editor: string,
	reviewer: string,
	CPGName: string,
	publisher: string,
	canonicalUris: {uri: string, resourceType: string}[],
	showHiddenElements: boolean,
	bundle?: {
		pos: number
		resources: SageNodeInitialized[],
	},
	simplified: { // Data only used by the simplified view
		libraries: {
			[libraryIdentifier: string]: {
				fhirLibrary: Library,
				library: cql.Library,
				url: string,
			}
		}
	}
	resCount?: number,
	errFields?: string[],
	profiles: SimplifiedProfiles,
	valuesets: SimplifiedValuesets,
}

export type SageUiStatus = 'ready' | 'contained' | 'open' | 'validation_error' | 'resource_load_error' | 'ref_warning' | 'codePicker' 
	| 'change_profile' | 'missing_title_error' | 'id_duplicate_error' | 'title_duplicate_error' | 'url_duplicate_error' | 'cards' | 'collection'
	| 'loading' | 'profile_load_error' | 'export' | 'cpg' | 'valueSet' | 'settings' | 'select' | 'basic-cpg' | 'advanced-cpg';


export interface SageReactions {
	"load_initial_json": (profilePath: string, resourcePath: string, isRemote: boolean) => void;
	"set_ui": (status: SageUiStatus) => unknown;
	"set_profiles": (json: any) => unknown;
	"load_json_resource": (json: any, isCPG?: boolean) => unknown;
	"set_bundle_pos": (newPos: number) => unknown;
	"save_changes_to_bundle_json": () => unknown;
	"remove_from_bundle": (deleteAt: number) => unknown;
	"show_open_contained": (node: SageNode) => unknown;
	"show_open_insert": () => unknown;
	"show_open_questionnaire": () => unknown;
	"highlight_errors": (errFields: string[]) => unknown;
	"value_update": (node: SageNodeInitializedFreezerNode, value?: unknown) => unknown;
	"value_change": (node?: SageNodeInitializedFreezerNode, value?: unknown, validationErr?: unknown, strictValidationErr?: unknown) => unknown;
	"start_edit": (node: SageNodeInitializedFreezerNode) => unknown;
	"clone_resource": () => unknown;
	"show_open_activity": () => unknown;
	"update_refs": (changes?: unknown) => unknown;
	"end_edit": (node: SageNodeInitializedFreezerNode, parent: SageNodeInitialized) => unknown;
	"cancel_edit": (node: SageNodeInitializedFreezerNode) => unknown;
	"delete_node": (node: SageNodeInitializedFreezerNode, parent: SageNodeInitializedFreezerNode) => unknown;
	"move_array_node": (node: SageNodeInitializedFreezerNode, parent: SageNodeInitializedFreezerNode, down: boolean) => unknown;
	"show_object_menu": (node: SageNodeInitializedFreezerNode, parent: SageNodeInitializedFreezerNode) => unknown;
	"show_code_picker": (node: SageNodeInitializedFreezerNode) => unknown;
	"show_value_set": (node: SageNodeInitializedFreezerNode) => unknown;
	"insert_from_code_picker": (node: SageNodeInitializedFreezerNode, system: string, code: string, systemOID: string, version: string, display: string) => unknown;
	"show_canonical_dialog": (node: SageNodeInitializedFreezerNode, resourceTypes?: string[]) => unknown;
	"set_selected_canonical": (node: SageNodeInitializedFreezerNode, pos: number) => unknown;
	"add_array_value": (node: SageNodeInitializedFreezerNode) => unknown;
	"add_array_object": (node: SageNodeInitializedFreezerNode) => unknown;
	"add_object_element": (node: SageNodeInitializedFreezerNode, fhirElement: SageNode) => unknown;
	"change_profile": (nodeToChange: SageNodeInitializedFreezerNode, newProfile: keyof SimplifiedProfiles) => unknown;
	"load_json_into": (nodeToWriteTo: SageNodeInitializedFreezerNode, json: any) => unknown;
	"load_library": (library: cql.Library, url: string, fhirLibrary: Library) => unknown;
	"insert_resource_into_bundle": (resource: SageNewResource) => void;
}

const defaultStateVars: StateVars = {
	ui: { 
		status: "loading",
	},
	mode: "advanced",
	VSACEndpoint: "https://cts.nlm.nih.gov/fhir/r4",
	UMLSKey: "",
	version: "",
	date: "",
	status: "",
	experimental: true,
	copyright: "",
	approvalDate: "",
	lastReviewDate: "",
	author: "",
	editor: "",
	reviewer: "",
	CPGName: "",
	publisher: "",
	canonicalUris: [], // URIs to reference in canonical elements
	simplified: {
		libraries: {}
	},
	showHiddenElements: false,
	profiles: {},
	valuesets: {},
}

const State = new Freezer<StateVars, EventDict<SageReactions>>(defaultStateVars);

// convenience
export type SageFreezerNode<T> = FreezerNode<T, FE<T, EventDict<SageReactions>>>;
export type StateVarsFreezerNode = SageFreezerNode<StateVars>
export type SageNodeInitializedFreezerNode = SageFreezerNode<SageNodeInitialized>

export default State;
