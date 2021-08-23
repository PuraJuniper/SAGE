/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from 'react';
import State from  './state';

class RefWarning extends React.Component {

	handleUpdate(e) {
		e.preventDefault();
		return State.trigger("update_refs", this.props.update);
	}

	handleCancel(e) {
		e.preventDefault();
		return State.trigger("set_ui", "ready");	
	}

	render() {
		const countText = this.props.count > 1 ?
			`${this.props.count.toString()} resources ` 
		:
			"a resource ";
		return <div className="alert alert-info text-center" style={{marginTop: "10px"}}>
			This resource is referenced by {countText} in this Bundle.
			<p style={{marginTop: "4px"}}>
				<button className="btn btn-primary btn-sm" 
					onClick={this.handleUpdate.bind(this)}
				>Update</button>
				<button className="btn btn-default btn-sm" style={{marginLeft: "10px"}} 
					onClick={this.handleCancel.bind(this)}
				>Ignore</button>
			</p>
		</div>;
	}
}


export default RefWarning;
