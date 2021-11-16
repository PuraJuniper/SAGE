/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import ReactDOM from "react-dom";

import State from "../state";
import PrimitiveValidator from "../helpers/primitive-validator";

class ValueEditor extends React.Component {
	static initClass() {
	
		this.prototype.displayName = "ValueEditor";
	
		this.prototype.ESC_KEY = 27;
		this.prototype.ENTER_KEY = 13;
		this.prototype.TAB_KEY = 9;
	}

	shouldComponentUpdate(nextProps) {
		return nextProps.node !== this.props.node || nextProps.errFields !== this.props.errFields;
	}

	componentDidMount() {
		if (this.props.hasFocus && this.refs.inputField) {
			const domNode = this.refs.inputField;
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
				if (vs && vs.type === "complete") {
					return State.emit("value_change", this.props.node, this.refs.inputField.value);
				}
			}
	}

	componentDidUpdate() {
		if ((this.props.node.fhirType === "code") &&
			(this.props.node?.binding?.strength === "required")) {
				//initialize to first value on insert
				const {
                    reference
                } = this.props.node.binding;
				const vs = State.get().valuesets[reference];
				if (vs && vs.type === "complete") {
					return State.emit("value_change", this.props.node, this.refs.inputField.value);
				}
			}
	}


	handleChange(e) {
		let resources;
		let isInvalid = this.isValid(this.props.node.fhirType, e.target.value);
		if (!isInvalid) {
			if ((this.props.node.fhirType === "id") && 
					(this.props.node.level === 1) && (resources = State.get().bundle?.resources)) {
				for (let i = 0; i < resources.length; i++) {
					const resource = resources[i];
					if ((resource.id === e.target.value) && (i !== State.get().bundle.pos)) {
						isInvalid = "This id is already used in the bundle.";
					}
				}
			}
		}
		return State.emit("value_change", this.props.node, e.target.value, isInvalid);
	}

	handleKeyDown(e) {
		if (e.which === this.ESC_KEY) {
			return this.props.onEditCancel(e);
		} else if ((e.which === this.ENTER_KEY) && 
			(e.target.type === "text")) {
				return this.props.onEditCommit(e);
		} else if ((e.which === this.TAB_KEY) &&
			(this.props.node.fhirType === "xhtml")) {
				//bug where selection will jump to end of string
				//http://searler.github.io/react.js/2014/04/11/React-controlled-text.html
				e.preventDefault();
				const newValue = e.target.value.substring(0, e.target.selectionStart) + "\t" + 
					e.target.value.substring(e.target.selectionEnd);
				return e.target.value = newValue;
			}
	}
 
	isValid(fhirType, value) {
		return PrimitiveValidator(fhirType, value);
	}

	renderString(value) {
		const inputField = this.buildTextInput((value||"").toString()); 
		return this.wrapEditControls(inputField);
	}

	renderUri(value) {
		const inputField = this.buildTextInput((value||"").toString()); 
		return this.wrapEditControls(inputField);
	}

	renderCanonical(value) {
		const inputField = this.buildCanonicalInput(value);
		return this.wrapEditControls(inputField);
	}

	renderCode(value) {
		//TODO: handle "preferred" and "extensible"
		let inputField;
		if (this.props.node?.binding?.strength === "required") {
			const {
                reference
            } = this.props.node.binding;
			const vs = State.get().valuesets[reference];
			if (vs && vs.type === "complete") {
				inputField =  this.buildCodeInput(value, vs.items);
			}
		}

		if (!inputField) { inputField = this.buildTextInput(value||""); }
		return this.wrapEditControls(inputField);
	}

	renderLongString(value) {
		const inputField = this.buildTextAreaInput((value||"").toString()); 
		return this.wrapEditControls(inputField);
	}

	renderBoolean(value) {
		const inputField = this.buildBooleanInput(value);
		return this.wrapEditControls(inputField);
	}

	buildBooleanInput(value) {
		return <span>
			<select value={this.props.node.value} 
				className="form-control input-sm" 
					onChange={this.handleChange.bind(this)} 
					ref="inputField"
				>
				<option value={true}>Yes</option>
				<option value={false}>No</option>
			</select>
		</span>;
	}

	handleCanonicalChange() {
		if (event.target.value == `http://fhir.org/guides/${State.get().authorName}/ActivityDefinition/ActivityDefinition-${State.get().CPGName}${State.get().resCount+1}`) {
			return State.emit("show_open_activity")
		}
		else if (event.target.value == `http://fhir.org/guides/${State.get().authorName}/PlanDefinition/PlanDefinition-${State.get().CPGName}${State.get().resCount+1}`) {
			return State.emit("show_open_insert")
		}
		else if (event.target.value == `http://fhir.org/guides/${State.get().authorName}/Questionnaire/Questionnaire-${State.get().CPGName}${State.get().resCount+1}`) {
			return State.emit("show_open_questionnaire")
		}
		else if (event.target.value == "Select") {
			return State.emit("show_canonical_dialog", this.props.parent);
		}
	}

	buildCanonicalInput(preview) {
		let nodeSchemaPath = this.props.node.schemaPath.substring(this.props.node.schemaPath.indexOf(".") + 1);
		let val = this.props.node.value ?? "Blank";
		let errFields = this.props.errFields;
		let style = {};
		let activityurl = `http://fhir.org/guides/${State.get().authorName}/ActivityDefinition/ActivityDefinition-${State.get().CPGName}${State.get().resCount+1}`;
		let planurl = `http://fhir.org/guides/${State.get().authorName}/PlanDefinition/PlanDefinition-${State.get().CPGName}${State.get().resCount+1}`;
		let questionurl = `http://fhir.org/guides/${State.get().authorName}/Questionnaire/Questionnaire-${State.get().CPGName}${State.get().resCount+1}`;
		if (errFields && errFields.includes(nodeSchemaPath) && val == "Blank") {
			style = {backgroundColor:"#ff9393"};
		}
		return <span>
			<select value={val} 
					className="form-control input-sm" 
					onChange = {(e) => {
						console.log(e.target.value)
						e.target.style.backgroundColor = "white"
						if (e.target.value != "Select") this.handleChange.bind(this)(e);			
						this.handleCanonicalChange.bind(this)(e);
					}}
					ref="inputField"
					style={style}
				>
				<option value={val} disabled>{this.props.node.value ?? "Select:"}</option>
				<option value= {activityurl}>ActivityDefinition</option>
				<option value={planurl}>PlanDefiniton</option>
				<option value={questionurl}>Questionnaire</option>
				<option value='Select'>Select from other resources in CPG</option>
			</select>
		</span>;
		} 

	buildCodeInput(value, items) {
		const options = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			options.push(<option key={item[1]} value={item[1]}>
				{item[0]} ({item[1]})
			</option>
			);
		}
		return <span>
			<select value={this.props.node.value || ""} 
				className="form-control input-sm" 
				onChange={(e) => {
					this.handleChange.bind(this)(e);
				}}
				ref="inputField"
				>
				{options}
			</select>
		</span>;		
	}

	buildTextAreaInput(value) {
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

	buildTextInput(value) {
		let nodeSchemaPath = this.props.node.schemaPath.substring(this.props.node.schemaPath.indexOf(".") + 1);
		let errFields = this.props.errFields;
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
		let commitButtonClassName = "btn btn-default btn-sm";
		if ([null, undefined, ""].includes(this.props.node.value) || 
			this.props?.node?.ui?.validationErr) {
				commitButtonClassName += " disabled";
			}

		return <button type="button" 
			className={commitButtonClassName} 
			onClick={this.props.onEditCommit}
		>
			<span className="fas fa-check"></span>
		</button>;
	}

	buildDeleteButton(disabled) {
		return <button type="button" 
			className="btn btn-default btn-sm" 
			onClick={this.props.onNodeDelete}
			disabled={disabled}
		>
			<span className="fas fa-trash-alt"></span>
		</button>;
	}

	wrapEditControls(inputField, disableDelete) {
		let commitButton, validationErr, validationHint;
		let groupClassName = "input-group";

		if (validationErr = this.props?.node?.ui?.validationErr) {
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
		const renderers = { 
			decimal: this.renderDecimal, boolean: this.renderBoolean, xhtml: this.renderLongString, 
			base64Binary: this.renderLongString, code: this.renderCode,
			uri: this.renderUri, canonical: this.renderCanonical
		};

		var renderer;
		renderer = renderers[this.props.node.fhirType || "string"] || this.renderString;

		const {
            value
        } = this.props.node;
		return renderer.call(this, value);
	}
}
ValueEditor.initClass();

export default ValueEditor;
