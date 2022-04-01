/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from 'react';
import State, { SageUiStatus } from './state';
import {Navbar, Nav, NavItem} from 'react-bootstrap';

interface NavbarFredProps {
	hasResource: boolean,
	appVersion: string
}

class NavbarFred extends React.Component<NavbarFredProps> {

	handleUiChange(status: SageUiStatus) {
		return State.emit("set_ui", status);
	}

	handleDrag(e: React.DragEvent<HTMLElement>) {
		let file, files;
		e.preventDefault();
		if ((!(files = e.dataTransfer?.files)) ||
			(!(file = files?.[0]))) { return; }
		const reader = new FileReader();
		reader.onload = function(e) { 
			try {
				const json = JSON.parse(e.target?.result as string); // reader.readAsText will result in a string
				return State.emit("load_json_resource", json);
			} catch (error) {
				return State.emit("set_ui", "resource_load_error");
			}
		};

		State.emit("set_ui", "loading_sage_data");
		return reader.readAsText(file);
	}

	renderButtons() {	
		const navItems = [
			<Nav.Link key="open" onClick={this.handleUiChange.bind(this, "open")}>
				Create Resource
			</Nav.Link>
		];

		return navItems;
	}

	renderExtraButtons() {
		const navCpg = [
			<Nav.Link key="bas-cpg" onClick={this.handleUiChange.bind(this, "basic-cpg")}>
				Basic CPG
			</Nav.Link>,
			<Nav.Link key="adv-cpg" onClick={this.handleUiChange.bind(this, "advanced-cpg")}>
				Advanced CPG
			</Nav.Link>,
			this.props.hasResource && <Nav.Link 
			key="resource_json" 
			onClick={this.handleUiChange.bind(this, "export")}>
				Export JSON
			</Nav.Link>,
			<Nav.Link key="settings" onClick={this.handleUiChange.bind(this, "settings")}>
				User Settings
			</Nav.Link>
		];
		return navCpg;
	}

	render() {
		return <Navbar fixed="top" className="navbar-custom"
			onDragEnter={this.handleDrag.bind(this)}
			onDragOver={this.handleDrag.bind(this)}
			onDrop={this.handleDrag.bind(this)}
			onDragLeave={this.handleDrag.bind(this)}
		>
			<div className="pull-left" style={{margin: "10px"}}>
			</div>
			<Navbar.Brand>
				Forking FRED
			</Navbar.Brand>
			<Navbar.Toggle />
			<Navbar.Collapse>
				<Nav>
					{this.renderButtons()}
					{this.renderExtraButtons()}
				</Nav>
			</Navbar.Collapse>
		</Navbar>;
	}
}

export default NavbarFred;
