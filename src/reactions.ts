/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import State, { SageUiStatus } from './state';
import { Bundle, Resource } from 'fhir/r4';
import * as SchemaUtils from './helpers/schema-utils';
import * as BundleUtils from './helpers/bundle-utils';
import { SageNode, SageNodeInitialized, SimplifiedProfiles } from './helpers/schema-utils';
import { FreezerNode } from 'freezer-js';

const canMoveNode = function(node: SageNodeInitialized, parent: SageNodeInitialized) {
	if (!["objectArray", "valueArray"].includes(parent?.nodeType)) {
		return [false, false];
	}
	const index = parent.children.indexOf(node);
	return [index>0, index<(parent.children.length-1)];
};

const findParent = function(targetNode: SageNodeInitialized) {
	var _walkNode = function(node: SageNodeInitialized) : {parentNode: SageNodeInitialized, childIdx: number} | undefined  {
		if (!node.children) { return; }
		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			if (child === targetNode) {
				return {
					parentNode: node,
					childIdx: i
				};
			} else if (child.children) {
				var result;
				if (result = _walkNode(child)) {
					return result; 
				}
			}
		}
	};
	return _walkNode(State.get().resource) || {parentNode: undefined, childIdx: -1};
};

const getSplicePosition = function(children: SageNodeInitialized[], index: number) {
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (child.index > index) {
			return i;
		}
	}
	return children.length;
};

const getChildForSageNode = function(node: SageNodeInitialized, searchNode: SageNode): SageNodeInitialized | undefined {
	const searchSchemaPath = searchNode.sliceName ? `${searchNode.schemaPath}:${searchNode.sliceName}` : searchNode.schemaPath;
	for (const child of node.children) {
		const schemaWithSlice = child.sliceName ? `${child.schemaPath}:${child.sliceName}` : child.schemaPath;
		if (schemaWithSlice === searchSchemaPath) { return child; }
	}
};

const getParentById = function(id: number) {
	var _walkNode = function(node: SageNodeInitialized): {parentNode: SageNodeInitialized, childIdx: number} | undefined {
		if (!node.children) { return; }
		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			if (child.id === id) {
				return {
					parentNode: node,
					childIdx: i
				};
			} else if (child.children) {
				var result;
				if (result = _walkNode(child)) {
					return result; 
				}
			}
		}
	};
	return _walkNode(State.get().resource) || {parentNode: undefined, childIdx: -1};
};

export const enforceDuplicates = function(id: string, title: string, url: string) {
	const bundle = State.get().bundle;
	const resources = bundle.resources;
	const pos = bundle.pos;
	for (let i = 0; i < resources?.length; i++) {
		if (i == pos) continue;
		if (resources[i].id == id) return "id_duplicate_error";
		if (resources[i].title == title) return "title_duplicate_error";
		if (resources[i].url && resources[i].url == url) return "url_duplicate_error";
	}
};

State.on("load_initial_json", function(profilePath, resourcePath, isRemote) {
	const queue = [
		[profilePath, "set_profiles", "profile_load_error"],
		["profiles/r4.json", "set_profiles", "profile_load_error"],
		[resourcePath, "load_json_resource", "resource_load_error"]
	];

	State.emit("set_ui", "loading");
	let current: typeof queue[0] | undefined = [];
	const loadNext = function() {
		if ((current = queue.shift()) && current[0]) {
			return $.ajax({ 
				url: current[0],
				dataType: "json",
				success: onLoadSuccess,
				error: onLoadError
			});		
		} else if (!isRemote) {
			return State.emit("set_ui", "ready");	
		}
	};
		
	var onLoadSuccess = function(json: any) {
		if (current) {
			State.emit(current[1], json);
		}
		return loadNext();
	};

	var onLoadError = (xhr: any, status: any) => current && State.emit("set_ui", current[2]);

	return loadNext();
});

State.on("set_profiles", json => State.get().set({
    profiles: {
		...State.get().profiles, 
		...json.profiles
	},
    valuesets: {
		...State.get().valuesets,
		...json.valuesets,
	}
}));

const checkBundle = (json: Resource | Bundle) => (json.resourceType === "Bundle") && (json as Bundle).entry;

const decorateResource = function(json: Resource, profiles: any) : SageNodeInitialized | undefined {
	// TODO: this shouldn't be necessary if args are properly typed
	if (!SchemaUtils.isResource(json)) {
		console.log("decorateResource called on non-resource: ", json);
		return;
	}
	const resourceProfile = SchemaUtils.getProfileOfResource(profiles, json);
	if (resourceProfile) {
		console.log('decorateresource found profile for:', json);
		return SchemaUtils.decorateFhirData(profiles, resourceProfile, json);
	}
	else {
		console.log("No default profile set for given resource -- skipping: ", json);
		return;
	}
};

const openResource = function(json: Resource) {
	const decorated = decorateResource(json, State.get().profiles);
	State.get().set({errFields: []});

	if (decorated) {
		State.get().set({resource: decorated, bundle: undefined});
		return true;
	}
};

const openBundle = function(json: Bundle) {
	let decorated;
	// resCount keeps track of the total number of resources added ever,
	// instead of current size, for title autopopulation purposes
	State.get().pivot()
		.set({resCount:1})
		.set({errFields: []});
	const resources = BundleUtils.parseBundle(json);
	if (decorated = decorateResource(resources[0], State.get().profiles)) {
		State.get().pivot()
			.set("bundle", {resources, pos: 0})
			.set({resource: decorated});
		return true;
	}
};

const bundleInsert = function(json: Resource | Bundle, isBundle?: boolean) {
	let decorated;
	let resources;
	let state = State.get();

	//stop if errors
	const [resource, errCount] = 
		SchemaUtils.toFhir(state.resource, true);

	if (!resource.title) { 
		return state.ui.set("status", "missing_title_error");
	} 
	const duplicateError = enforceDuplicates(resource.id, resource.title, resource.url);
	if (duplicateError) {
		return state.ui.set("status", duplicateError);
	}

	resource.name = resource.title.replace(/\s+/g, '');
	State.get().bundle.resources.splice(state.bundle.pos, 1, resource).now();
	state = State.get();
	state.set({resCount:state.resCount+1});

	resources = (() => {
		if (isBundle) {
		return resources = BundleUtils.parseBundle(json);
	} else if (json.id) {
		return [json];
	} else {
		const nextId = BundleUtils.findNextId(state.bundle.resources);
		json.id = BundleUtils.buildFredId(nextId);
		return [json];
	}
	})();

	if (decorated = decorateResource(resources[0], state.profiles)) {
		State.get().pivot()
			.set("resource", decorated)
			.set("errFields", [])
			.bundle.resources.splice(state.bundle.pos+1, 0, ...resources)
			.bundle.set("pos", state.bundle.pos+1);
		return true;
	}
};

const replaceContained = function(json: Resource) {
	let decorated;
	if (decorated = decorateResource(json, State.get().profiles)) {		
		const {parentNode, childIdx} = getParentById(State.get().ui.replaceId);
		if (parentNode) {
			parentNode.children.splice(childIdx, 1, decorated);
		}
		return true;
	}
};

const isBundleAndRootId = (node: SageNodeInitialized, parent: SageNodeInitialized) => (node.fhirType === "id") && State.get().bundle &&
    (parent.level === 0);

State.on("load_json_resource", (json, isCPG = true) => {
	State.get().set("canonicalUris", []);
	const {
        openMode
    } = State.get().ui;
	const isBundle = checkBundle(json) as boolean;

	// CPGName needs to be deleted
	if (!isCPG) State.get().set("CPGName", "");

	const success = openMode === "insert" ?
		bundleInsert(json, isBundle)
	: openMode === "contained" ?
		replaceContained(json)
	: isBundle ?
		openBundle(json)
	:
		openResource(json);


	const {
		profiles,
		resource,
	} = State.get();

	const usedElementPaths = resource.children?.map((v) => v.nodePath) || [];
	const unusedElements = SchemaUtils.getElementChildren(profiles, resource, usedElementPaths);
	for (const element of unusedElements) {
		if (element.isRequired) {
			const curResource = State.get().resource;
			// // Fix for FHIR north: duplicated elements on import
			// if (curResource.children.filter((v, i, a) => {return v.index == element.index}).length > 0) {
			// 	continue;
			// }
			const {
				position,
				newNode
			} = getFhirElementNodeAndPosition(curResource, element);
			if (newNode) {
				curResource.children.splice(position, 0, newNode);
			}
		}
	}
	let status = State.get().ui.status;
	// sometimes the error status gets overwritten so this preserves the error
	if (!status.endsWith("error")) status = success ? "ready" : "resource_load_error";
	return State.get().set("ui", {status});
});

// Re-inserts mandatory fields that were previously left blank
function reinsertFields (newPos: number) {
		var arrayStartsNull = function(list: any[]) {
			return Array.isArray(list) && !Object.values(list[0]).every(o => o != null);
		}
		let state = State.get();
		const {
			profiles,
			resource,
		} = state;
		// const fhirType = resource.fhirType === "BackboneElement" ? resource.schemaPath : resource.fhirType; 
		const unusedElements = SchemaUtils.getElementChildren(profiles, resource, []);
		for (const element of unusedElements) {
			const elname = element.name;
			const resourceField = state.bundle.resources[newPos][elname];
			// for mandatory fields that are null/undefined
			if (element.isRequired && resourceField === undefined) {
				const curResource = State.get().resource;
				const {
					position,
					newNode
				} = getFhirElementNodeAndPosition(curResource, element);
				if (newNode) {
					curResource.children.splice(position, 0, newNode);
				}
			// for mandatory fields that are blank arrays (they don't come up as null)
			} else if (element.isRequired && arrayStartsNull(resourceField)) {
				// these have to be cleared out of the resource first before they can come back
				// otherwise there is an error
				let curResource = State.get().resource;
				for (let i = 0; i < curResource.children.length; i++) {
					if (curResource.children[i].name == elname) {
						curResource.children.splice(i, 1);
						break;
					}
				}
			}
		}
		// re-inserting the blank array fields
		for (const element of unusedElements) {
			const elname = element.name;
			const resourceField = state.bundle.resources[newPos][elname];
			if (element.isRequired && arrayStartsNull(resourceField)) {
				let curResource = State.get().resource;
				const {
					position,
					newNode
				} = getFhirElementNodeAndPosition(curResource, element);
				if (newNode) {
					curResource.children.splice(position, 0, newNode);
				}
			}
		}
		return State.get().set("ui", {status: "ready"});
	}

State.on("set_bundle_pos", function(newPos) {
	let decorated;
	const state = State.get();
	
	if (newPos == state.bundle.pos) return;

	//stop if errors
	const [resource, errCount] = 
		SchemaUtils.toFhir(state.resource, true);
	
	if (!resource.title) { 
		return state.ui.set("status", "missing_title_error");
	}
	const duplicateError = enforceDuplicates(resource.id, resource.title, resource.url);
	if (duplicateError) {
		return state.ui.set("status", duplicateError);
	}
	
	State.get().bundle.resources.splice(state.bundle.pos, 1, resource);

	if (!(decorated = decorateResource(State.get().bundle.resources[newPos], State.get().profiles))) {
		return State.emit("set_ui", "resource_load_error");
	}
	resource.name = resource.title.replace(/\s+/g, '');


	State.get().set({errFields:[]});
	State.get().pivot()
		//splice in any changes
		.set("resource", decorated)
		.bundle.set("pos", newPos)
		.ui.set({status: "ready"});

	return reinsertFields(newPos);
});


State.on("remove_from_bundle", function() {
	let decorated;
	const state = State.get();
	let {
        pos
    } = state.bundle;
	let newPos = pos+1;
	if (newPos === state.bundle.resources.length) {
		pos = (newPos = state.bundle.pos-1);
	}

	if (!(decorated = decorateResource(state.bundle.resources[newPos], state.profiles))) {
		return State.emit("set_ui", "resource_load_error");
	}
	
	State.get().pivot()
		.set("resource", decorated)
		.bundle.resources.splice(state.bundle.pos, 1)
		.bundle.set("pos", pos);

	return reinsertFields(pos);
});

State.on("clone_resource", function() {
	const state = State.get();

	//stop if errors
	const [resource, errCount] = 
		SchemaUtils.toFhir(state.resource, true);
	if (errCount !== 0) { 
		return state.ui.set("status", "validation_error");
	}

	resource.id = null;
	return bundleInsert(resource);
});

State.on("show_open_contained", node => State.get().ui.pivot()
    .set("status", "open")
    .set("openMode", "contained")
    .set("replaceId", node.id));

State.on("show_open_insert", () => {
	if (State.get().CPGName) {
		// ie if the bundle is a CPG
		State.get().ui.set("openMode", "insert");
		const json = {resourceType: "Bundle", entry: [{resource: {resourceType: "PlanDefinition"}}]};
        return State.emit("load_json_resource", json);
	}
	State.get().ui.pivot()
    .set("status", "open")
    .set("openMode", "insert");
	});

State.on("show_open_questionnaire", () => {
	if (State.get().CPGName) {
		State.get().ui.set("openMode", "insert");
		let json = {resourceType: "Questionnaire"};
		json = {resourceType: "Bundle", entry: [{resource: json}]};
		return State.emit("load_json_resource", json);
	}
	State.get().ui.pivot()
	.set("status", "open")
	.set("openMode", "insert");
	});
       
State.on("show_open_activity", () => {
       if (State.get().CPGName) {
               State.get().ui.set("openMode", "insert");
               let json = {resourceType: "ActivityDefinition"};
               json = {resourceType: "Bundle", entry: [{resource: json}]};
               return State.emit("load_json_resource", json);
       }
       State.get().ui.pivot()
               .set("status", "open")
               .set("openMode", "insert");
       });

State.on("set_ui", function(status: SageUiStatus) {//, params: ReturnType<typeof State.get>['ui']['status']) { // Do we need this params argument?
	// if (params == null) { params = {}; }
	return State.get().ui.set({status});
});

State.on("highlight_errors", function(errFields) {
	State.get().set({errFields});
	State.emit("set_ui", "ready");
});

State.on("value_update", (node, value) => node.ui.reset({status: "ready"}));

State.on("value_change", function(node, value, validationErr, strictValidationErr) {
	//in case there are pre-save errors
	State.get().ui.set({status: "ready"});

	if (node.ui) {
		return node.pivot()
			.set({value})
			.ui.set({validationErr})
			.now();
	} else {
		return node.pivot()
			.set({value})
			.set({ui: {}})
			.ui.set({validationErr})
			.now();
	}
});

State.on("start_edit", function (node) {
	node.pivot()
    .set({ui: {}})
    .ui.set("status", "editing")
    .ui.set("prevState", node);
	const canonicalUris = State.get().canonicalUris;
	if (node.fhirType == "uri") {
		for (let i=0;i<canonicalUris.length;i++) {
			if (canonicalUris[i].uri == node.value) {
				State.get().canonicalUris.splice(i, 1);
				break;
			}
		}
	}
});

const getResourceType = function(node: SageNodeInitialized) {
	for (let child of Array.from(node.children)) {
		if (child.name === "resourceType") {
			return child.value;
		}
	}
};

const showReferenceWarning = function(node: SageNodeInitialized, parent: SageNodeInitialized, fredId?: number) {
	const prevId = node.ui.prevState.value;
	const currentId = fredId || node.value;
	const resourceType = getResourceType(parent);
	const prevRef = `${resourceType}/${prevId}`;
	const newRef = `${resourceType}/${currentId}`;
	const changeCount = 
		BundleUtils.countRefs(State.get().bundle.resources, prevRef);
	if (changeCount > 0) {
		return State.get().ui.pivot()
			.set({status: "ref_warning"}) 
			.set({count: changeCount}) 
			.set({update: [{from: prevRef, to: newRef }]});
	}
};

State.on("update_refs", function(changes) {
	const resources = 
		BundleUtils.fixAllRefs(State.get().bundle.resources, changes);

	State.get().bundle.set("resources", resources);
	return State.emit("set_ui", "ready");
});

State.on("end_edit", function(node: SageNodeInitialized, parent: SageNodeInitialized) {
	if (isBundleAndRootId(node, parent) && 
		(node.value !== node.ui.prevState.value)) {
			showReferenceWarning(node, parent);
		}
	if (node.fhirType == "uri") {
		State.get().canonicalUris.push({
			uri: node.value,
			resourceType: parent.fhirType
		});
	}
	return node.ui.reset({status: "ready"});
});

State.on("cancel_edit", function(node) {
	if (node.ui.validationErr) {
		State.get().ui.set("status", "ready");
	}
	if (node.ui.prevState) {
		return node.reset(node.ui.prevState.toJS());
	}
});

State.on("delete_node", function(node, parent) {
	let index, targetNode;
	if ((parent.nodeType === "objectArray") &&
		(parent.children.length === 1)) {
			const {parentNode, childIdx} = findParent(parent);
			if (parentNode) {
				index = childIdx;
				targetNode = parentNode;
			}
			else {
				console.log("ERROR in 'delete_node': parent of nodeType 'objectArray' has no parent. Args follow: (node, parent)", node, parent);
			}
	} else {
		targetNode = parent;
		index = parent.children.indexOf(node);
	}

	//don't allow deletion of root level id in bundled resource
	if (isBundleAndRootId(node, parent)) {
		const nextId = BundleUtils.findNextId(State.get().bundle.resources);
		const fredId = BundleUtils.buildFredId(nextId);
		node.pivot()
			.set({value: fredId})
			.ui.set({status: "ready"});

		return showReferenceWarning(node, parent, fredId);

	} else if (index !== null) {
		return targetNode.children.splice(index, 1);
	}
});

State.on("move_array_node", function(node, parent, down) {
	const position = parent.children.indexOf(node);
	const newPostion = down ? position+1 : position-1;

	node = node.toJS();
	node.ui.status = "ready";
	return parent.children
		.splice(position, 1)
		.splice(newPostion, 0, node);
});

State.on("show_object_menu", function(node: FreezerNode<SageNodeInitialized>, parent: SageNodeInitialized) {
	let unusedElements;
	if (node.nodeType !== "objectArray") {
		const {
            profiles
        } = State.get();
		const usedElements = [];
		for (let child of Array.from(node.children)) { 
			if (!child.range || (child.range[1] === "1") || (child.nodeType === "valueArray") || (
				(child.range[1] !== "*") && (parseInt(child.range[1]) < (child?.children?.length || 0))
			)) {
				usedElements.push(child.nodePath);
			}
		}

		unusedElements = SchemaUtils.getElementChildren(profiles, node, usedElements);
	}
	const [canMoveUp, canMoveDown] = canMoveNode(node, parent);

	return node.pivot()
		.set({ui: {}})
		.ui.set({status: "menu"})
		.ui.set({menu: {}})
		.ui.menu.set({canMoveUp})
		.ui.menu.set({canMoveDown})
		.ui.menu.set({unusedElements});
});

State.on("show_code_picker", function(node) {
	State.get().ui.pivot().set("selectedNode", node);
	return State.emit("set_ui", "codePicker");
});

State.on("show_value_set", function(node) {
	State.get().ui.pivot().set("selectedNode", node);
	return State.emit("set_ui", "valueSet");
});

// Insert system, code, version, and display elements to the given node.
// `node` is expected to be of type Coding
State.on("insert_from_code_picker", function(node: FreezerNode<SageNodeInitialized>, system: string, code: string, systemOID: string, version: string, display: string) {

	if (node.fhirType != "Coding") {
		console.log("insert_from_code_picker event emitted with an unexpected FHIR type -- returning");
		return;
	}

	const pathToParam = {
		'Coding.system' : system,
		'Coding.code': code,
		'Coding.version': version,
		'Coding.display': display,
	};

	// Delete system, code, version, and display children, if they exist
	const childrenToRemove = [];
	for (const child of node.children) {
		if (Object.keys(pathToParam).includes(child.schemaPath)) {
			childrenToRemove.push(child);
		}
	}
	for (const child of childrenToRemove) {
		node.pivot().children.splice(node.children.indexOf(child), 1);
	}

	// Create system, code, version, and display nodes with the given values
	const codingElementChildren = SchemaUtils.getElementChildren(State.get().profiles, node, []);
	for (const child of codingElementChildren) {
		if (child.schemaPath in pathToParam) {
			const {
				position,
				newNode
			} = getFhirElementNodeAndPosition(node, child)
			if (newNode){
				newNode.value = pathToParam[newNode.schemaPath];
				newNode.ui = {status: "ready"};
				node.pivot().children.splice(position, 0, newNode);
			}
		}
	}
});

+State.on("show_canonical_dialog", function(node) {
	State.get().ui.pivot().set("selectedNode", node);
	return State.emit("set_ui", "select");
})

State.on("set_selected_canonical", function(node: FreezerNode<SageNodeInitialized>, pos: number) {
	let state = State.get();
	let url = state.bundle.resources[pos].url;
	for (let i = 0; i < node.children.length; i++) {
		if (node.children[i].name == "definitionCanonical") {
				node = node.children.splice(i,1);
		}
	}
	const actionChildren = SchemaUtils.getElementChildren(State.get().profiles, 'PlanDefinition.action', null);
	for (const child of actionChildren) {
		if (child.name == "definitionCanonical") {
			const {
					position,
					newNode
			} = getFhirElementNodeAndPosition(node, child)
			if (newNode) {
				newNode.value = url;
				newNode.ui = {status: "ready"};
				node = node.children.splice(position, 1, newNode);
			}
		}
	}
});

State.on("add_array_value", function(node: SageNodeInitialized) {
	const {
        profiles
    } = State.get();
	const newNode = SchemaUtils.buildChildNode(profiles, node, node, node.fhirType);
	newNode.ui = {status: "editing"};
	return node.children.push(newNode);
});

State.on("add_array_object", function(node: SageNodeInitialized) {
	const {
        profiles
    } = State.get();
	const newNode = SchemaUtils.buildChildNode(profiles, node, node, node.fhirType);
	return node.children.push(newNode);
});	

const getFhirElementNodeAndPosition = function(node: SageNodeInitialized, fhirElement: SageNode): {
	position: number,
	newNode: SageNodeInitialized | undefined
} {
	let child, newNode: SageNodeInitialized;
	const {
        profiles
    } = State.get();

	if (fhirElement.range && (fhirElement.range[1] !== "1") &&
		(child = getChildForSageNode(node, fhirElement))) {
			newNode = SchemaUtils.buildChildNode(profiles, child, fhirElement, child.fhirType);
			child.children.push(newNode);
			return {
				position: -1,
				newNode: undefined,
			};
		}

	newNode = SchemaUtils.buildChildNode(profiles, node, fhirElement, fhirElement.fhirType);
	if (["value", "valueArray"].includes(newNode.nodeType)) {
		newNode.ui = {status: "editing"};
	}

	const position = getSplicePosition(node.children, newNode.index);

	return {
		position,
		newNode,
	};
}

State.on("add_object_element", function(node, fhirElement) {
	const {
		position,
		newNode
	} = getFhirElementNodeAndPosition(node, fhirElement);
	if (newNode) {
		return node.children.splice(position, 0, newNode);
	}
});

State.on("change_profile", function(nodeToChange: FreezerNode<SageNodeInitialized>, newProfile: keyof SimplifiedProfiles) {
	// Assuming a 'meta' element exists (should this be part of a type for Resource SageNodes?)
	for (const child of nodeToChange.children) {
		if (child.fhirType == 'Meta') {
			for (const metaChild of child.children) {
				if (metaChild.nodePath == 'Meta.profile') {
					metaChild.children[0].set({
						value: newProfile,
					});
				}
			}
		}
	}
	State.emit("set_bundle_pos", State.get().bundle.pos);
});

export default State;
