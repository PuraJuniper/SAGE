/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import State, { SageFreezerNode, SageNodeInitializedFreezerNode } from '../state';
import PrimitiveValidator from './primitive-validator';
import { Bundle, Resource, Element, ElementDefinition, ElementDefinitionType, ActivityDefinition, PlanDefinition, Questionnaire, Library, ValueSet, FhirResource, CodeSystem } from 'fhir/r4';
import { defaultProfileUriOfResourceType, FriendlyResourceFormElement, FriendlyResourceProps, profileToFriendlyResourceListEntry, STRUCTURE_DEFINITION, VALUE_SET } from '../simplified/nameHelpers';
import * as Bioportal from "../simplified/cql-wizard/bioportal";

// Template of a SageNode for a specific element/resource
export type SageNode = {
	id?: number,
	index: number,
	name: string,
	// Internal types used by SAGE
	nodeType: 'value' | 'object' | 'objectArray' | 'arrayObject' | 'valueArray' | 'resource',
	displayName: string,
	// Path containing the definition in `profile` i.e. "PlanDefinition.action.description" or (for a top-level definition) "Extension"
	schemaPath: string,
	// Path relative to the nearest top-level definition i.e. "PlanDefinition.action.description" or "PlanDefinition.Extension" (often the same as schemaPath)
	nodePath: string,
	fhirType: string,
	type: ElementDefinitionType,
	level?: number,
	sliceName: string,
	short: string,
	isRequired: boolean,
	profile: string, // This profile must be able to resolve `schemaPath`
	binding?: any,
	hidden?: boolean,
	defaultValue?: any,
	value?: any,
	range?: Readonly<[number, string]>,
	contentType?: string,
	ui?: any,
	isFixed?: boolean,
}

// Nodes that actually exist in the current tree
export type SageNodeInitialized = SageNode & {
	nodeCreator?: 'user',
	children: SageNodeInitialized[],
	value?: any,
}

export type SageSupportedFhirResource = PlanDefinition | ActivityDefinition | Questionnaire | Library | ValueSet;

export type SageNewResource = {
	resourceType: string,
	url?: string,
}

// type fhirTypeValues = "decimal" | "boolean" | "xhtml" | "base64Binary" | "code" | "uri" | "canonical";

export type ProfileDefs = {
	'__meta': {
		baseDefinition: string,
		id: string,
		name: string,
		type: string,
		url: string,
	},
} & {
	[key: string]: SchemaDef
}

export type SimplifiedProfiles = {
	[key: string]: ProfileDefs,
}

type ValuesetDef = {
	items: [string, string][], // [friendly name, value][]
	rawElement: ValueSet
}

export type SimplifiedValuesets = {
	[key: string]: ValuesetDef, // should be ValuesetDef | undefined
}

export type SimplifiedCodesystems = {
	[key: string]: CodeSystem | undefined,
}

// should match the profile output of simplify-profiles.coffee
type SchemaDef = {
	index: number,
	isModifier: boolean,
	isSummary: boolean,
	max: string,
	min: number,
	path: string,
	rawElement: ElementDefinition, // the definition of the element straight from .snapshot of the Resource's StructureDefinition
	short: string,
	sliceName: string,
	// there's always at least one type in an ElementDefinition from StructureDefinition.snapshot (which is 
	//  how the script populates this)
	type: ElementDefinitionType[],
	binding?: {
		strength: string,
		reference: string,
	},
	refSchema?: string
}

//TODO: break up this module

let nextId = 0;

const isComplexType = (fhirType: string): boolean => (fhirType[0] === fhirType[0].toUpperCase());

const isInfrastructureType = (fhirType: string): boolean => ["DomainResource", "Element", "BackboneElement"].includes(fhirType);
const linkPrefix = "http://hl7.org/fhir";

// Element names that will be skipped (will not appear in the "Add Element" dropdown)
const unsupportedElements: string[] = [];

export function toFhir<B extends boolean>(decorated: SageNodeInitialized, validate: B): B extends true ? [SageSupportedFhirResource, number, string[]] : SageSupportedFhirResource
export function toFhir(decorated: SageNodeInitialized, validate: boolean): [SageSupportedFhirResource, number, string[]] | SageSupportedFhirResource {
	// console.log('toFhir', decorated, validate);
	let errCount = 0;
	const errFields: string[] = [];
	const _walkNode = function (node: SageNodeInitialized, parent?: any) {
		if (parent == null) { parent = {}; }
		for (const child of Array.from(node.children)) {
			const value = (() => {
				if (["object", "arrayObject"].includes(child.nodeType)) {
					return _walkNode(child, {});
				} else if (["valueArray", "objectArray"].includes(child.nodeType)) {
					return _walkNode(child, []);
				} else {
					let err;
					if (validate && child?.ui?.validationErr) {
						err = child?.ui?.validationErr;
					} else if (validate && child.fhirType) {
						err = PrimitiveValidator(child.fhirType, child.value, true);
					}

					if (err) {
                        errFields.push(child.schemaPath + ' - ' + err);
						errCount++;
					}
					return child.value;
				}
			})();
			if (parent instanceof Array) {
				parent.push(value);
			} else {
				parent[child.name] = value;
			}
		}

		return parent;
	};

	const fhir = _walkNode(decorated);
	// Special element for JSON representations of FHIR Resources (https://www.hl7.org/fhir/json.html)
	fhir.resourceType = decorated.nodePath;
	// console.log('tofhir end:', fhir);
	// console.log('end toFhir', fhir);
	if (validate) {
		return [fhir, errCount, errFields];
	} else {
		return fhir;
	}
}

export const getNextId = () => {
	return nextId++;
}

// export const toBundle = (resources, pos, resource) => resource;

// getAllowedReferences: (schemaPath) ->

// Build array of possible children from the schema for `node`
//  optionally excluding some paths (useful for building the dropdown of available elements to add)
export const getElementChildren = function (profiles: SimplifiedProfiles, node: SageNode, nodePathsToExclude: string[]): SageNode[] {
	// console.log('getelementchildren', node, nodePathsToExclude);
	if (nodePathsToExclude == null) { nodePathsToExclude = []; }
	const _buildChild = (name: string, childSchema: SchemaDef, typeDef: ElementDefinitionType): SageNode => {
		// if a new profile should be set for this child, we also reset the schema path accordingly
		const newProfile = getProfileOfSchemaDef(profiles, childSchema, typeDef);
		const childProfile = newProfile ? newProfile : node.profile;
		const newSchemaPath = newProfile ? typeDef.code : childSchema.path;
		return {
			nodePath: childSchema.sliceName ? `${childSchema.path}:${childSchema.sliceName}` : childSchema.path,
			schemaPath: newSchemaPath,
			sliceName: childSchema.sliceName,
			profile: childProfile,
			name,
			displayName: buildDisplayName(name, childSchema.sliceName),
			index: childSchema.index,
			isRequired: childSchema.min >= 1 || presentedInCardEditor(name, childProfile) || presentedInCardEditor(name, node.profile),
			fhirType: typeDef.code,
			type: typeDef,
			short: childSchema.short,
			range: [childSchema.min, childSchema.max],
			nodeType: isComplexType(typeDef.code) ?
				childSchema.max !== "1" ? "objectArray" : "object"
				:
				childSchema.max !== "1" ? "valueArray" : "value",
		};
	};

	const _buildMultiTypePermutations = function (schema: SchemaDef): SageNode[] {
		const permutations: SageNode[] = [];
		for (const type of Array.from(schema.type)) {
			const capType = type.code[0].toUpperCase() + type.code.slice(1);
			const name = (schema.path.split(".").pop() as string).replace("[x]", capType);
			permutations.push(_buildChild(name, schema, type));
		}
		return permutations;
	};

	const _isMultiType = (schemaPath: string) => schemaPath.indexOf("[x]") > -1;

	const schemaPath = node.schemaPath;
	let children: SageNode[] = [];
	const level = schemaPath.split(".").length;

	const defs = profiles[node.profile] || {};
	if (!defs) {
		console.log(`No definition found for profile ${node.profile}`);
	}
	for (const path in defs) {
		const schema = defs[path];
		// Skip adding this child if it's explicitly ignored, 
		//  or if the path does not lead to a child element of `node` that is exactly
		//  one level below
		if (nodePathsToExclude.includes(path) ||
			(path.indexOf(schemaPath) === -1) ||
			(path.split(".").length !== (level + 1))) {
			continue;
		}

		// if (schema?.nameReference) {
		// 	schemaPath = schemaPath.split(".").shift() + "." + schema.nameReference;
		// }

		if (_isMultiType(path)) {
			children = children.concat(_buildMultiTypePermutations(schema));
		} else {
			const name = schema.path.split(".").pop() as string;
			if (!unsupportedElements.includes(name)) {
				const type = schema?.type?.[0]?.code || "BackboneElement";
				children.push(_buildChild(name, schema, schema?.type[0]));
			}
		}
	}

	return children = children.sort((a, b) => a.index - b.index);
};

// getElementChildren excluding any elements that are at maximum cardinality
export const getAvailableElementChildren = function (profiles: SimplifiedProfiles, node: SageNodeInitialized) {
	const usedElements = [];
	// console.log(node);
	// console.log(node.children[0]);
	for (const child of Array.from(node.children)) {
		if (!child.range || (child.range[1] === "1")
			// These two nodeTypes have an "Add Item" option in their menus, so they're ignored here
			|| child.nodeType == "objectArray" || (child.nodeType === "valueArray")
			|| ((child.range[1] !== "*") && (parseInt(child.range[1]) < (child?.children?.length || 0))
			)) {
			usedElements.push(child.nodePath);
		}
	}
	// console.log(usedElements);
	return getElementChildren(profiles, node, usedElements);
}

const getDefaultValue = (schema: SchemaDef, fhirType: string, parentName = ""): {
	isFixed: boolean,
	defaultValue: string | boolean | null,
} => {
	// This naming convention for fixed values is from the FHIR spec for "Element Definition"
	const fixedTypeName = "fixed" + fhirType[0].toUpperCase() + fhirType.substring(1);
	if (fixedTypeName in schema.rawElement) {
		return {
			isFixed: true,
			defaultValue: (schema.rawElement as any)[fixedTypeName],
		}
	}
	// // Hard-coding meta.profile
	// if (schema.path == 'Meta.profile') {}
	let defaultValue = null;
	switch (fhirType) {
		case "boolean":
			defaultValue = fhirType === "boolean" ? true : null;
			break;
	}

	// Attempt to auto-populate URLs, Names, and Publishers, if possible
	const pathSuffix = schema.path.split('.');
	switch (pathSuffix[pathSuffix.length - 1]) {
		case "name":
			if (State.get().CPGName != "") {
				//filter editor and reviewer
				if (pathSuffix[0] == "ContactDetail") {
					if (parentName == "author") {
						defaultValue = State.get().author;
					} else if (parentName == "editor") {
						defaultValue = State.get().editor;
					} else if (parentName == "reviewer") {
						defaultValue = State.get().reviewer
					}
				}
				else {
					defaultValue = `${pathSuffix[0]}-${State.get().CPGName}${State.get().resCount}`;
				}
			}
			break;
		case "publisher":
			if (State.get().publisher != "") {
				defaultValue = State.get().publisher;
			}
			break;
		case "url":
			if (State.get().publisher != "" && State.get().CPGName != "") {
				// Ignore extensions
				if (pathSuffix[0] == "Extension") {
					break;
				}
				defaultValue = `http://fhir.org/guides/${State.get().publisher}/${pathSuffix[0]}/${pathSuffix[0]}-${State.get().CPGName}${State.get().resCount}`;
				if (pathSuffix[0].endsWith("Activity")) {
					defaultValue = `http://fhir.org/guides/${State.get().publisher}/ActivityDefinition/ActivityDefinition-${State.get().CPGName}${State.get().resCount}`;
				}
			}
			break;
		case "status":
			if (State.get().status != '') {
				defaultValue = State.get().status
			}
			break;
		case "version":
			if (State.get().version != "") {
				defaultValue = State.get().version;
			}
			break;
		case "date":
			if (State.get().date != "") {
				defaultValue = State.get().date;
			}
			break;
		case "copyright":
			if (State.get().copyright != "") {
				defaultValue = State.get().copyright;
			}
			break;
		case "approvalDate":
			if (State.get().approvalDate != "") {
				defaultValue = State.get().approvalDate;
			}
			break;
		case "lastReviewDate":
			if (State.get().lastReviewDate != "") {
				defaultValue = State.get().lastReviewDate;
			}
			break;
	}

	return {
		isFixed: false,
		defaultValue,
	}
}

export const buildChildNode = function (profiles: SimplifiedProfiles, parentNode: SageNodeInitialized, childNode: SageNode, fhirType: string): SageNodeInitialized {
	// Add required children of `parentNode2`
	const _addRequiredChildren = (parentNode2: SageNodeInitialized, fhirType: string) => {

		// if (isComplexType(fhirType) && !isInfrastructureType(fhirType)) {
		// 	schemaPath = fhirType;
		// }

		//TODO: Investigate this
		const children = getElementChildren(profiles, parentNode2, []);

		const reqChildren = [];
		for (const child of Array.from(children)) {
			if (child.isRequired) {
				reqChildren.push(buildChildNode(profiles, parentNode2, child, child.fhirType));
			}
		}
		return reqChildren;
	};



	let name = childNode.name;

	const schema = profiles[parentNode.profile]?.[childNode.nodePath];

	// if (schema?.nameReference) {
	// 		schemaPath = [schemaPath[0], schema.nameReference];
	// 	}

	if (name.indexOf("[x]") > -1) {
		const capType = fhirType[0].toUpperCase() + fhirType.slice(1);
		name = name.replace("[x]", capType);
	}

	if ((schema.max !== "1") && !["valueArray", "objectArray"].includes(parentNode.nodeType)) {
		const result: SageNodeInitialized = {
			id: nextId++,
			name,
			index: schema.index,
			profile: parentNode.profile,
			nodePath: childNode.nodePath,
			schemaPath: childNode.schemaPath,
			sliceName: childNode.sliceName,
			fhirType: childNode.fhirType,
			type: childNode.type,
			displayName: buildDisplayName(name, childNode.sliceName),
			nodeType: isComplexType(fhirType) ? "objectArray" : "valueArray",
			short: schema.short,
			nodeCreator: "user",
			isRequired: schema.min >= 1 || presentedInCardEditor(name, parentNode.profile),
			range: [schema.min, schema.max],
			children: [],
		};
		const childNode2 = {
			...childNode,
		}
		// childNode2.nodePath = childNode2.schemaPath;
		result.children = [buildChildNode(profiles, result, childNode2, childNode.fhirType)];
		return result;
	} else {
		const {
			isFixed,
			defaultValue
		} = getDefaultValue(schema, fhirType, parentNode.name);
		const resultNodeType = isComplexType(fhirType) && (parentNode.nodeType === "objectArray") ?
			"arrayObject"
			: isComplexType(fhirType) ?
				"object"
				:
				"value";
		const result: SageNodeInitialized = {
			id: nextId++,
			name,
			index: schema.index,
			nodePath: childNode.nodePath,
			schemaPath: childNode.schemaPath,
			sliceName: childNode.sliceName,
			fhirType: childNode.fhirType,
			type: childNode.type,
			displayName: buildDisplayName(name, childNode.sliceName),
			isRequired: schema.min >= 1 || presentedInCardEditor(name, childNode.profile),
			short: schema.short,
			nodeCreator: "user",
			isFixed,
			defaultValue: defaultValue,
			value: defaultValue,
			range: [schema.min, schema.max],
			binding: schema?.binding,
			profile: childNode.profile,
			nodeType: resultNodeType,
			children: [],
			ui: {
				status: isFixed ? "ready" : "editing"
			}
		};

		if (isComplexType(fhirType)) {
			result.children = _addRequiredChildren(result, childNode.fhirType);

		}

		return result;
	}
};

export function findFirstSageNodeByUri(nodes: SageFreezerNode<SageNodeInitialized[]>, uri: string): {
	node: SageNodeInitializedFreezerNode,
	pos: number
} | {
	node: null,
	pos: null
} {
	// Return the first SageNode of `nodes` that has a child "URL" SageNode with value equal to `uri`
	let idx = 0;
	for (const node of nodes) {
		const URLNode = getChildOfNode(node, "url");
		if (URLNode && URLNode.value == uri) {
			return {
				node,
				pos: idx
			};
		}
		idx += 1;
	}
	return {
		node: null,
		pos: null
	}
}

export const buildDisplayName = function (name: string, sliceName?: string) {
	const _fixCamelCase = function (text: string, lowerCase?: boolean) {
		//function has an issue with consecutive capital letters (eg. ID)
		//and not convinced splitting camelcase words has value
		//so bypassing for now and just capitalizing first letter
		if (!lowerCase) {
			text = text[0].toUpperCase() + text.slice(1);
		}
		return text;
	};

	let displayName: string = name.split('.').pop() as string
	displayName = sliceName ? `${_fixCamelCase(displayName)}:${sliceName}` : _fixCamelCase(displayName);
	return displayName;
};

// checks if we have a default profile for this resource (without a profile, how do we know what fields exist?)
// and returns it if it exists in `profiles`
export const getProfileOfResource = function (profiles: SimplifiedProfiles, resource: Resource): string | undefined {
	if (resource.meta?.profile && resource.meta.profile.length > 0 && profiles[resource.meta.profile[0]]) {
		return resource.meta.profile[0];
	}
	const defaultProfile = defaultProfileUriOfResourceType(resource.resourceType);
	if (defaultProfile && profiles[defaultProfile]) {
		return defaultProfile;
	}
	const standardPath = `${linkPrefix}/${STRUCTURE_DEFINITION}/${resource.resourceType}`;
	if (profiles[standardPath]) {
		return standardPath;
	}
};

// checks if the given object is a Resource
export const isSupportedResource = function (data: any): data is SageSupportedFhirResource {
	return (data as SageSupportedFhirResource).resourceType !== undefined;
}

// checks if the SchemaNode uses a profile and returns its URI if so. 
// otherwise, it returns a default for that type or undefined if one doesn't exist (bad?)
const getProfileOfSchemaDef = function (profiles: SimplifiedProfiles, schemaNode: SchemaDef, typeDef?: ElementDefinitionType): string | undefined {
	// console.log('getProfileOfSchemaDef', schemaNode, typeDef);
	typeDef = typeDef ?? schemaNode.type[0];
	if (typeDef.profile) {
		return typeDef.profile[0];
	}
	else if (defaultProfileUriOfResourceType(typeDef.code)) {
		return defaultProfileUriOfResourceType(typeDef.code);
	}
	else if (profiles[`${linkPrefix}/${STRUCTURE_DEFINITION}/${typeDef.code}`]) {
		// skipping all types that start with a lowercase letter since they are primitives)
		if (isInfrastructureType(typeDef.code)
			|| typeDef.code[0] != typeDef.code[0].toUpperCase()) {
			return;
		}
		return `${linkPrefix}/${STRUCTURE_DEFINITION}/${typeDef.code}`;
	}
	else if (typeDef.code == 'http://hl7.org/fhirpath/System.String') { // just a primitive
		return;
	}
	else {
		console.log(`No default profile found for code: ${typeDef.code}`);
	}
}

function presentedInCardEditor(name: string, profile?: string): boolean {
	const resourceEntry = profileToFriendlyResourceListEntry(profile);

	function resourceContainsSubElem(formElem: FriendlyResourceFormElement): boolean {
		return formElem.SELF.FHIR == name || (formElem.FORM_ELEMENTS?.reduce(function(accumulator: boolean, subFormElem) {
			return accumulator || resourceContainsSubElem(subFormElem);
		}, false) ?? false)
	}

	if (resourceEntry && resourceEntry.SELF.DEFAULT_PROFILE_URI == profile && resourceEntry.SELF.FHIR == name) {
		return true
	}
	function getFormListItem(name: string, frfe: FriendlyResourceFormElement): FriendlyResourceFormElement | undefined {
		return (frfe.SELF.FHIR == name) ? frfe :
			frfe.FORM_ELEMENTS ?
				frfe.FORM_ELEMENTS.length > 0 ?
					frfe.FORM_ELEMENTS.find(fListItem => getFormListItem(name, fListItem))
					: undefined
				: undefined
	}
	if (resourceEntry && resourceEntry.FORM_ELEMENTS) { //It's a subnode of a Card Resource Type
		const formElem: FriendlyResourceFormElement | undefined = resourceEntry.FORM_ELEMENTS
			.map(formElem => getFormListItem(name, formElem))
			.find(formElem => formElem)
		return formElem ? true : false;
	} else {
		return false;
	}
}

export function getChildOfNodePath(node: SageNodeInitializedFreezerNode, childNamePath: string[]): SageNodeInitializedFreezerNode | undefined;
export function getChildOfNodePath(node: SageNodeInitialized, childNamePath: string[]): SageNodeInitialized | undefined;
export function getChildOfNodePath(node: SageNodeInitialized, childNamePath: string[]): SageNodeInitialized | undefined {
	if (childNamePath.length > 1) {
		const nextChild = getChildOfNode(node, childNamePath[0]);
		if (nextChild) {
			return getChildOfNodePath(nextChild, childNamePath.slice(1));
		}
	}
	else if (childNamePath.length == 1) {
		return getChildOfNode(node, childNamePath[0]);
	}
	else {
		// It would be nice to type-check this case away
		return;
	}
}

export function getChildOfNode(node: SageNodeInitializedFreezerNode, childName: string): SageNodeInitializedFreezerNode | undefined;
export function getChildOfNode(node: SageNodeInitialized, childName: string): SageNodeInitialized | undefined;
export function getChildOfNode(node: SageNodeInitialized, childName: string): SageNodeInitialized | undefined {
	if (node.nodeType == "objectArray") {
		const nodesOfArray = getChildrenFromArrayNode(node);
		if (nodesOfArray.length > 0) {
			return getChildOfNode(nodesOfArray[0], childName);
		}
		else {
			console.log(`Node named "${node.name}" is an empty objectArray, so cannot not traverse to ${childName}. Empty Node follows:`, node);
			return;
		}
	}

	const descendants: SageNodeInitialized[] = [];
	node.children.forEach(child => {
		if (child.name == childName) {
			descendants.push(child);
		}
		const granChild = getChildOfNode(child, childName)
		if (granChild) {
			descendants.push(granChild);
		}
	})

	if (descendants.length > 0) {
		if (descendants.length > 1) {
			console.log(`More than one child found for "${childName}".`);
			const noDescendants = descendants.find(des => des.children.length == 0);
			if (noDescendants !== undefined) {
				console.log(`Picking the first one with no descendants for:`, node);
				return descendants.find(des => des.children.length == 0)
			}
			else {
				console.log(`Picking first child`);
				return descendants[0]
			}
		} else {
			return descendants[0]
		}
	} else {
		// console.log(`Couldnt find child named "${childName}" for:`, node);
		return;
	}
}

export const createChildrenFromJson = function (profiles: SimplifiedProfiles, nodeToWriteTo: SageNodeInitialized, fhirJson: any) {
	const nodeProfileSchema = profiles[nodeToWriteTo.profile];
	const nodePath = nodeToWriteTo.schemaPath
	const newChildren: SageNodeInitialized[] = [];

	for (const k in fhirJson) {
		const v = (fhirJson as any)[k];
		const childPath = `${nodePath}.${k}`;
		const childDef = nodeProfileSchema[childPath];
		if (childDef) {
			const walkRes = walkNode(profiles, v, nodeToWriteTo.profile, childPath, (nodeToWriteTo.level || 0) + 1);
			if (walkRes) {
				newChildren.push(walkRes);
			}
		}
		else {
			if (childPath.split('.').pop() != 'resourceType') { // resourceType is not in the schema for some reason
				console.log(`Could not find definition for ${childPath}`);
			}
		}
		// add else to check if childPath exists in another profile
	}

	return newChildren;
}

export const createChildrenFromArray = function (profiles: SimplifiedProfiles, nodeToWriteTo: SageNodeInitialized, fhirJsonArray: any[]) {
	const nodeProfileSchema = profiles[nodeToWriteTo.profile];
	const nodePath = nodeToWriteTo.schemaPath
	const newChildren: SageNodeInitialized[] = [];

	for (const fhirJson of fhirJsonArray) {
		const childPath = `${nodePath}`;
		const childDef = nodeProfileSchema[childPath];
		if (childDef) {
			const walkRes = walkNode(profiles, fhirJson, nodeToWriteTo.profile, childPath, (nodeToWriteTo.level || 0) + 1);
			if (walkRes) {
				newChildren.push(walkRes);
			}
		}
		else {
			if (childPath.split('.').pop() != 'resourceType') { // resourceType is not in the schema for some reason
				console.log(`Could not find definition for ${childPath}`);
			}
		}
		// add else to check if childPath exists in another profile
	}

	return newChildren;
}

export function buildUrlForResource(resourceType: string) {
	return `http://fhir.org/guides/${State.get().publisher}/${resourceType}/${resourceType}-${State.get().CPGName}${State.get().resCount + 1}`;
}

/**
 * 
 * @param resourceType The type of resource to create
 * @param withUrl Whether a URL should be generated for the resource
 * @returns A (possibly incomplete) FHIR resource
 */
export function buildNewFhirResource(resourceType: string, withUrl?: boolean): SageNewResource {
	const newResource = {
		resourceType,
		url: withUrl ? buildUrlForResource(resourceType) : undefined,
	}
	return newResource;
}

export function getChildrenFromArrayNode(node: SageNodeInitializedFreezerNode): SageNodeInitializedFreezerNode[];
export function getChildrenFromArrayNode(node: SageNodeInitialized): SageNodeInitialized[];
export function getChildrenFromArrayNode(node: SageNodeInitialized): SageNodeInitialized[] {
	if (node.nodeType != "objectArray" && node.nodeType != "valueArray") {
		return [];
	}
	const retArr: SageNodeInitialized[] = [];
	for (const child of node.children) {
		retArr.push(child);
	}
	return retArr;
}

export const getArrayFromObjectArrayNode = function (node: SageNodeInitialized): any[] {
	if (node.nodeType != "objectArray") {
		return [];
	}
	const retArr: any[] = [];
	for (const child of node.children) {
		retArr.push(child.value);
	}
	return retArr;
}

export const walkNode = (profiles: SimplifiedProfiles, valueOfNode: any, profileUri: string, schemaPath: string, level: number | null, inArray?: boolean): SageNodeInitialized | undefined => {
	// TODO: dataNode could be a Resource in a `contained` element
	// if ('resourceType' in dataNode) {
	// 	const resourceType = dataNode.resourceType;
	// }
	// console.log("start _walkNode:", valueOfNode, profileUri, schemaPath, level, inArray);
	let i, v;
	if (level == null) {
		//root node
		level = 0;
	}

	const name = schemaPath.split('.').pop() as string; // we know pop() will return a string here
	let trueSchemaPath = schemaPath;
	let schema = profiles[profileUri]?.[trueSchemaPath];
	let typeIdx = 0; // Assuming 0
	let fhirType = schema?.type[typeIdx]?.code;
	let type = schema?.type[typeIdx];
	//is it a multi-type?
	if (!schema) {
		const elementName = schemaPath.split('.').pop() as string;
		const nameParts = elementName.split(/(?=[A-Z])/);
		let testSchemaPath = schemaPath.split(".").slice(0, schemaPath.split(".").length - 1).join(".") + ".";
		for (i = 0; i < nameParts.length; i++) {
			let testSchema;
			const namePart = nameParts[i];
			testSchemaPath += `${namePart}`;
			if ((testSchema = profiles[profileUri]?.[`${testSchemaPath}[x]`])) {
				schema = testSchema;
				trueSchemaPath = `${testSchemaPath}[x]`;
				const expectedType = nameParts.slice(i + 1).join("");
				for (let j = 0; j < schema.type.length; j++) {
					const curType = schema.type[j];
					if (curType.code.toLowerCase() == expectedType.toLowerCase()) { // toLowerCase to deal with primitives being lowercase
						fhirType = curType.code;
						type = curType;
						typeIdx = j;
					}
				}
				if (!fhirType) {
					console.log(`Error: expected to find FHIR type ${expectedType} as a possible type for ${trueSchemaPath}`);
					return;
				}
				// //allow for complex type multi-types
				// if (!profiles[fhirType]) { 
				// 	fhirType = fhirType[0].toLowerCase() + fhirType.slice(1);
				// }
				// displayName = buildDisplayName(schemaPath, fhirType);
			}
		}
	}
	if (!schema) {
		console.log(`Error reading element of type ${schemaPath} with value ${valueOfNode}`);
		return;
	}

	// Check if this element is a reference to another definition (replaces the definition)
	if (schema.refSchema) {
		trueSchemaPath = schema.refSchema;
		// schema = profiles[profileUri]?.[trueSchemaPath];
	}

	// Check if a new profile should be used for this element
	const newProfile = getProfileOfSchemaDef(profiles, schema, schema.type[typeIdx]);
	const childSchemaPath = newProfile ? fhirType : trueSchemaPath;
	const childProfile = newProfile ?? profileUri;
	// TODO: Figure out which type of the array this node corresponds to
	const displayName = buildDisplayName(name, schema.sliceName);
	// if (isInfrastructureType(fhirType) && (schemaPath.length === 1)) {
	// 	fhirType = schemaPath[0];
	// }

	// //contentReference and nameReference support
	// if (schema?.refSchema) {
	// 	schemaPath = schema.refSchema.split(".");
	// 	const refSchema = profiles[schemaPath[0]]?.[schemaPath.join(".")];
	// 	fhirType = refSchema?.type?.[0]?.code;
	// }




	const decorated: SageNodeInitialized = {
		id: nextId++,
		index: schema?.index || 0,
		name,
		nodeType: schema.type[typeIdx].code[0] != schema.type[typeIdx].code[0].toUpperCase() ? "value" : "object", // naive way of checking if valueOfNode should be a primitive
		displayName,
		nodePath: trueSchemaPath,
		schemaPath: childSchemaPath,
		fhirType,
		type,
		level,
		short: schema?.short,
		sliceName: schema?.sliceName,
		isRequired: schema?.min >= 1 || presentedInCardEditor(name, profileUri),
		binding: schema?.binding,
		profile: childProfile,
		children: [],
	};

	const {
		isFixed,
		defaultValue
	} = getDefaultValue(schema, fhirType);
	decorated.isFixed = isFixed;
	decorated.defaultValue = defaultValue;

	if (schema?.min !== undefined) {
		decorated.range = [schema?.min, schema?.max];
	}

	//hide resourceType item
	if (name === "resourceType") {
		decorated.hidden = true;
	}

	// //restart schema for complex types
	// if (isComplexType(fhirType) && !isInfrastructureType(fhirType)) {
	// 	schemaPath = [fhirType];
	// }

	//this is a little sloppy, but simplifies blob rendering
	if ((fhirType === "Attachment") && valueOfNode.contentType && valueOfNode.data) {
		decorated.contentType = valueOfNode.contentType;
	}

	// If the element is an array, we set this SageNode as an array container (objectArray or valueArray)
	//  and create a SageNode per item as children
	if (valueOfNode instanceof Array && decorated.range && (decorated.range[1] !== "1")) {
		decorated.children = ((() => {
			const result = [];

			for (i = 0; i < valueOfNode.length; i++) {
				v = valueOfNode[i];
				const childResult = walkNode(profiles, v, childProfile, childSchemaPath, level + 1, true);
				if (childResult) {
					result.push(childResult);
				}
			}

			return result;
		})());
		decorated.nodeType = fhirType && isComplexType(fhirType) ?
			"objectArray"
			//unknown object arrays
			: !fhirType && (typeof valueOfNode?.[0] === "object") ?
				"objectArray"
				:
				"valueArray";

	} else if ((decorated.nodeType == 'object') &&
		!(valueOfNode instanceof Array) &&
		!(valueOfNode instanceof Date)) {
		decorated.nodeType = schema && (schema.max !== "1") ? "arrayObject" : "object";
		decorated.children = ((() => {
			const result1 = [];

			for (const k in valueOfNode) {
				v = (valueOfNode as any)[k];
				const childPath = `${childSchemaPath}.${k}`;
				const walkRes = walkNode(profiles, v, childProfile, childPath, level + 1);
				if (walkRes != null && walkRes != undefined) {
					result1.push(walkRes);
				}
			}

			return result1;
		})());
		decorated.children = decorated.children.sort((a, b) => a.index - b.index);

	} else {
		//some servers return decimals as numbers instead of strings
		//which, of course, don't validate.
		//This is very hacky - and arbitrarily sets precision
		//need a better approach.
		let error;
		if ((fhirType === "decimal") && (valueOfNode !== "")) {
			valueOfNode = parseFloat(valueOfNode).toString();
			if (valueOfNode.indexOf(".") === -1) {
				valueOfNode += ".0";
			}
		}

		decorated.value = decorated.isFixed ? decorated.defaultValue : valueOfNode;

		//check if value has a cardinality of > 1 and isn't in an array
		if (decorated.range?.[1] && (decorated.range[1] !== "1") && !inArray) {
			console.log('what is this?', decorated);
			// decorated.fhirType = null;
		}

		//check if value has a cardinality of 1 and is in an array
		if (valueOfNode instanceof Array && (decorated.range?.[1] === "1")) {
			// TODO: figure out what this is for
			//console.log('what is this? 2', decorated);
			// decorated.fhirType = null;
		}
		decorated.ui = {
			status: "editing"
		};
		if (fhirType && (error = PrimitiveValidator(fhirType, valueOfNode))) {
			decorated.ui = { validationErr: error, status: "editing" };
		}
	}

	return decorated;
};

export const decorateFhirData = function (profiles: SimplifiedProfiles, resource: SageSupportedFhirResource): SageNodeInitialized | undefined {
	// console.log('decorateFhirData', profiles, resource);
	const resourceProfile = getProfileOfResource(profiles, resource);
	if (!resourceProfile) {
		console.log(`No suitable profile exists in SAGE for ${resource.resourceType} -- skipping`);
		return;
	}
	
	// Create root node first
	const rootProfileSchema = profiles[resourceProfile]; // This is the schema of the profile
	const rootPath = resource.resourceType; // This path gives you the schema of the Resource itself
	const type = rootProfileSchema[rootPath].type[0];
	const decorated: SageNodeInitialized = {
		id: nextId++,
		index: rootProfileSchema[rootPath].index,
		name: "root node",
		nodeType: "resource",
		displayName: buildDisplayName(rootPath, rootProfileSchema[rootPath].sliceName), // Possibly change to .title?
		nodePath: rootPath,
		schemaPath: rootPath,
		sliceName: rootProfileSchema[rootPath].sliceName,
		fhirType: type.code,
		type: type,
		level: 0, // Visually, this fhirNode should be the only one on-screen when selected
		short: rootProfileSchema[rootPath].short,
		isRequired: rootProfileSchema[rootPath].min >= 1,
		binding: rootProfileSchema[rootPath].binding,
		profile: resourceProfile,
		children: [],
	};

	// Add a 'meta' element (if one doesn't exist) to keep track of the Resource's profile
	if (!resource.meta?.profile) {
		// note: if the resource is already frozen in State without a meta element (possible when importing a bundle) 
		//  it becomes immutable, so we modify a copy of it:
		resource = {
			...resource,
			meta: {
				...resource.meta,
				profile: [resourceProfile],
			}
		}
	}

	decorated.children = createChildrenFromJson(profiles, decorated, resource);
	decorated.children = decorated.children.sort((a, b) => a.index - b.index);
	console.log('end decoratefhirdata: ', decorated);
	return decorated;
};

const uvCode = "uv";
const cpgCode = "cpg";
const ipsCode = "ips";


export function makeProfile(resource: FriendlyResourceProps | string): string {

	if (typeof (resource) !== 'string' && resource.DEFAULT_PROFILE_URI ) {
		return resource.DEFAULT_PROFILE_URI;
	}

	return linkPrefix + "/" + uvCode + "/" + cpgCode + "/" + STRUCTURE_DEFINITION + "/" + cpgCode + "-"
		+ (resource as string).toLowerCase()
}

export function makeValueSetURL(resource: FriendlyResourceProps): string {

	return linkPrefix + "/" + uvCode + "/" + ipsCode + "/" + VALUE_SET + "/" + (resource.FHIR).toLowerCase()
}

// Temporary unique id gen
export function incrementNextId() {
	return nextId++;
}

// Returns the resource type of the node or null if the node is not a resource
export function getResourceType(node: SageNodeInitialized): string | null {
	if (node.nodeType === "resource") {
		return node.schemaPath;
	}
	return null;
}

export interface SageCodeConcept {
	system: string,
	code: string,
	display?: string,
	version?: string,
	definition?: string,
}
// Based off of rules at https://www.hl7.org/fhir/valueset.html
export async function getConceptsOfValueSet(valueSet: ValueSet, valueSetDefs: SimplifiedValuesets, codeSystemDefs: SimplifiedCodesystems): Promise<SageCodeConcept[]> {
	function warningText(reason: string) {
		return `Warning: Tried to get codes of valueset "${valueSet.url ?? "[no url found in valueset]"}", but ${reason}`;
	}
	
	const codesOfValueSet: SageCodeConcept[] = [];
	
	if (valueSet.compose === undefined) {
		// TODO: ValueSets may have codes listed under "expansion"
		// From spec: "The ValueSet resource can carry either the .compose or the .expansion, both of them, or neither of them (if only the metadata is being represented)."
		console.log(warningText(`no "compose" element was defined for it`));
		return [];
	}

	for (const include of valueSet.compose.include) {
		if (include.valueSet) {
			for (const vsUrl of include.valueSet) {
				if (vsUrl in valueSetDefs) {
					codesOfValueSet.concat(await getConceptsOfValueSet(valueSetDefs[vsUrl].rawElement, valueSetDefs, codeSystemDefs));
				}
			}
		}
		if (include.system) {
			if (include.concept) {
				// Add only the codes listed in `include.concept` (from `include.system`)
				const codeSystemDef = codeSystemDefs[include.system];
				codesOfValueSet.push(
					...include.concept.map(concept => {
						return {
							// Why is this error showing up? Isn't include.system known to be defined due to an earlier condition?
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							system: include.system!,
							code: concept.code,
							display: concept.display,
							version: codeSystemDef?.version,
						}
					})
				)
			}
			else if (include.filter && include.system == "http://snomed.info/sct") {
				let filteredElements: SageCodeConcept[] = [];
				let firstFilter = true;
				for (const filter of include.filter) {
					if (filter.property === "concept") {
						const codes = await Bioportal.searchForSNOMEDConcept(filter.value);
						if (firstFilter) {
							filteredElements.push(...codes);
						}
						else {
							filteredElements.filter(v => codes.some(code => code.code === v.code));
						}
					}
					else {
						console.log(warningText(`SAGE only supports filtering based on SNOMEDCT concepts. Some codes may be missing`));
						filteredElements = [];
						break;
					}
					firstFilter = false;
				}
				codesOfValueSet.push(...filteredElements)
			}
			else {
				if (include.filter) {
					console.log(warningText(`SAGE only supports "include.filter" for SNOMEDCT. Some codes may be missing`));
				}
				// Add everything from system
				const codeSystemDef = codeSystemDefs[include.system];
				if (codeSystemDef) {
					if (codeSystemDef.concept) {
						codesOfValueSet.push(
							...codeSystemDef.concept.map(concept => {
								return {
									// Why is this error showing up? Isn't include.system known to be defined due to an earlier condition?
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
									system: include.system!,
									code: concept.code,
									display: concept.display,
									version: codeSystemDef.version,
									definition: concept.definition,
								}
							})
						)
					}
					else {
						console.log(warningText(`included system "${include.system}" has no "concept" element`));
					}
				}
				else {
					console.log(warningText(`SAGE has no codes stored for included system "${include.system}"`));
				}
			}
		}
	}
	return codesOfValueSet;
}