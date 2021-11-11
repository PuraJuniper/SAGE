/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import State from "../state";
import ResourceElement from "./resource-element";
import ElementMenu from "./element-menu";
import { Button } from "react-bootstrap";
import { hiddenElements } from '../config';
import { SageNodeInitialized } from "../helpers/schema-utils";

type DomainResourceProps = {
	node: SageNodeInitialized,
	errFields: string[],
};

type DomainResourceState = {
};

class DomainResource extends React.Component<DomainResourceProps, DomainResourceState> {

	shouldComponentUpdate(nextProps: DomainResourceProps) {
		return nextProps.node !== this.props.node || nextProps.errFields !== this.props.errFields;
	}

	toggleShowHidden() {
		State.get().set({
			showHiddenElements: !State.get().showHiddenElements
		});
		// Force render
		this.setState({});
		this.forceUpdate();
		console.log(State.get());
	}

	handleChangeProfile() {
		return State.emit("set_ui", "change_profile");
	}

	render() {
		let node;
		if (!(node = this.props.node)) { return null; }
		
		let resourceId = null;
		const children = [];
		const showHidden = State.get().showHiddenElements; 
		for (let child of Array.from(node.children)) {
			if (child.name === "id") {
				resourceId = child.value;
			}
				
			if (showHidden) {
				children.push(<ResourceElement 
					key={child.id} node={child} 
					parent={node} errFields={this.props.errFields}
				/>
				);
			}
			else {
				if (!hiddenElements.includes(child.nodePath)) {
					children.push(<ResourceElement 
						key={child.id} node={child} 
						parent={node} errFields={this.props.errFields}
					/>
					);
				}
			}
		}

		const id = resourceId ?
			<span className="small">&nbsp;&nbsp;({resourceId})</span> : undefined;

		return <div>
			<div className="fhir-resource">
				<div className=" fhir-resource-title row"><div className="col-sm-12">
					<h2>
						{node.displayName}
						{id}
						&nbsp;
						<ElementMenu node={node} />
						&nbsp;
						<Button onClick={this.toggleShowHidden.bind(this)}>Toggle Hidden Elements</Button>
						<Button onClick={this.handleChangeProfile.bind(this)}>Change Profile</Button>
					</h2>
				</div></div>
				{children}
			</div>
		</div>;
	}
}


export default DomainResource;
