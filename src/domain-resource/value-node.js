/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import ValueDisplay from "./value-display";
import ValueEditor from "./value-editor";

class ValueNode extends React.Component {
	static initClass() {
	
		this.prototype.displayName = "ValueNode";
	}

	shouldComponentUpdate(nextProps) {
		return nextProps.node !== this.props.node;
	}

	componentWillMount() {
		if ([null, undefined, ""].includes(this.props.node.value) &&
			(__guard__(this.props.node != null ? this.props.node.ui : undefined, x => x.status) !== "editing")) {
				return this.props.onEditStart();
			}
	}

	renderUnknown() {
		const content = this.props.node.value ?
			<ValueDisplay node={this.props.node} parent={this.props.parent} />
		:
			<span>Unknown Elements</span>;

		return <div className="fhir-data-element fhir-element-unknown row">
			<div className="col-sm-3 fhir-data-title">
				{this.props.node.displayName}:
			</div>
			<div className="col-sm-9 fhir-data-content">
				{content}
			</div>
		</div>;
	}

	renderXhtmlEditing() {
		const preview =
			<div className="col-sm-9 col-sm-offset-3 fhir-data-content" style={{marginTop: "10px"}}>
				<ValueDisplay 
					node={this.props.node} 
					parent={this.props.parent}
				/>
			</div>;

		return this.renderEditing(preview);
	}

	renderEditing(preview) {
		const required = this.props.node.isRequired ? "*" : undefined;

		return <div className="fhir-data-element row">
			<div className="col-sm-3 fhir-data-title" title={this.props.node.short}>
				{this.props.node.displayName}{required} <span className="fhir-data-type">({this.props.node.fhirType})</span>:
			</div>
			<div className="col-sm-9 fhir-data-content">
				<div className="fhir-short-desc">{this.props.node.short}</div>
				<ValueEditor
					hasFocus={true}
					node={this.props.node}
					parent={this.props.parent}
					required={this.props.node.isRequired}
					onEditCommit={this.props.onEditCommit}
					onNodeDelete={this.props.onNodeDelete}
					onEditCancel={this.props.onEditCancel}
				/>
			</div>
			{preview}
		</div>;
	}

	renderDisplay() {
		const required = this.props.node.isRequired ? "*" : undefined;

		return <div className="fhir-data-element row" onClick={this.props.onEditStart} >
			<div className="col-sm-3 fhir-data-title" title={this.props.node.short}>
				{this.props.node.displayName}{required}:
			</div>
			<div className="col-sm-9 fhir-data-content">
				<ValueDisplay 
					node={this.props.node} 
					parent={this.props.parent}
				/>
			</div>
		</div>;
	}


	renderPreview() {
		return <div>preview</div>;
	}

	render() {
		const isEditing = __guard__(this.props.node != null ? this.props.node.ui : undefined, x => x.status) === "editing";
		//don't show hidden elements
		if (this.props.node.hidden) { return null; }
		
		if (!this.props.node.fhirType) {
			return this.renderUnknown();
		} else if (isEditing && (this.props.node.fhirType === "xhtml")) {
			return this.renderXhtmlEditing();
		} else if (isEditing) {
			return this.renderEditing();
		} else {
			return this.renderDisplay();
		}
	}
}
ValueNode.initClass();

export default ValueNode;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}