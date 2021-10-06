/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from 'react';
import State from './state';
import {Navbar, Nav, NavItem} from 'react-bootstrap';

class NavbarFred extends React.Component {

	handleUiChange(status, e) {
		e.preventDefault();
		return State.emit("set_ui", status);
	}

	handleDrag(e) {
		let file, files;
		e.preventDefault();
		if ((!(files = e.dataTransfer?.files)) ||
			(!(file = files?.[0]))) { return; }
		const reader = new FileReader();
		reader.onload = function(e) { 
			try {
				const json = JSON.parse(e.target.result);
				return State.emit("load_json_resource", json);
			} catch (error) {
				e = error;
				return State.emit("set_ui", "load_error");
			}
		};

		State.emit("set_ui", "loading");
		return reader.readAsText(file);
	}

	renderButtons() {	
		const navItems = [
			<Nav.Link key="open" onClick={this.handleUiChange.bind(this, "open")}>
				Open Resource
			</Nav.Link>
		];
		if (this.props.hasResource) { navItems.push(<Nav.Link 
			key="resource_json" 
			onClick={this.handleUiChange.bind(this, "export")}>
				Export JSON
		</Nav.Link>
		); }

		return navItems;
	}

	renderExtraButtons() {
		const navCpg = [
			<Nav.Link key="cpg" onClick={this.handleUiChange.bind(this, "cpg")}>
				CPG
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
				<img src="../img/smart-bug.png" />
			</div>
			<Navbar.Brand>
				SAGE
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
