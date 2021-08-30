/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import ReactDOM from "react-dom";
import State from "./reactions";
import * as SchemaUtils from "./helpers/schema-utils";

import NavbarFred from "./navbar";
import RemoteNavbar from "./remote-navbar";
import BundleBar from "./bundle-bar";
import RefWarning from "./ref-warning";
import Footer from "./footer";

import DomainResource from "./domain-resource/";

import OpenDialog from "./dialogs/open-dialog";
import ExportDialog from "./dialogs/export-dialog";

import AppInfo from "../package.json";

class RootComponent extends React.Component {
	
	constructor() {
		super();
		const versionSegments = AppInfo.version.split(".");
		//only take the major and minor
		this.appVersion = versionSegments.slice(0,versionSegments.length-1).join(".");
	}

	getQs() {
		const data = {};
		const params = window.document.location.search?.substr(1).split("&");
		for (let param of Array.from(params)) {
			const [k,v] = param.split("=");
			data[k] = decodeURIComponent(v);
		}
		return data;
	}

	componentWillMount() {
		const qs = this.getQs();

		if (qs.remote === "1") {
			this.isRemote = true;
		}

		if (qs.warn !== "0") {
			window.onbeforeunload = () => {
				if (State.get().resource) {
					return "If you leave this page you will lose any unsaved changes.";
				}
			};
		}

		const defaultProfilePath = "profiles/r4.json";

		return State.trigger("load_initial_json",
			qs.profiles || defaultProfilePath,
			qs.resource, this.isRemote);
	}

	componentDidMount() {
		return State.on("update", () => this.forceUpdate());
	}

	handleOpen() {
		return State.trigger("set_ui", "open");
	}

	render() {
		let bundleBar;
		const state = State.get();

		if (state.bundle) {
			bundleBar = <BundleBar bundle={state.bundle} />;
		}
		
		const resourceContent = (() => {
			if (state.ui.status === "loading") {
			return <div className="spinner"><img src="../img/ajax-loader.gif" /></div>;
		} else if (state.resource) {
			return <DomainResource node={state.resource} />;
		} else if (!state.bundle && (state.ui.status.indexOf("error") === -1)) {
			return <div className="row" style={{marginTop: "60px", marginBottom: "60px"}}><div className="col-xs-offset-4 col-xs-4">
				<button className="btn btn-primary btn-block" onClick={this.handleOpen.bind(this)}>
					Open Resource
				</button>
			</div></div>;
		}
		})();

		const error = (() => {
			if (state.ui.status === "profile_load_error") {
			return <div className="alert alert-danger">An error occured loading the FHIR profiles.</div>;
		} else if (state.ui.status === "resource_load_error") {
			return <div className="alert alert-danger">An error occured loading the resource.</div>;
		} else if (state.ui.status === "validation_error") {
			return <div className="alert alert-danger">Please fix errors in resource before continuing.</div>;
		}
		})();

                //actionWarning = if state.ui.status is "ref_warning"
                //	<RefWarning count={state.ui.count}, update={state.ui.update} />

		const navBar = this.isRemote ?
			<RemoteNavbar
				hasResource={state.resource ? true : undefined}
				appVersion={this.appVersion} 
				hasProfiles={state.profiles !== null}
			/>
		:
			<NavbarFred hasResource={state.resource ? true : undefined} appVersion={this.appVersion} />;

		return <div>
			{navBar}
			<div className="container" style={{marginTop: "50px", marginBottom: "50px"}}>
				{bundleBar}
				{error}
				{resourceContent}
				<Footer />
			</div>
			<OpenDialog show={state.ui.status === "open"} openMode={state.ui.openMode} />
			<ExportDialog show={state.ui.status === "export"}
				bundle={state.bundle}
				resource={state.resource}
			/>
		</div>;
	}
}


ReactDOM.render(<RootComponent />, document.getElementById("content"));
