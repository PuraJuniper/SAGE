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

import ValueNode from "./value-node";
import ValueArrayNode from "./value-array-node";
import ElementMenu from "./element-menu";
import { hiddenElements } from '../config';

interface ResourceElementProps {
	node: SageNodeInitializedFreezerNode,
	parent: SageNodeInitializedFreezerNode,
	errFields: string[],
}

class ResourceElement extends React.Component<ResourceElementProps, Record<string, never>> {
	static initClass() {
	
		// this.prototype.displayName = "ResourceElement";
	}

	isValid(node: SageNodeInitializedFreezerNode) {
		//this is hacky - need to find a better place for pre-commit validation
		for (const editNode of node.children || [node]) {
			let message;
			if (node.ui?.validationErr) { return false; }
			if ((message = PrimitiveValidator(editNode.fhirType, editNode.value, true))) {
				State.emit("value_change", editNode, editNode.value, message);
				return false;
			}
		}

		return true;
	}

	shouldComponentUpdate(nextProps: ResourceElementProps) {
		// console.log("scu", nextProps);
		return nextProps.node !== this.props.node || nextProps.errFields !== this.props.errFields;
	}

	componentDidMount() {
		if (this.refs.complexElement && (this.props.node?.nodeCreator === "user")) {
			// const domNode = ReactDOM.findDOMNode(this.refs.complexElement);
			// domNode.scrollIntoView(true);
			//account for fixed header
			const {
                scrollY
            } = window;
			if (scrollY) {
				return window.scroll(0, scrollY - 60);
			}
		}
	}

	handleEditStart(e?: React.SyntheticEvent) {
		State.emit("start_edit", this.props.node);
		if (e) { return e.preventDefault(); }
	}

	handleEditCancel(e?: React.SyntheticEvent) {
		//don't allow cancel if no previous value
		if ([null, undefined, ""].includes(this.props.node?.ui?.prevState?.value)) {
			return;
		}
		State.emit("cancel_edit", this.props.node);
		if (e) { return e.preventDefault(); }
	}

	handleEditCommit(e?: React.SyntheticEvent) {
		if (!this.isValid(this.props.node)) { return; }
		State.emit("end_edit", this.props.node, this.props.parent);
		if (e) { return e.preventDefault(); }
	}

	handleNodeDelete(e?: React.SyntheticEvent) {
		State.emit("delete_node", this.props.node, this.props.parent);
		if (e) { return e.preventDefault(); }
	}

	handleAddContained(e?: React.SyntheticEvent) {
		State.emit("show_open_contained", this.props.node);
		if (e) { return e.preventDefault(); }
	}

	handleObjectMenu(e?: React.SyntheticEvent) {
		if (this.props.node?.ui?.status === "menu") { return; }
		State.emit("show_object_menu", this.props.node, this.props.parent);
		if (e) { return e.preventDefault(); }
	}

	renderChildren() {
		const showHidden = State.get().showHiddenElements;
		const children = [];
		for (const child of this.props.node.children) {
			if (showHidden) {
				children.push(<ResourceElement 
					key={child.id} node={child} 
					parent={this.props.node}
					errFields={this.props.errFields}
				/>
				);
			}
			else {
				if (!hiddenElements.includes(child.name)) {
					children.push(<ResourceElement 
						key={child.id} node={child} 
						parent={this.props.node}
						errFields={this.props.errFields}
					/>
					);
				}
			}
		}		
		return children;
	}

	render() {

		if ((this.props.node.nodeType === "value") || !this.props.node.fhirType) {
			
				return <ValueNode 
					node={this.props.node} 
					parent={this.props.parent} 
					onEditStart={this.handleEditStart.bind(this)}
					onEditCommit={this.handleEditCommit.bind(this)}
					onEditCancel={this.handleEditCancel.bind(this)}
					onNodeDelete={this.handleNodeDelete.bind(this)}
					errFields={this.props.errFields}
				/>;


		} else if (this.props.node.nodeType === "valueArray") {
				
				return <ValueArrayNode 
					node={this.props.node} 
					parent={this.props.parent} 
					onEditStart={this.handleEditStart.bind(this)}
					onEditCommit={this.handleEditCommit.bind(this)}
					onEditCancel={this.handleEditCancel.bind(this)}
					onNodeDelete={this.handleNodeDelete.bind(this)}
				/>;

		} else if (this.props.node.nodeType === "objectArray") {

			return <div className="fhir-data-element row" ref="complexElement">
				<div className="col-sm-12">
					{this.renderChildren()}
				</div>
			</div>;

		//handle contained resources
		} else if (this.props.node.fhirType === "Resource") {

				return <div className="fhir-array-complex-wrap" ref="complexElement">
					<ElementMenu node={this.props.node} 
						parent={this.props.parent} display="heading" />
					<div className="fhir-array-complex text-center">
						<button className="btn btn-primary" onClick={this.handleAddContained.bind(this)}>
							Choose Resource
						</button>
					</div>
				</div>;


		} else if (this.props.node.nodeType === "arrayObject") {
			//console.log(this.props.node);

				return <div className="fhir-array-complex-wrap" ref="complexElement">
					<ElementMenu node={this.props.node} 
						parent={this.props.parent} display="heading" />
					<div className="fhir-array-complex">
						{this.renderChildren()}
					</div>
				</div>;

		} else if (this.props.node.nodeType === "object") {

			return <div className="fhir-data-element row" ref="complexElement">
				<div className="col-sm-3">
					<ElementMenu node={this.props.node} 
						parent={this.props.parent} display="inline" 
					/>
				</div>
				<div className="col-sm-9">
					{this.renderChildren()}
				</div>
			</div>;
		}
	}
}
ResourceElement.initClass();




export default ResourceElement;
