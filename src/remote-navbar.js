/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from 'react';
import State from './state';
import * as SchemaUtils from './helpers/schema-utils';
import {Navbar, Nav, NavItem} from 'react-bootstrap';

class RemoteNavbar extends React.Component {

	constructor() {
		super();
		this.notifiedReady = false;
	}

	componentDidMount() {
		this.launcher =
			(window.parent !== window ? window.parent : undefined) || window.opener;
			
		window.addEventListener("message", e => {
			if ((e.data?.action === "edit") && e.data?.resource) {
				State.emit("load_json_resource", e.data.resource);
				return this.remoteCallback = e.data.callback;
			}
		}
		, false);

		if (this.props.hasProfiles) { return this.notifyReady(); }
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.hasProfiles) { return this.notifyReady(); }
	}

	notifyReady() {
		if (this.notifiedReady) { return; }
		this.launcher.postMessage({action: "fred-ready"}, "*");
		return this.notifiedReady = true;
	}


	handleSaveRequest(e) {
		e.preventDefault();
		let [resource, errCount] = SchemaUtils.toFhir(State.get().resource, true);
		const {
            bundle
        } = State.get();
		if (bundle) { resource = 
			SchemaUtils.toBundle(bundle.resources, bundle.pos, resource); } 		
	
		if (errCount > 0) {
			return State.emit("set_ui", "validation_error");
		} else {
			this.launcher.postMessage({
				action: "fred-save", resource, 
				callback: State.get().remoteCallback
			}
			, "*");
			window.onbeforeunload = null;
			return window.close();
		}
	}

	handleCancelRequest(e) {
		e.preventDefault();
		this.launcher.postMessage(
			{action: "fred-cancel"}
		, "*");
		window.onbeforeunload = null;
		return window.close();
	}

	handleUiChange(status, e) {
		e.preventDefault();
		return State.emit("set_ui", status);
	}

	renderButtons() {
		if (!this.props.hasResource) { return null; }
		return <Nav>
			<NavItem key="open" onClick={this.handleUiChange.bind(this, "open")}>
				Open Resource
			</NavItem>
			<NavItem key="resource_json" onClick={this.handleUiChange.bind(this, "export")}>
				Export JSON
			</NavItem>
			<NavItem key="remote_save" onClick={this.handleSaveRequest.bind(this)}>
				Save and Close
			</NavItem>
			<NavItem key="remote_cancel" onClick={this.handleCancelRequest.bind(this)}>
				Cancel and Close
			</NavItem>
		</Nav>;
	}

	render() {
		return <Navbar fixed="top" className="navbar-custom">
			<Navbar.Header>
				<div className="pull-left" style={{margin: "10px"}}>
					<img src="../img/smart-bug.png" />
				</div>
				<Navbar.Brand>
					SAGE
				</Navbar.Brand>
				<Navbar.Toggle />
			</Navbar.Header>
			<Navbar.Collapse>
				{this.renderButtons()}
			</Navbar.Collapse>
		</Navbar>;
	}
}

export default RemoteNavbar;
