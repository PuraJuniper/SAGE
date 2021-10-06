/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from 'react';

class Footer extends React.Component {
	constructor(...args) {
		super(...args);
		this.render = this.render.bind(this);
	}

	render() {
		return <div className="row footer">
			<div className="col-xs-12">
			<a href="https://github.com/PuraJuniper/fred">SAGE</a> is based on FRED, which is project of <a href="https://smarthealthit.org" target="_blank">SMART Health IT</a> and the open source code for the app is available on <a href="https://github.com/PuraJuniper/fred">GitHub</a>. To stay updated on the project follow <a href="https://twitter.com/intent/user?screen_name=gotdan" target="_blank">@gotdan</a> and <a href="https://twitter.com/intent/user?screen_name=smarthealthit" target="_blank">@smarthealthit</a> on twitter.
			</div>
		</div>;
	}
}

export default Footer;
