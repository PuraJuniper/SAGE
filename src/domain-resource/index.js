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

class DomainResource extends React.Component {

	shouldComponentUpdate(nextProps) {
		return nextProps.node !== this.props.node || nextProps.errFields !== this.props.errFields;
	}

	render() {
		let node;
		if (!(node = this.props.node)) { return null; }

		let resourceId = null;
		const children = []; 
		for (let child of Array.from(node.children)) {
			if (child.name === "id") {
				resourceId = child.value;
			}
				
			children.push(<ResourceElement 
				key={child.id} node={child} 
				parent={node} errFields={this.props.errFields}
			/>
			);
		}

		const id = resourceId ?
			<span className="small">&nbsp;&nbsp;({resourceId})</span> : undefined;

		return <div className="fhir-resource">
			<div className=" fhir-resource-title row"><div className="col-sm-12">
				<h2>
					{node.displayName}
					{id}
					&nbsp;
					<ElementMenu node={node} />
				</h2>
			</div></div>
			{children}
		</div>;
	}
}


export default DomainResource;
