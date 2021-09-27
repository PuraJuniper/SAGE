/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from 'react';
import State from './state';
import {DropdownButton, Dropdown} from 'react-bootstrap';

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

	renderBar() {
		const pos = this.props.bundle.pos+1;
		const count = this.props.bundle.resources.length;
		const title = `Bundled Resource ${pos} of ${count}`;

		return <div className="row" style={{textAlign: "center"}}>
			<form className="navbar-form">
				
				<button className="btn btn-default btn-sm" 
					disabled={pos === 1} 
					style={{marginRight: "10px"}}
					onClick={this.handleNav.bind(this, 0)}
				>
					<i className="fas fa-step-backward" />
				</button>

				<button className="btn btn-default btn-sm" 
					disabled={pos === 1} 
					onClick={this.handleNav.bind(this, this.props.bundle.pos-1)}
				>
					<i className="fas fa-chevron-left" />
				</button>

				<DropdownButton bsSize="small" 
					title={title} 
					id="bundle-dropdown"
					style={{marginRight: "10px", marginLeft: "10px"}}
					onSelect={this.handleMenu.bind(this)}
				>
					<Dropdown.Item eventKey="remove_from_bundle" disabled={count === 1}>Remove from Bundle</Dropdown.Item>
					<Dropdown.Item eventKey="show_open_insert">Insert Resource</Dropdown.Item>
					<Dropdown.Item eventKey="clone_resource">Duplicate Resource</Dropdown.Item>
				</DropdownButton>

				<button className="btn btn-default btn-sm" 
					disabled={pos === count} 
					onClick={this.handleNav.bind(this, this.props.bundle.pos+1)}
				>
					<i className="fas fa-chevron-right" />
				</button>

				<button className="btn btn-default btn-sm" 
					disabled={pos === count} 
					onClick={this.handleNav.bind(this, count-1)}
					style={{marginLeft: "10px"}}
				>
					<i className="fas fa-step-forward" />
				</button>

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
