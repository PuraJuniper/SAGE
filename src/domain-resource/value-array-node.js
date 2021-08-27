/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import State from "../state";
import ValueDisplay from "./value-display";
import ValueEditor from "./value-editor";

class ValueArrayNode extends React.Component {
	static initClass() {
	
		this.prototype.displayName = "ValueArrayNode";
	}

	shouldComponentUpdate(nextProps) {
		return nextProps.node !== this.props.node;
	}

	handleItemAdd(e) {
		State.trigger("add_array_value", this.props.node);
		if (e) { return e.preventDefault(); }
	}

	handleItemDelete(child, e) {
		if (this.props.node.children.length === 1) {
			this.props.onNodeDelete();
		} else {
			State.trigger("delete_node", child, this.props.node);
		}
		return e.preventDefault();
	}

	componentWillMount() {
		if ((this.props.node.children.length === 0) &&
			(__guard__(this.props.node != null ? this.props.node.ui : undefined, x => x.status) !== "editing")) {
				return this.props.onEditStart();
			}
	}

	componentDidUpdate() {
		//give 'em a first item
		if ((__guard__(this.props.node != null ? this.props.node.ui : undefined, x => x.status) === "editing") && 
			(this.props.node.children.length === 0)) {
				return this.handleItemAdd();
			}
	}

	renderEditing() {
		const children = [];
		for (let i = 0; i < this.props.node.children.length; i++) {
			const child = this.props.node.children[i];
			children.push(<ValueEditor
				key={i}
				hasFocus={i === (this.props.node.children.length-1)}
				node={child}
				parent={this.props.node}
				onEditCommit={this.props.onEditCommit}
				onNodeDelete={this.handleItemDelete.bind(this, child)}
				onEditCancel={this.props.onEditCancel}
				required={this.props.node.isRequired && (this.props.node.children.length === 1)}
			/>
			);
		}

		const required = this.props.node.isRequired ? "*" : undefined;

		return <div className="row fhir-data-element">
			<div className="col-sm-3 fhir-data-title">
				{this.props.node.displayName} <span className="fhir-data-type">({this.props.node.fhirType})</span>:
			</div>
			<div className="col-sm-9 fhir-data-content">
				<div className="fhir-short-desc">{this.props.node.short}{required}</div>
				{children}
				<div className="btn-toolbar" role="group" style={{marginTop: "6px"}}>					
					<button type="button" className="btn btn-default btn-sm" onClick={this.handleItemAdd.bind(this)}>
						<span className="fas fa-plus"></span>
					</button>
					<button type="button" className="btn btn-default btn-sm" onClick={this.props.onEditCommit}>
						<span className="fas fa-check"></span>
					</button>
				</div>
			</div>
		</div>;
	}


	renderDisplay() { 

		const required = this.props.node.isRequired ? "*" : undefined;

		const children = [];
		for (let i = 0; i < this.props.node.children.length; i++) {
			const child = this.props.node.children[i];
			children.push(<ValueDisplay 
				key={i} node={child} parent={this.props.node} />
			);
		} 

		return <div className="row fhir-data-element fhir-data-unknown" onClick={this.props.onEditStart}>
			<div className="col-sm-3 fhir-data-title">
				{this.props.node.displayName}{required}:
			</div>
			<div className="col-sm-9 fhir-data-content">
				{children}
			</div>
		</div>;
	}

	render() {

		if (__guard__(this.props.node != null ? this.props.node.ui : undefined, x => x.status) === "editing") {
			return this.renderEditing();
		} else {
			return this.renderDisplay();
		}
	}
}
ValueArrayNode.initClass();




export default ValueArrayNode;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}