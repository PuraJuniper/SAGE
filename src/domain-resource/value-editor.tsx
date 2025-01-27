/* eslint-disable react/no-string-refs */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";

import State, { SageNodeInitializedFreezerNode } from "../state";
import PrimitiveValidator from "../helpers/primitive-validator";
import * as SchemaUtils from "../helpers/schema-utils";

interface ValueEditorProps {
	node: SageNodeInitializedFreezerNode,
	errFields: string[],
	parent: SageNodeInitializedFreezerNode,
	onEditCommit: (e?: React.SyntheticEvent) => void,
	onNodeDelete: (e?: React.SyntheticEvent) => void,
	onEditCancel: (e?: React.SyntheticEvent) => void,
	hasFocus: boolean,
	required: boolean,
	shortName: string,
}
class ValueEditor extends React.Component<ValueEditorProps, Record<string, never>> {
	ESC_KEY: number;
	ENTER_KEY: number;
	TAB_KEY: number;
	inputField: React.RefObject<HTMLInputElement>;

	constructor(props: ValueEditorProps) {
		super(props);

		// this.prototype.displayName = "ValueEditor";
	
		this.ESC_KEY = 27;
		this.ENTER_KEY = 13;
		this.TAB_KEY = 9;

		this.inputField = React.createRef();
	}

	shouldComponentUpdate(nextProps: ValueEditorProps) {
		return nextProps.node !== this.props.node || nextProps.errFields !== this.props.errFields;
	}

	componentDidMount() {
		if (this.props.hasFocus && this.inputField.current) {
			const domNode = this.inputField.current;
			domNode.focus();
			if (domNode.setSelectionRange) {
				domNode.setSelectionRange(domNode.value.length, domNode.value.length);
			}
		}

		if (this.props.node.fhirType === "xhtml") {
			//remove blank lines
			if (this.props.node.value) {
				const newValue = this.props.node.value.replace(/^\s*[\r\n]/gm, "");
				State.emit("value_change", this.props.node, newValue);
			}
		}

		if ((this.props.node.fhirType === "code") &&
			(this.props.node?.binding?.strength === "required")) {
				//initialize to first value on insert
				const {
                    reference
                } = this.props.node.binding;
				const vs = State.get().valuesets[reference];
				// if (vs) {
				// 	const firstConcept = SchemaUtils.getConceptsOfValueSet(vs.rawElement, State.get().valuesets, State.get().codesystems).at(0);
				// 	let defaultValue = "";
				// 	if (firstConcept?.code) {
				// 		defaultValue = firstConcept.code;
				// 	}
				// 	return State.emit("value_change", this.props.node, defaultValue);
				// }
			}
	}

	handleChange(e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) {
		let resources;
		let isInvalid = this.isValid(this.props.node.fhirType, e.target.value);
		if (!isInvalid) {
			if ((this.props.node.fhirType === "id") && 
					(this.props.node.level === 1) && (resources = State.get().bundle?.resources)) {
				for (let i = 0; i < resources.length; i++) {
					const resource = resources[i];
					const idNode = SchemaUtils.getChildOfNode(resource, "id");
					if (idNode && (idNode.value === e.target.value) && (i !== State.get().bundle.pos)) {
						isInvalid = "This id is already used in the bundle.";
					}
				}
			}
		}
		return State.emit("value_change", this.props.node, e.target.value, isInvalid);
	}

	handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
		if (e.key == "Escape") {
			return this.props.onEditCancel(e);
		} else if (e.key == "Enter") {
				return this.props.onEditCommit(e);
		} else if ((e.key == "Tab") &&
			(this.props.node.fhirType === "xhtml")) {
				//bug where selection will jump to end of string
				//http://searler.github.io/react.js/2014/04/11/React-controlled-text.html
				e.preventDefault();
				const newValue = e.currentTarget.value.substring(0, e.currentTarget.selectionStart || undefined) + "\t" + 
					e.currentTarget.value.substring(e.currentTarget.selectionEnd || 0);
				return e.currentTarget.value = newValue;
			}
	}
 
	isValid(fhirType: string, value: string) {
		return PrimitiveValidator(fhirType, value);
	}

	renderString(value: string) {
		const inputField = this.buildTextInput((value||"").toString()); 
		return this.wrapEditControls(inputField);
	}

	renderUri(value: string) {
		const inputField = this.buildTextInput((value||"").toString()); 
		return this.wrapEditControls(inputField);
	}

	renderCanonical(value: string) {
		console.log('render canonical value is ', value);
		const inputField = this.buildCanonicalInput(value);
		return this.wrapEditControls(inputField);
	}

	renderCode(value: string) {
		//TODO: handle "preferred" and "extensible"
		let inputField;
		if (this.props.node?.binding?.strength === "required") {
			const {
                reference
            } = this.props.node.binding;
			const vs = State.get().valuesets[reference].toJS();
			// if (vs) {
			// 	const concepts = SchemaUtils.getConceptsOfValueSet(vs.rawElement, State.get().valuesets, State.get().codesystems).map<[string, string]>(concept=>[concept.display ?? concept.code, concept.code]);
			// 	if (concepts) {
			// 		inputField =  this.buildCodeInput(value, concepts);
			// 	}
			// }
		}

		if (!inputField) { inputField = this.buildTextInput(value||""); }
		return this.wrapEditControls(inputField);
	}

	renderLongString(value: string) {
		const inputField = this.buildTextAreaInput((value||"").toString()); 
		return this.wrapEditControls(inputField);
	}

	renderBoolean(value: boolean) {
		const inputField = this.buildBooleanInput(value);
		return this.wrapEditControls(inputField);
	}

	buildBooleanInput(value: boolean) {
		const bool = State.get().author.authorings[State.get().author.pos].experimental;
		if (this.props.node.name === "experimental") {
			console.log(this.props.node.value);
			return <span>
			<select value={this.props.node.value} 
				className="form-control input-sm" 
					onChange={this.handleChange.bind(this)} 
					ref="inputField"
				>
				<option value={"false"}>No</option>
				<option value={"true"}>Yes</option>
			</select>
		</span>;	
		}
		return <span>
			<select value={this.props.node.value} 
				className="form-control input-sm" 
					onChange={this.handleChange.bind(this)} 
					ref="inputField"
				>
				<option value={"true"}>Yes</option>
				<option value={"false"}>No</option>
			</select>
		</span>;
	}

	buildCanonicalInput(value: string) {
		const targetProfiles = this.props.node.type.targetProfile;
		if (targetProfiles === undefined) {
			return this.buildTextInput((value||""));
		}
		const targetResourceTypes: string[] = [];
		for (const targetProfile of targetProfiles) {
			// This is technically incorrect since it's not always true that two FHIR resources with the same resourceType
			//  comply with the same profile (targetProfile here)
			const resourceType = State.get().profiles[targetProfile]?.__meta.type;
			if (resourceType) {
				targetResourceTypes.push(resourceType);
			}
			else {
				console.log(`Warning -- Could not find definition for definitionCanonical targetProfile ${targetProfile}`)
			}
		}

		const selectedResourceUri = this.props.node.value ?? "";
		const nodeSchemaPath = this.props.node.schemaPath.substring(this.props.node.schemaPath.indexOf(".") + 1);
		const val = this.props.node.value ?? "Blank";
		const errFields = this.props.errFields;
		let style = {};
		if (errFields && errFields.includes(nodeSchemaPath) && val == "Blank") {
			style = {backgroundColor:"#ff9393"};
		}

		return <span>
			<select value={selectedResourceUri} 
				data-testid="select-DefinitionCanonical"
					className="form-control input-sm" 
					onChange = {(e) => {
						if (e.target.value != "[[Select]]") {
							e.target.style.backgroundColor = "white";
							const newResource = SchemaUtils.buildNewFhirResource(e.target.value, true);
							this.props.node.set("value", newResource.url);
							this.props.onEditCommit();
							State.emit("insert_resource_into_bundle", newResource);
						}
						else {
							State.emit("show_canonical_dialog", this.props.node, targetResourceTypes);
						}
					}}
					ref="inputField"
					style={style}
				>
				<option value={selectedResourceUri} disabled>{selectedResourceUri || "Select:"}</option>
					{targetResourceTypes.map((v) => {
						return <option key={v} value={v}>{`Create a new ${v}`}</option>
					})}
				<option value='[[Select]]'>Select an existing resource...</option>
			</select>
		</span>;
	}

	buildCodeInput(value: string, items: [string, string][]) {
		// console.log("buildCodeInput", value, items);
		const options = [];
		// const fields = []; //valueCode
		const statusfields = []; //status
		const status = State.get().author.authorings[State.get().author.pos].status;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			options.push(<option key={item[1]} value={item[1]}>
				{item[0]} ({item[1]})
			</option>
			);
		}
		// for (let i = 0; i < items.length; i++) {
		// 	const item = items[i];
		// 	options.push(<option key={item[1]} value={item[1]}>
		// 		{item[0]} ({item[1]})
		// 	</option>
		// 	);
		// }
		// for (let i = 1; i < items.length; i++) {
		// 	const item = items[i];
		// 	fields.push(<option key={item[2]} value={item[2]}>
		// 		{item[0]} ({item[1]})
		// 	</option>
		// 	);
		// }
		// const option = items[0];
		// 	fields.push(<option key={option[1]} value={option[1]}>
		// 		{option[0]} ({option[1]})
		// </option>);
		// let i = 1;
		// if (this.props.node.name === "status") {
		// 	i = status;
		// }
		// for (i; i < items.length; i++) {
		// 	const item = items[i];
		// 	statusfields.push(<option>
		// 	{item[0]} ({item[1]})
		// 	</option> );
		// 	fields.push(<option>
		// 		{item[0]} ({item[1]})
		// 	</option> );
		// }
		// const option = items[0];
		// 	fields.push(<option key={option[1]} value={option[1]}>
		// 		{option[0]} ({option[1]})
		// </option>);
		// for (i = 0; i < status; i++) {
		// 	const pop = items[i];
		// 	statusfields.push(<option key={pop[1]} value={pop[1]}>
		// 		{pop[0]} ({pop[1]})
		// 	</option> );
		// }
		const lists = options;
		// if (this.props.node.name === "valueCode") {
		// 	lists = fields;
		// }
		// if (this.props.node.name === "status") {
		// 	lists = statusfields;
		// }
		return <span>
			<select value={this.props.node.value || ""} 
				className="form-control input-sm" 
				onChange={(e) => {
					this.handleChange.bind(this)(e);
				}}
				ref="inputField"
				>
				{lists}
			</select>
		</span>;		
	}

	buildTextAreaInput(value: string) {
		let xhtmlClass;
		if (this.props.node.fhirType === "xhtml") {
			xhtmlClass = " fhir-xhtml-edit";
		}

		return <textarea 
			ref="inputField"
			className={"form-control input-sm" + (xhtmlClass||"")}
			onChange={this.handleChange.bind(this)}
			onKeyDown={this.handleKeyDown.bind(this)}
			value={value}
		/>;
	}

	buildTextInput(value: string) {
		const nodeSchemaPath = this.props.node.schemaPath.substring(this.props.node.schemaPath.indexOf(".") + 1);
		const errFields = this.props.errFields;
		let style = {};
		if (errFields && errFields.includes(nodeSchemaPath) && value == "") {
			style = {backgroundColor:"#ff9393"};
		}
		return <input 
			ref="inputField"
			className="form-control input-sm"
			value={value}
			onChange={(e) => {
				e.target.style.backgroundColor = "white";
				this.handleChange.bind(this)(e);
			}}
			onKeyDown={this.handleKeyDown.bind(this)}
			style={style}
		/>;
	}

	buildCommitButton() {
		let disabled = false;
		if ([null, undefined, ""].includes(this.props.node.value) || 
			this.props?.node?.ui?.validationErr) {
				disabled = true;
			}	
		if (disabled) {
			return undefined
		}

		const commitButtonClassName = "btn btn-default btn-sm";
		return <button type="button" 
			className={commitButtonClassName} 
			onClick={this.props.onEditCommit}
		>
			<span className="fas fa-check"></span>
		</button>;
	}

	buildDeleteButton(disabled: boolean) {
		return <button type="button" 
			className="btn btn-default btn-sm" 
			onClick={this.props.onNodeDelete}
			disabled={disabled}
		>
			<span className="fas fa-trash-alt"></span>
		</button>;
	}

	wrapEditControls(inputField: JSX.Element, disableDelete?: boolean) {
		let commitButton, validationErr, validationHint;
		let groupClassName = "input-group";

		if ((validationErr = this.props?.node?.ui?.validationErr)) {
			groupClassName += " has-error";
			validationHint = <div className="help-block">{validationErr}</div>;
		}

		if (this.props.parent.nodeType === "valueArray") {
			groupClassName += " fhir-value-array-input";
		}

		if (this.props.parent.nodeType !== "valueArray") {
			commitButton = this.buildCommitButton();
		}

		return <div>
			<div className={groupClassName}>
				{inputField}
				<span className="input-group-btn">
					{commitButton}
					{this.buildDeleteButton(disableDelete || this.props.required)}
				</span>
			</div>
			<div className={validationErr ? "has-error" : undefined}>
				{validationHint}
			</div>
		</div>;
	}


	render() {
		const renderers: {[key: string]: (value: any) => JSX.Element} = { 
			boolean: this.renderBoolean, xhtml: this.renderLongString, 
			base64Binary: this.renderLongString, code: this.renderCode,
			uri: this.renderUri, canonical: this.renderCanonical
		};

		const renderer = renderers[this.props.node.fhirType || "string"] || this.renderString;

		const {
            value
        } = this.props.node;
		return renderer.call(this, value);
	}
}

export default ValueEditor;
