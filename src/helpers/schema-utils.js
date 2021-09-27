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

//TODO: break up this module

let nextId = 0;

const isComplexType = fhirType => fhirType &&
    (fhirType[0] === fhirType[0].toUpperCase());

const isInfrastructureType = fhirType => ["DomainResource", "Element", "BackboneElement"].includes(fhirType);

const unsupportedElements = [];

export var toFhir = function(decorated, validate) {
	let errCount = 0;
	// console.log JSON.stringify decorated, null, "  "
	var _walkNode = function(node, parent) {
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
				
				if (err) { errCount++; }
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
	if (validate) {
		return [fhir, errCount];
	} else {
		return fhir;
	}
};


export var toBundle = (resources, pos, resource) => resource;

// getAllowedReferences: (schemaPath) ->

export var getElementChildren = function(profiles, schemaPath, excludePaths) {
	if (excludePaths == null) { excludePaths = []; }
	const _buildChild = (name, schema, typeCode) => {
		return {
			schemaPath: schema.path,
			name,
			displayName: this.buildDisplayName(schema.path.split("."), typeCode),
			index: schema.index,
			isRequired: schema.min >=1,
			fhirType: typeCode,
			short: schema.short,
			range: [schema.min, schema.max],
			nodeType: isComplexType(typeCode) ?
				schema.max !== "1" ? "objectArray" : "object"
			:
				schema.max !== "1" ? "valueArray" : "value"
		};
	};

	const _buildMultiTypePermutations = function(schema) {
		const permutations = [];
		for (let type of Array.from(schema.type)) {
			const capType = type.code[0].toUpperCase() + type.code.slice(1);
			const name = schema.path.split(".").pop().replace("[x]", capType);
			permutations.push(_buildChild(name, schema, type.code));
		}
		return permutations;
	};

	const _isMultiType = schemaPath => path.indexOf("[x]") > -1;

	let children = [];
	const schemaRoot = schemaPath.split(".").shift();
	const level = schemaPath.split(".").length;

	const object = profiles[schemaRoot] || {};
	for (var path in object) {

		const schema = object[path];
		if (Array.from(excludePaths).includes(path) ||
			(path.indexOf(schemaPath) === -1) ||
			(path.split(".").length !== (level+1))) { continue; }

		if (schema?.nameReference) {
			schemaPath = schemaPath.split(".").shift() + "." + schema.nameReference;
		}

		if (_isMultiType(path)) {
			children = children.concat(_buildMultiTypePermutations(schema));
		} else {
			const name = schema.path.split(".").pop();
			if (!Array.from(unsupportedElements).includes(name)) {
				const type = schema?.type?.[0]?.code || "BackboneElement";
				children.push(_buildChild(name, schema, type));
			}
		}
	}

	return children = children.sort((a, b) => a.index - b.index);
};


export var buildChildNode = function(profiles, parentNodeType, schemaPath, fhirType) {

	const _addRequiredChildren = (parentNodeType, schemaPath, fhirType) => {

		if (isComplexType(fhirType) && !isInfrastructureType(fhirType)) {
			schemaPath = fhirType;
		}

		const children = this.getElementChildren(profiles, schemaPath);

		const reqChildren = [];
		for (let child of Array.from(children)) {
			if (child.isRequired) {
				reqChildren.push(this.buildChildNode(profiles, parentNodeType, child.schemaPath, child.fhirType));
			}
		}
		return reqChildren;
	};

	const _getDefaultValue = (schema, fhirType) => {
		// This naming convention for fixed values is from the FHIR spec for "Element Definition"
		const fixedTypeName = "fixed" + fhirType[0].toUpperCase() + fhirType.substring(1);
		if (fixedTypeName in schema.rawElement) {
			return {
				isFixed: true,
				defaultValue: schema.rawElement[fixedTypeName],
			}
		}
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
					defaultValue = State.get().CPGName;
				}
				break;
			case "publisher":
				if (State.get().authorName != "") {
					defaultValue = State.get().authorName;
				}
				break;
			case "url":
				if (State.get().authorName != "" && State.get().CPGName != "") {
					defaultValue = `http://fhir.org/guides/${State.get().authorName}/${pathSuffix[0]}/${pathSuffix[0]}-${State.get().CPGName}`;
				}
				break;
		}
		
		return {
			isFixed: false,
			defaultValue,
		}
	}

	schemaPath = schemaPath.split(".");
	let name = schemaPath[schemaPath.length-1];
	const schema = profiles[schemaPath[0]]?.[schemaPath.join(".")];

	if (schema?.nameReference) {
			schemaPath = [schemaPath[0], schema.nameReference];
		}

	if (name.indexOf("[x]") > -1) {
		const capType = fhirType[0].toUpperCase() + fhirType.slice(1);
		name = schema.path.split(".").pop().replace("[x]", capType);
	}

	if ((schema.max !== "1") && !["valueArray", "objectArray"].includes(parentNodeType)) {
		return {
			id: nextId++, name, index: schema.index,
			schemaPath: schemaPath.join("."), fhirType,
			displayName: this.buildDisplayName(schemaPath, fhirType),
			nodeType: isComplexType(fhirType) ? "objectArray" : "valueArray",
			short: schema.short,
			nodeCreator: "user",
			isRequired: schema.min >=1,
			range: [schema.min, schema.max],
			children:  isComplexType(fhirType) ?
				[this.buildChildNode(profiles, "objectArray", schemaPath.join("."), fhirType)]
			:
				[this.buildChildNode(profiles, "valueArray", schemaPath.join("."), fhirType)]
		};

	} else {
		const {
			isFixed,
			defaultValue
		} = _getDefaultValue(schema, fhirType);
		const result = {
			id: nextId++, name, index: schema.index,
			schemaPath: schemaPath.join("."), fhirType,
			displayName: this.buildDisplayName(schemaPath, fhirType),
			isRequired: schema.min >=1,
			short: schema.short,
			nodeCreator: "user",
			isFixed,
			value: defaultValue,
			range: [schema.min, schema.max],
			binding: schema?.binding,
			nodeType: isComplexType(fhirType) && (parentNodeType === "objectArray") ?
				"arrayObject"
			: isComplexType(fhirType) ?
				"object"
			:
				"value"
		};
		if (isComplexType(fhirType)) {
			result.children = _addRequiredChildren(result.nodeType,
				result.schemaPath, result.fhirType);
		}

		return result;
	}
};


export var buildDisplayName = function(schemaPath, fhirType) {
	const _fixCamelCase = function(text, lowerCase) {
		//function has an issue with consecutive capital letters (eg. ID)
		//and not convinced splitting camelcase words has value
		//so bypassing for now and just capitalizing first letter
		if (!lowerCase) {
			text = text[0].toUpperCase() + text.slice(1);
		}
		return text;
	};

	const name = schemaPath[schemaPath.length-1];
	if (name.indexOf("[x]") > -1) {
		return _fixCamelCase(name.replace(/\[x\]/,"")) +
			" (" + _fixCamelCase(fhirType, true) + ")";
	} else {
		return _fixCamelCase(name);
	}
};


export var isResource = function(profiles, data) {
	if (data.resourceType &&
		profiles[data.resourceType]) {
			return true;
		}
};


export var decorateFhirData = function(profiles, data) {
	nextId = 0;

	var _walkNode = (dataNode, schemaPath, level, inArray) => {
		//root node
		let resourceType;
		let i, v;
		if (level == null) { level = 0; }
		if (resourceType = dataNode.resourceType) {
			schemaPath = [resourceType];
		}

		const name = schemaPath[schemaPath.length-1];
		let displayName = this.buildDisplayName(schemaPath, null);
		let schema = profiles[schemaPath[0]]?.[schemaPath.join(".")];
		let fhirType = schema?.type?.[0]?.code;

		if (isInfrastructureType(fhirType) && (schemaPath.length === 1)) {
			fhirType = schemaPath[0];
		}

		//contentReference and nameReference support
		if (schema?.refSchema) {
			schemaPath = schema.refSchema.split(".");
			const refSchema = profiles[schemaPath[0]]?.[schemaPath.join(".")];
			fhirType = refSchema?.type?.[0]?.code;
		}

		//is it a multi-type?
		if (!fhirType) {
			const nameParts = schemaPath[schemaPath.length-1].split(/(?=[A-Z])/);
			let testSchemaPath = schemaPath.slice(0,schemaPath.length-1).join(".") + ".";
			for (i = 0; i < nameParts.length; i++) {
				var testSchema;
				const namePart = nameParts[i];
				testSchemaPath += `${namePart}`;
				if (testSchema = profiles[schemaPath[0]]?.[`${testSchemaPath}[x]`]) {
					schema = testSchema;
					schemaPath = testSchema.path.split(".");
					fhirType = nameParts.slice(i+1).join("");
					//allow for complex type multi-types
					if (!profiles[fhirType]) {
						fhirType = fhirType[0].toLowerCase() + fhirType.slice(1);
					}
					displayName = this.buildDisplayName(schemaPath, fhirType);
				}
			}
		}

		const decorated = {
			id: nextId++, index: schema?.index || 0,
			name, nodeType: "value", displayName,
			schemaPath: schemaPath.join("."), fhirType, level,
			short: schema?.short, isRequired: schema?.min && (schema.min >=1),
			binding: schema?.binding
		};
		

		if (schema?.min !== undefined) {
			decorated.range = [schema?.min, schema?.max];
		}

		//hide resourceType item
		if (name === "resourceType") {
			decorated.hidden = true;
		}

		//restart schema for complex types
		if (isComplexType(fhirType) && !isInfrastructureType(fhirType)) {
			schemaPath = [fhirType];
		}

		//this is a little sloppy, but simplifies blob rendering
		if ((fhirType === "Attachment") && dataNode.contentType && dataNode.data) {
			decorated.contentType = dataNode.contentType;
		}

		if (dataNode instanceof Array && decorated.range && (decorated.range[1] !== "1")) {
			decorated.children = ((() => {
				const result = [];
				
				for (i = 0; i < dataNode.length; i++) {
					v = dataNode[i];
					result.push(_walkNode(v, schemaPath, level+1, true));
				}
			
				return result;
			})());
			decorated.nodeType = fhirType && isComplexType(fhirType) ?
				"objectArray"
			//unknown object arrays
			: !fhirType && (typeof dataNode?.[0] === "object") ?
				"objectArray"
			:
				"valueArray";

		} else if ((typeof dataNode === "object") && 
			!(dataNode instanceof Array) &&
			!(dataNode instanceof Date)) {
				decorated.nodeType = schema && (schema.max !== "1") ? "arrayObject" : "object";
				decorated.children = ((() => {
					const result1 = [];
					
					for (let k in dataNode) {
						v = dataNode[k];
						result1.push(_walkNode(v, schemaPath.concat(k), level+1));
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
			if ((fhirType === "decimal") && (dataNode !== "")) {
				dataNode = parseFloat(dataNode).toString();
				if (dataNode.indexOf(".") === -1) {
					dataNode += ".0";
				}
			}

			decorated.value = dataNode;

			//check if value has a cardinality of > 1 and isn't in an array
			if (decorated.range?.[1] && (decorated.range[1] !== "1") && !inArray) {
				decorated.fhirType = null;
			}

			//check if value has a cardinality of 1 and is in an array
			if (dataNode instanceof Array && (decorated.range?.[1] === "1")) {
				decorated.fhirType = null;
			}

			if (fhirType && (error = PrimitiveValidator(fhirType, dataNode))) {
				decorated.ui = {validationErr: error, status: "editing"};
			}
		}

		return decorated;
	};


	// console.log JSON.stringify _walkNode(data), null, "  "
	return _walkNode(data);
};

