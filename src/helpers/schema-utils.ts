/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import State from '../state';
import PrimitiveValidator from './primitive-validator';
import { Bundle, Resource, Element, ElementDefinition, ElementDefinitionType } from 'fhir/r4';

import { defaultProfileUriOfResourceType } from '../config';

// Template of a SageNode for a specific element/resource
export type SageNode = {
	id?: number,
	index: number,
	name: string,
	// Internal types used by SAGE
	nodeType: 'value' | 'object' | 'objectArray' | 'arrayObject' | 'valueArray',
	displayName: string,
	// Path containing the definition in `profile` i.e. "PlanDefinition.action.description" or (for a top-level definition) "Extension"
	schemaPath: string,
	// Path relative to the nearest top-level definition i.e. "PlanDefinition.action.description" or "PlanDefinition.Extension" (often the same as schemaPath)
	nodePath: string, 
	fhirType: string,
	level?: number,
	sliceName: string,
	short: any, 
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

type ProfileDefs = {
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
	items: [string, string][],
	type: string,
}

export type SimplifiedValuesets = {
	[key: string]: ValuesetDef,
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

// Element names that will be skipped (will not appear in the "Add Element" dropdown)
const unsupportedElements: string[] = [];

export var toFhir = function(decorated: SageNodeInitialized, validate: boolean) {
	let errCount = 0;
	let errFields: string[] = [];
	var _walkNode = function(node: SageNodeInitialized, parent?: any) {
		if (parent == null) { parent = {}; }
		for (var child of Array.from(node.children)) {
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
					errFields.push(child.schemaPath.substring(child.schemaPath.indexOf(".") + 1));
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
	if (validate) {
		return [fhir, errCount, errFields];
	} else {
		return fhir;
	}
};


// export var toBundle = (resources, pos, resource) => resource;

// getAllowedReferences: (schemaPath) ->

// Build array of possible children from the schema for `node`
//  optionally excluding some paths (useful for building the dropdown of available elements to add)
export var getElementChildren = function(profiles: SimplifiedProfiles, node: SageNode, nodePathsToExclude: string[]) : SageNode[] {
	if (nodePathsToExclude == null) { nodePathsToExclude = []; }
	const _buildChild = (name: string, childSchema: SchemaDef, typeDef: ElementDefinitionType) : SageNode => {
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
			displayName: buildDisplayName(name, typeDef.code, childSchema.sliceName),
			index: childSchema.index,
			isRequired: childSchema.min >=1,
			fhirType: typeDef.code,
			short: childSchema.short,
			range: [childSchema.min, childSchema.max],
			nodeType: isComplexType(typeDef.code) ?
				childSchema.max !== "1" ? "objectArray" : "object"
			:
				childSchema.max !== "1" ? "valueArray" : "value",
		};
	};

	const _buildMultiTypePermutations = function(schema: SchemaDef) : SageNode[] {
		const permutations: SageNode[] = [];
		for (let type of Array.from(schema.type)) {
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
			(path.split(".").length !== (level+1))) {
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

const getDefaultValue = (schema: SchemaDef, fhirType: string): {
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
	switch(fhirType) {
		case "boolean":
			defaultValue = fhirType === "boolean" ? true : null;
			break;
	}
	
	// Attempt to auto-populate URLs, Names, and Publishers, if possible
	const pathSuffix = schema.path.split('.');
	switch (pathSuffix[pathSuffix.length-1]) {
		case "name":
			if (State.get().CPGName != "") {
				defaultValue = `${State.get().CPGName}${State.get().resCount}`;
			}
			break;
		case "publisher":
			if (State.get().authorName != "") {
				defaultValue = State.get().authorName;
			}
			break;
		case "url":
			if (State.get().authorName != "" && State.get().CPGName != "") {
				// Ignore extensions
				if (pathSuffix[0] == "Extension") {
					break;
				}
				defaultValue = `http://fhir.org/guides/${State.get().authorName}/${pathSuffix[0]}/${pathSuffix[0]}-${State.get().CPGName}${State.get().resCount}`;
				// hard coded for activity definitions (temporarily)
				if (pathSuffix[0].endsWith("Activity")) {
					defaultValue = `http://fhir.org/guides/${State.get().authorName}/ActivityDefinition/ActivityDefinition-${State.get().CPGName}${State.get().resCount}`;
				}
			}
			break;
	}
	
	return {
		isFixed: false,
		defaultValue,
	}
}

export var buildChildNode = function(profiles: SimplifiedProfiles, parentNode: SageNodeInitialized, childNode: SageNode, fhirType: string): SageNodeInitialized {
	// Add required children of `parentNode2`
	const _addRequiredChildren = (parentNode2: SageNodeInitialized, fhirType: string) => {

		// if (isComplexType(fhirType) && !isInfrastructureType(fhirType)) {
		// 	schemaPath = fhirType;
		// }

		const children = getElementChildren(profiles, parentNode2, []);

		const reqChildren = [];
		for (let child of Array.from(children)) {
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
			displayName: buildDisplayName(name, fhirType, childNode.sliceName),
			nodeType: isComplexType(fhirType) ? "objectArray" : "valueArray",
			short: schema.short,
			nodeCreator: "user",
			isRequired: schema.min >=1,
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
		} = getDefaultValue(schema, fhirType);
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
			displayName: buildDisplayName(name, fhirType, childNode.sliceName),
			isRequired: schema.min >=1,
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


export var buildDisplayName = function(name: string, fhirType: string, sliceName?: string) {
	const _fixCamelCase = function(text: string, lowerCase?: boolean) {
		//function has an issue with consecutive capital letters (eg. ID)
		//and not convinced splitting camelcase words has value
		//so bypassing for now and just capitalizing first letter
		if (!lowerCase) {
			text = text[0].toUpperCase() + text.slice(1);
		}
		return text;
	};

	let displayName: string = name.split('.').pop() as string
	displayName = sliceName ? `${_fixCamelCase(displayName.replace(/\[x\]/,""))}:${sliceName}` : _fixCamelCase(displayName);
	if (name.indexOf("[x]") > -1) {
		displayName += " (" + _fixCamelCase(fhirType, true) + ")";
	}
	return displayName;
};

// checks if we have a default profile for this resource (without a profile, how do we know what fields exist?)
// and returns it if it exists in `profiles`
// TODO: check if another profile is given in Resource.meta
export var getProfileOfResource = function(profiles: SimplifiedProfiles, resource: Resource) : string | undefined {
	if (resource.meta?.profile && resource.meta.profile.length > 0) {
		return resource.meta.profile[0];
	}
	const defaultProfile = defaultProfileUriOfResourceType[resource.resourceType]
	if (defaultProfile && profiles[defaultProfile]) {
		return defaultProfile;
	}
	const standardPath = `http://hl7.org/fhir/StructureDefinition/${resource.resourceType}`;
	if (profiles[standardPath]) {
		return standardPath;
	}
};

// checks if the given object is a Resource
export var isResource = function(data: any) {
	if (data.resourceType) {
		return true;
	}
}

// checks if the SchemaNode uses a profile and returns its URI if so. 
// otherwise, it returns a default for that type or undefined if one doesn't exist (bad?)
var getProfileOfSchemaDef = function(profiles: SimplifiedProfiles, schemaNode: SchemaDef, typeDef?: ElementDefinitionType) : string | undefined {
	typeDef = typeDef || schemaNode.type[0];
	if (typeDef.profile) {
		return typeDef.profile[0];
	}
	else if (defaultProfileUriOfResourceType[typeDef.code]) {
		return defaultProfileUriOfResourceType[typeDef.code];
	}
	else if (profiles[`http://hl7.org/fhir/StructureDefinition/${typeDef.code}`]) {
		// skipping all types that start with a lowercase letter since they are primitives)
		if (isInfrastructureType(typeDef.code) 
		|| typeDef.code[0] != typeDef.code[0].toUpperCase()) {
				return;
			}	
		return `http://hl7.org/fhir/StructureDefinition/${typeDef.code}`;
	}
	else {
		console.log(`No default profile found for code: ${typeDef.code}`);
	}
}

export var decorateFhirData = function(profiles: SimplifiedProfiles, resourceProfile: string, resource: Resource) : SageNodeInitialized {
	nextId = 0;
	const addedUris = [];

	var _walkNode = (valueOfNode: any, profileUri: string, schemaPath: string, level: number | null, inArray?: boolean) : SageNodeInitialized | undefined => {
		// TODO: dataNode could be a Resource in a `contained` element
		// if ('resourceType' in dataNode) {
		// 	const resourceType = dataNode.resourceType;
		// }
		let i, v;
		if (level == null) {
			//root node
			level = 0;
		}

		let trueSchemaPath = schemaPath;
		let schema = profiles[profileUri]?.[trueSchemaPath];
		let typeIdx = 0; // Assuming 0
		let fhirType = schema?.type[typeIdx]?.code;
		//is it a multi-type?
		if (!schema) {
			const elementName = schemaPath.split('.').pop() as string;
			const nameParts = elementName.split(/(?=[A-Z])/);
			let testSchemaPath = schemaPath.split(".").slice(0,schemaPath.split(".").length-1).join(".") + ".";
			for (i = 0; i < nameParts.length; i++) {
				var testSchema;
				const namePart = nameParts[i];
				testSchemaPath += `${namePart}`;
				if (testSchema = profiles[profileUri]?.[`${testSchemaPath}[x]`]) {
					schema = testSchema;
					trueSchemaPath = `${testSchemaPath}[x]`;
					const expectedType = nameParts.slice(i+1).join("");
					for (var j=0;j<schema.type.length;j++) {
						const type = schema.type[j];
						if (type.code.toLowerCase() == expectedType.toLowerCase()) { // toLowerCase to deal with primitives being lowercase
							fhirType = type.code;
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
			if (!schema) {
				console.log(`Error reading element of type ${schemaPath} with value ${valueOfNode}`);
				return;
			}
		}

		// Check if a new profile should be used for this element
		const newProfile = getProfileOfSchemaDef(profiles, schema, schema.type[typeIdx]);
		const childSchemaPath = newProfile ? fhirType : trueSchemaPath;
		const childProfile = newProfile || profileUri;
		// TODO: Figure out which type of the array this node corresponds to
		const name = trueSchemaPath.split('.').pop() as string; // we know pop() will return a string here
		let displayName = buildDisplayName(name, fhirType, schema.sliceName);
		// if (isInfrastructureType(fhirType) && (schemaPath.length === 1)) {
		// 	fhirType = schemaPath[0];
		// }

		// //contentReference and nameReference support
		// if (schema?.refSchema) {
		// 	schemaPath = schema.refSchema.split(".");
		// 	const refSchema = profiles[schemaPath[0]]?.[schemaPath.join(".")];
		// 	fhirType = refSchema?.type?.[0]?.code;
		// }

		
		

		const decorated : SageNodeInitialized = {
			id: nextId++,
			index: schema?.index || 0,
			name, 
			nodeType: schema.type[typeIdx].code[0] != schema.type[typeIdx].code[0].toUpperCase() ? "value" : "object", // naive way of checking if valueOfNode should be a primitive
			displayName,
			nodePath: trueSchemaPath,
			schemaPath: childSchemaPath,
			fhirType, 
			level,
			short: schema?.short,
			sliceName: schema?.sliceName,
			isRequired: schema?.min >=1,
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
					const childResult = _walkNode(v, childProfile, childSchemaPath, level+1, true);
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
					
					for (let k in valueOfNode) {
						v = (valueOfNode as any)[k];
						if (v) {
							const childPath = `${childSchemaPath}.${k}`;
							var walkRes = _walkNode(v, childProfile, childPath, level+1);
							if (walkRes != null && walkRes != undefined) {
								result1.push(walkRes);
							}
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
				console.log('what is this? 2', decorated);
				// decorated.fhirType = null;
			}
			decorated.ui = {
				status: "editing"
			};
			if (fhirType && (error = PrimitiveValidator(fhirType, valueOfNode))) {
				decorated.ui = {validationErr: error, status: "editing"};
			}
		}

		return decorated;
	};

	// Create root node first
	let rootProfileSchema = profiles[resourceProfile]; // This is the schema of the profile
	let rootPath = resource.resourceType; // This path gives you the schema of the Resource itself
	const decorated : SageNodeInitialized = {
		id: nextId++,
		index: rootProfileSchema[rootPath].index,
		name: "root node",
		nodeType: "object",
		displayName: buildDisplayName(rootPath, "top level test", rootProfileSchema[rootPath].sliceName), // Possibly change to .title?
		nodePath: rootPath,
		schemaPath: rootPath,
		sliceName: rootProfileSchema[rootPath].sliceName,
		fhirType: rootProfileSchema[rootPath].type?.[0]?.code,
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

	decorated.children = ((() => {
		const result1 = [];
		
		for (let k in resource) {
			const v = (resource as any)[k];
			const childPath = `${rootPath}.${k}`;
			const childDef = rootProfileSchema[childPath];
			if (childDef) {
				const walkRes = _walkNode(v, resourceProfile, childPath, 1);
				if (walkRes) {
					result1.push(walkRes);
				}
			}
			// add else to check if childPath exists in another profile
		}
	
		return result1;
	})());
	decorated.children = decorated.children.sort((a, b) => a.index - b.index);
	return decorated;
};

