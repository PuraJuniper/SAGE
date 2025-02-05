/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from 'react';
import State from './state';
import {DropdownButton, Dropdown, Col} from 'react-bootstrap';
import * as SchemaUtils from "./helpers/schema-utils"
import { ACTIVITY_DEFINITION, LIBRARY, PLAN_DEFINITION, QUESTIONNAIRE } from './simplified/nameHelpers';

export function iconForResource(resource, iconType) {
	if (resource.resourceType === PLAN_DEFINITION) {
		iconType = "far fa-folder-open";
	} else if (resource.resourceType === ACTIVITY_DEFINITION) {
		iconType = "far fa-file-alt";
	} else if (resource.resourceType === LIBRARY) {
		iconType = "fas fa-book-medical";
	} else if (resource.resourceType == QUESTIONNAIRE) {
		iconType = "fas fa-question";
	}
	return iconType;
}

export function contentForResource(resource){
	if (resource.title == undefined) return resource.id;
	return `${resource.title}, ${resource.id}`;
}

class BundleBar extends React.Component {

	shouldComponentUpdate(nextProps) {
		return nextProps.bundle !== this.props.bundle;
	}

	handleNav(pos, e) {
		e.preventDefault();
		return State.emit("set_bundle_pos", pos);
	}

	handleMenu(e, item) {
		return State.emit(e);
	}

	renderEmptyBundle() {
		return <div className="alert alert-danger">An error occured loading the resource.</div>;
	}

	handleInsert(e) {
        e.preventDefault();
        return State.emit("show_open_insert");
    }

    handleDuplicate(e) {
        e.preventDefault();
        return State.emit("clone_resource");
    }

    handleRemove(e) {
        e.preventDefault();
        return State.emit("remove_from_bundle", this.props.bundle.pos);
    }

    clicked(e) {
        if(confirm('Are you sure you want to remove this resource from bundle?')) {
            e.preventDefault();
            return State.emit("remove_from_bundle", this.props.bundle.pos);
        }
    }

    handleUiChange(status, e) {
		e.preventDefault();
		return State.emit("set_ui", status);
	}

	renderBar() {
		const pos = this.props.bundle.pos+1;
		const count = this.props.bundle.resources.length;
		const title = `Bundled Resource ${pos} of ${count}`;
		const resources = this.props.bundle.resources;

        const resourcesJson = [];
        for (const resource of resources) {
            resourcesJson.push(SchemaUtils.toFhir(resource, false));
        }

		return <div className="row" style={{textAlign: "center"}}>
			<form className="navbar-form">

            <div className="row">
            <button className="btn btn-default btn-sm" 
					disabled={pos === 1} 
					onClick={this.handleNav.bind(this, this.props.bundle.pos-1)}
				>
					<i className="fas fa-chevron-left" />
				</button>
			<DropdownButton size="sm" 
                    title={title} 
                    style={{marginRight: "0px"}}
                    onSelect={this.handleMenu.bind(this)}
            >
				{resourcesJson.map((resource, i) => {
					const className = (() => {
                        // FontAwesome icons
					let iconType = "";
					iconType = iconForResource(resource, iconType);
					return iconType;
					})();
					let content = "";
					content = contentForResource(resource, content);
					return (
					<Dropdown.Item 
						onClick={this.handleNav.bind(this, i)}
						key = {resource.id}
					>
						<span className={className} style={{marginRight:"10px"}}> {content}</span> 
					</Dropdown.Item>
					)}
				)}

            </DropdownButton>

            <button className="btn btn-default btn-sm" 
					disabled={pos === count} 
					onClick={this.handleNav.bind(this, this.props.bundle.pos+1)}
				>
					<i className="fas fa-chevron-right" />
				</button>
			
				<button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleInsert.bind()}
                >
                    Insert Resource
                </button>&nbsp;

                <button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleDuplicate.bind()}
                >
                    Duplicate Resource
                </button>&nbsp;

                <button
                    className="btn btn-primary btn-sm"
                    disabled={pos === 1}
                    onClick={this.clicked.bind()}
                >
                    Remove from Bundle
                </button>&nbsp;
                </div>
            </form>
        </div>;
    }

	render() {
		if (this.props.bundle.resources.length > 0) {
			return this.renderBar();
		} else {
			return this.renderEmptyBundle();
		}
	}
}

export default BundleBar;

