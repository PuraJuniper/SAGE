/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from 'react';
import State, { SageUiStatus } from './state';
import {Navbar, Nav, NavItem} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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

		State.emit("set_ui", "loading");
		return reader.readAsText(file);
	}



	render() {
		return <Navbar fixed="top" className="navbar-custom"
			onDragEnter={this.handleDrag.bind(this)}
			onDragOver={this.handleDrag.bind(this)}
			onDrop={this.handleDrag.bind(this)}
			onDragLeave={this.handleDrag.bind(this)}
		>
			<Navbar.Brand>SAGE Basic</Navbar.Brand>
			<Nav.Link key='home-button' onClick={this.handleUiChange.bind(this, 'basic-cpg')}>
					<img style={{'height':'40px'}} src="../img/house-chimney-solid.svg" alt="" />
			</Nav.Link>
		</Navbar>;
	}
}

export default NavbarFred;
