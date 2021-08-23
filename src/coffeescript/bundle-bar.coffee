import React from 'react'
import State from './state'
import {DropdownButton, Dropdown} from 'react-bootstrap'

class BundleBar extends React.Component

	shouldComponentUpdate: (nextProps) ->
		nextProps.bundle isnt @props.bundle

	handleNav: (pos, e) ->
		e.preventDefault()
		State.trigger "set_bundle_pos", pos

	handleMenu: (e, item) ->
		State.trigger item

	renderEmptyBundle: ->
			<div className="alert alert-danger">An error occured loading the resource.</div>

	renderBar: ->
		pos = @props.bundle.pos+1
		count = @props.bundle.resources.length
		title = "Bundled Resource #{pos} of #{count}"

		<div className="row" style={textAlign: "center"}>
			<form className="navbar-form">
				
				<button className="btn btn-default btn-sm" 
					disabled={pos is 1} 
					style={marginRight: "10px"}
					onClick={@handleNav.bind(@, 0)}
				>
					<i className="fas fa-step-backward" />
				</button>

				<button className="btn btn-default btn-sm" 
					disabled={pos is 1} 
					onClick={@handleNav.bind(@, @props.bundle.pos-1)}
				>
					<i className="fas fa-chevron-left" />
				</button>

				<DropdownButton bsSize="small" 
					title={title} 
					id="bundle-dropdown"
					style={marginRight: "10px", marginLeft: "10px"}
					onSelect={@handleMenu.bind(@)}
				>
					<Dropdown.Item eventKey="remove_from_bundle" disabled={count is 1}>Remove from Bundle</Dropdown.Item>
					<Dropdown.Item eventKey="show_open_insert">Insert Resource</Dropdown.Item>
					<Dropdown.Item eventKey="clone_resource">Duplicate Resource</Dropdown.Item>
				</DropdownButton>

				<button className="btn btn-default btn-sm" 
					disabled={pos is count} 
					onClick={@handleNav.bind(@, @props.bundle.pos+1)}
				>
					<i className="fas fa-chevron-right" />
				</button>

				<button className="btn btn-default btn-sm" 
					disabled={pos is count} 
					onClick={@handleNav.bind(@, count-1)}
					style={marginLeft: "10px"}
				>
					<i className="fas fa-step-forward" />
				</button>

			</form>
		</div>

	render: ->
		if @props.bundle.resources.length > 0
			@renderBar()
		else
			@renderEmptyBundle()

export default BundleBar
