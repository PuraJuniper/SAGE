/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import ValueDisplay from "./value-display";
import ValueEditor from "./value-editor";
import { SageNodeInitializedFreezerNode } from "../state";

interface ValueNodeProps {
	node: SageNodeInitializedFreezerNode,
	errFields: string[],
	parent: SageNodeInitializedFreezerNode,
	onEditStart: (e?: React.SyntheticEvent) => void,
	onEditCommit: (e?: React.SyntheticEvent) => void,
	onNodeDelete: (e?: React.SyntheticEvent) => void,
	onEditCancel: (e?: React.SyntheticEvent) => void,
}

class ValueNode extends React.Component<ValueNodeProps, Record<string, never>> {
	static initClass() {
	
		// this.prototype.displayName = "ValueNode";
	}

	shouldComponentUpdate(nextProps: ValueNodeProps) {
		// console.log('scu', nextProps);
		return nextProps.node !== this.props.node || nextProps.errFields !== this.props.errFields;
	}

	componentDidMount() {
		if ([null, undefined, ""].includes(this.props.node.value) &&
			(this.props.node?.ui?.status !== "editing")) {
				return this.props.onEditStart();
			}
	}

	componentDidUpdate() {
		if ([null, undefined, ""].includes(this.props.node.value) &&
			(this.props.node?.ui?.status !== "editing")) {
				return this.props.onEditStart();
		}
	}

	// Unused?
	// handleItemAdd(e) {
	// 	State.emit("add_array_value", this.props.node);
	// 	if (e) { return e.preventDefault(); }
	// }

	// handleUiChange(status: string, e) {
	// 	e.preventDefault();
	// 	return State.emit("set_ui", status);
	// }

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


	renderEditing(preview?: JSX.Element) {
		const required = this.props.node.isRequired ? "*" : undefined;

		return <div className="fhir-data-element row">
			<div className="col-sm-3 fhir-data-title" title={this.props.node.short}>
				{this.props.node.displayName}{required} <span className="fhir-data-type">({this.props.node.fhirType})</span>:
			</div>
			<div className="col-sm-9 fhir-data-content">
				<div className="fhir-short-desc">{this.props.node.short}</div>
				<ValueEditor
					hasFocus={false}
					node={this.props.node}
					parent={this.props.parent}
					required={this.props.node.isRequired}
					onEditCommit={this.props.onEditCommit}
					onNodeDelete={this.props.onNodeDelete}
					onEditCancel={this.props.onEditCancel}
					shortName={this.props.node.short}
					errFields={this.props.errFields}
				/>
			</div>
			{preview}
		</div>;
	}

	renderDisplay() {
		const required = this.props.node.isRequired ? "*" : undefined;
		const fixed = this.props.node.isFixed ? "!" : undefined;

		return <div className="fhir-data-element row">
			<div className="col-sm-3 fhir-data-title" title={this.props.node.short}>
				{this.props.node.displayName}{required}{fixed}:
			</div>
			<div className="col-sm-9 fhir-data-content" onClick={this.props.onEditStart}>
				<ValueDisplay 
					node={this.props.node} 
					parent={this.props.parent}
					onEditStart={this.props.onEditStart}
				/>
			</div>
		</div>;
	}


	renderPreview() {
		return <div>preview</div>;
	}

	render() {
		const isFixed = this.props.node?.isFixed || this.props.node?.nodePath == 'Meta.profile';
		const isEditing = this.props.node?.ui?.status === "editing" && !isFixed;
		//don't show hidden elements
		if (this.props.node.hidden) { return null; }
		
		if (!this.props.node.fhirType) {
			return this.renderUnknown();
		} else if (isEditing && (this.props.node.fhirType === "xhtml")) {
			return this.renderXhtmlEditing();
		//} else if (isEditing && (this.props.node.name === "definitionCanonical")) {
		//	return this.renderCanonical();
		} else if (isEditing) {
			return this.renderEditing();
		} else {
			return this.renderDisplay();
		}
	}
}
ValueNode.initClass();

export default ValueNode;
