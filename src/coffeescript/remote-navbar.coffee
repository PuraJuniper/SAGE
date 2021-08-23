import React from 'react'
import State from './state'
import * as SchemaUtils from './helpers/schema-utils'
import {Navbar, Nav, NavItem} from 'react-bootstrap'

class RemoteNavbar extends React.Component

	constructor: ->
		super()
		@notifiedReady = false

	componentWillMount: ->
		@launcher =
			(window.parent unless window.parent is window) or window.opener
			
		window.addEventListener "message", (e) =>
			if e.data?.action is "edit" and e.data?.resource
				State.trigger "load_json_resource", e.data.resource
				@remoteCallback = e.data.callback
		, false

		if @props.hasProfiles then @notifyReady()

	componentWillReceiveProps: (nextProps) ->
		if nextProps.hasProfiles then @notifyReady()

	notifyReady: ->
		return if @notifiedReady
		@launcher.postMessage {action: "fred-ready"}, "*"
		@notifiedReady = true


	handleSaveRequest: (e) ->
		e.preventDefault()
		[resource, errCount] = SchemaUtils.toFhir State.get().resource, true
		bundle = State.get().bundle
		if bundle then resource = 
			SchemaUtils.toBundle bundle.resources, bundle.pos, resource 		
	
		if errCount > 0
			State.trigger "set_ui", "validation_error"
		else
			@launcher.postMessage
				action: "fred-save", resource: resource, 
				callback: State.get().remoteCallback
			, "*"
			window.onbeforeunload = null
			window.close()

	handleCancelRequest: (e) ->
		e.preventDefault()
		@launcher.postMessage
			action: "fred-cancel"
		, "*"
		window.onbeforeunload = null
		window.close()

	handleUiChange: (status, e) ->
		e.preventDefault()
		State.trigger "set_ui", status

	renderButtons: ->
		return null unless @props.hasResource
		<Nav>
			<NavItem key="open" onClick={@handleUiChange.bind(@, "open")}>
				Open Resource
			</NavItem>
			<NavItem key="resource_json" onClick={@handleUiChange.bind(@, "export")}>
				Export JSON
			</NavItem>
			<NavItem key="remote_save" onClick={@handleSaveRequest.bind(@)}>
				Save and Close
			</NavItem>
			<NavItem key="remote_cancel" onClick={@handleCancelRequest.bind(@)}>
				Cancel and Close
			</NavItem>
		</Nav>

	render: ->
		<Navbar fixedTop={true} className="navbar-custom">
			<Navbar.Header>
				<div className="pull-left" style={margin: "10px"}>
					<img src="../img/smart-bug.png" />
				</div>
				<Navbar.Brand>
					SMART FRED v{@props.appVersion}
				</Navbar.Brand>
				<Navbar.Toggle />
			</Navbar.Header>
			<Navbar.Collapse>
				{@renderButtons()}
			</Navbar.Collapse>
		</Navbar>

export default RemoteNavbar
