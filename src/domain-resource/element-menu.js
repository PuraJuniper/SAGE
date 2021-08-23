/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import State from "../state";
import {Dropdown} from "react-bootstrap";

class ElementMenu extends React.Component {

	shouldComponentUpdate(nextProps) {
		return __guard__(nextProps.node != null ? nextProps.node.ui : undefined, x => x.menu) !== __guard__(this.props.node != null ? this.props.node.ui : undefined, x1 => x1.menu);
	}

	handleToggle(show) {
		if (show) {
			return State.trigger("show_object_menu", this.props.node, this.props.parent);
		}
	}

	handleAddItem(unused) {
		return State.trigger("add_object_element", this.props.node, unused);
	}

	handleAddObject(e) {
		State.trigger("add_array_object", this.props.node);
		return e.preventDefault();
	}

	handleMove(down, e) {
		State.trigger("move_array_node", this.props.node, this.props.parent, down);
		return e.preventDefault;
	}

	handleDeleteItem(e) {
		State.trigger("delete_node", this.props.node, this.props.parent);
		return e.preventDefault();
	}

	preventDefault(e) {
		return e.preventDefault();
	}


	render() {
		return <Dropdown id="element-menu" onToggle={this.handleToggle.bind(this)}>
			{this.renderToggle()}
			{this.renderMenu()}
		</Dropdown>;
	}

	renderToggle() {
		let className, title;
		if (this.props.display === "inline") {
			className = "inline-menu-toggle";
			title = this.props.node.displayName;
	
		} else if (this.props.display === "heading") {
			className = "heading-menu-toggle";
			title = this.props.parent.displayName;
		}

		return <Dropdown.Toggle variant="outline-dark" className={className} bsSize="small" title={title || "Add Element"}>{title || "Add Element"}</Dropdown.Toggle>;
	}

	renderPlaceholder() {
		return <Dropdown.Menu><Dropdown.Item>Loading...</Dropdown.Item></Dropdown.Menu>;
	}

	renderMenu() {
		if (__guard__(this.props.node != null ? this.props.node.ui : undefined, x => x.status) !== "menu") {
			return this.renderPlaceholder(); 
		}

		const addObject = this.props.node.nodeType === "objectArray" ?
			<Dropdown.Item onSelect={this.handleAddObject.bind(this)}>Add {this.props.node.displayName}</Dropdown.Item> : undefined;
		const moveUp = this.props.node.ui.menu.canMoveUp ?
			<Dropdown.Item onSelect={this.handleMove.bind(this, false)}>Move Up</Dropdown.Item> : undefined;
		const moveDown = this.props.node.ui.menu.canMoveDown ?
			<Dropdown.Item onSelect={this.handleMove.bind(this, true)}>Move Down</Dropdown.Item> : undefined;
		let unusedElements = (() => {
			const result = [];
			const iterable = this.props.node.ui.menu.unusedElements || [];
			for (let i = 0; i < iterable.length; i++) {
				const unused = iterable[i];
				const required = unused.isRequired ? "*" : "";
				result.push(<Dropdown.Item key={i} onSelect={this.handleAddItem.bind(this, unused)}>
					{unused.displayName + (required || "")}
				</Dropdown.Item>);
			}
			return result;
		})();
		const remove = this.props.parent ?
			<Dropdown.Item onSelect={this.handleDeleteItem.bind(this)}>Remove</Dropdown.Item> : undefined;
		let spacer1 = (addObject || remove) ?
			<Dropdown.Item divider /> : undefined;
		let spacer2 = (moveUp || moveDown) && ((unusedElements != null ? unusedElements.length : undefined) > 0) ?
			<Dropdown.Item divider /> : undefined;
		let header = ((unusedElements != null ? unusedElements.length : undefined) > 0) && this.props.parent ?
			<Dropdown.Item header>Add Item</Dropdown.Item> : undefined;

		//handle empty contained resources
		if ((this.props.node != null ? this.props.node.fhirType : undefined) === "Resource") {
			header = (unusedElements = (spacer1 = (spacer2 = null)));
		}

		return <Dropdown.Menu>
			{remove}{addObject}
			{spacer1}{moveUp}{moveDown}
			{spacer2}{header}{unusedElements}
		</Dropdown.Menu>;
	}
}

export default ElementMenu;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}