/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from 'react';
import State from './state';
import {Navbar, Nav, NavItem} from 'react-bootstrap';

class NavbarFred extends React.Component {

	handleUiChange(status, e) {
		e.preventDefault();
		return State.trigger("set_ui", status);
	}

	handleDrag(e) {
		let file, files;
		e.preventDefault();
		if ((!(files = e.dataTransfer != null ? e.dataTransfer.files : undefined)) ||
			(!(file = files != null ? files[0] : undefined))) { return; }
		const reader = new FileReader();
		reader.onload = function(e) { 
			try {
				const json = JSON.parse(e.target.result);
				return State.trigger("load_json_resource", json);
			} catch (error) {
				e = error;
				return State.trigger("set_ui", "load_error");
			}
		};

		State.trigger("set_ui", "loading");
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

	render() {
		return <Navbar fixedTop={true} className="navbar-custom"
			onDragEnter={this.handleDrag.bind(this)}
			onDragOver={this.handleDrag.bind(this)}
			onDrop={this.handleDrag.bind(this)}
			onDragLeave={this.handleDrag.bind(this)}
		>
			<div className="pull-left" style={{margin: "10px"}}>
				<img src="../img/smart-bug.png" />
			</div>
			<Navbar.Brand>
				SMART FRED v{this.props.appVersion}
			</Navbar.Brand>
			<Navbar.Toggle />
			<Navbar.Collapse>
				<Nav>
					{this.renderButtons()}
				</Nav>
			</Navbar.Collapse>
		</Navbar>;
	}
}

export default NavbarFred;
