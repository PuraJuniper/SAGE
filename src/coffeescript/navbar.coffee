import React from 'react'
import State from './state'
import {Navbar, Nav, NavItem} from 'react-bootstrap'

class NavbarFred extends React.Component

	handleUiChange: (status, e) ->
		e.preventDefault()
		State.trigger "set_ui", status

	handleDrag: (e) ->
		e.preventDefault()
		return unless (files = e.dataTransfer?.files) and
			(file = files?[0])
		reader = new FileReader()
		reader.onload = (e) -> 
			try
				json = JSON.parse e.target.result
				State.trigger "load_json_resource", json
			catch e
				State.trigger "set_ui", "load_error"

		State.trigger "set_ui", "loading"
		reader.readAsText(file)
	
	renderButtons: ->
		navItems = [
			<Nav.Link key="open" onClick={@handleUiChange.bind(@, "open")}>
				Open Resource
			</Nav.Link>
		]

		if @props.hasResource then navItems.push <Nav.Link 
			key="resource_json" 
			onClick={@handleUiChange.bind(@, "export")}>
				Export JSON
		</Nav.Link>

		return navItems

	render: ->
		<Navbar fixedTop={true} className="navbar-custom"
			onDragEnter={@handleDrag.bind(@)}
			onDragOver={@handleDrag.bind(@)}
			onDrop={@handleDrag.bind(@)}
			onDragLeave={@handleDrag.bind(@)}
		>
			<div className="pull-left" style={margin: "10px"}>
				<img src="../img/smart-bug.png" />
			</div>
			<Navbar.Brand>
				SMART FRED v{@props.appVersion}
			</Navbar.Brand>
			<Navbar.Toggle />
			<Navbar.Collapse>
				<Nav>
					{@renderButtons()}
				</Nav>
			</Navbar.Collapse>
		</Navbar>

export default NavbarFred;
