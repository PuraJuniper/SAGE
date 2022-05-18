/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import ReactDOM from "react-dom";
import State from "./reactions";
import * as SchemaUtils from "./helpers/schema-utils";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCaretRight, faCaretLeft} from  '@fortawesome/pro-solid-svg-icons';

import NavbarFred from "./navbar";
import RemoteNavbar from "./remote-navbar";
import BundleBar from "./bundle-bar";
import RefWarning from "./ref-warning";
import Footer from "./footer";
import BasicHomeView from "./simplified/home"
import SelectView from "./simplified/selectView"
import Collection from "./simplified/collection"

import DomainResource from "./domain-resource/";
import CpgDialog from "./dialogs/cpg-dialog";
import OpenDialog from "./dialogs/open-dialog";
import ExportDialog from "./dialogs/export-dialog";
import CodePickerDialog from "./dialogs/code-picker-dialog";
import ChangeProfileDialog from "./dialogs/change-profile-dialog";
import ValueSetDialog from "./dialogs/valueset-dialog"
import UserSettingsDialog from "./dialogs/user-settings-dialog";

import AppInfo from "../package.json";
import SelectResourceDialog from "./dialogs/select-resource-canonical-dialog";
import { PlanDefEditor } from "./simplified/planDefEditor";
import { Alert } from "react-bootstrap";

type RootProps = Record<string, never>;
type RootState = {
	prevStatus: string
}
const changeLessContentStatuses = ["closedialog", "open", "basic-cpg", "advanced-cpg", "export"]
class RootComponent extends React.Component<RootProps, RootState> {
	appVersion: string;
	isRemote: boolean;

	constructor(props: RootProps) {
		super(props);
		const versionSegments = AppInfo.version.split(".");
		//only take the major and minor
		this.appVersion = versionSegments.slice(0,versionSegments.length-1).join(".");
		this.isRemote = false;
		this.state = {
			prevStatus: ""
		}
	}

	shouldComponentUpdate() {
		return this.state.prevStatus !== State.get().ui.status;
	}

	componentDidMount() {
		State.on("update", () => this.forceUpdate());
	}

	getSnapshotBeforeUpdate() {
		return window.pageYOffset;
	}

	componentDidUpdate(prevProps: RootProps, prevState: RootState, snapshot: any) {
		if (!changeLessContentStatuses.includes(State.get().ui.status)) {
			this.setState({prevStatus:State.get().ui.status});
		}
		window.scrollTo(0, snapshot);
	} 

	handleOpen() {
		return State.emit("set_ui", "open");
	}
	
	handleCpg() {
		return State.emit("set_ui", "cpg");
	}

	render() {
		let bundleBar;
		const state = State.get();
		const prevStatus = this.state.prevStatus;
		

		if (state.bundle.resources.length > 0 && state.mode !== "basic") {
			bundleBar = <BundleBar bundle={state.bundle} />;
		}

		const resourceContent = (() => {
			if (state.ui.status === "loading_sage_data") {
			return <div role="progressbar" aria-label="loading-symbol" className="spinner"><img src="../img/ajax-loader.gif" /></div>;
		} else if (state.ui.status === "basic-home" || 
				prevStatus === "basic-home" && changeLessContentStatuses.includes(state.ui.status)) {
			return <BasicHomeView />
		} else if (state.ui.status === "cards" || 
				prevStatus === "cards" && changeLessContentStatuses.includes(state.ui.status)) {
			return <SelectView />
		} else if (state.ui.status === "collection" || 
				prevStatus === "collection" && changeLessContentStatuses.includes(state.ui.status)) {
			return <Collection />
		} else if (state.bundle.resources.length > 0) {
			return (
					state.mode === "basic" ? 
					<PlanDefEditor planDefNode={state.bundle.resources[state.bundle.pos]} planDefPos={state.bundle.pos} newCard={false} /> :
					<DomainResource node={state.bundle.resources[state.bundle.pos]} errFields={state.errFields}/>
			);
		} 
		})();

		const error = (() => {
			if (state.ui.status === "profile_load_error") {
			return (
				<Alert variant="danger">An error occured loading the FHIR profiles.</Alert>
				);
		} else if (state.ui.status === "resource_load_error") {
			return (
				<Alert variant="danger">An error occured loading the resource.</Alert>
				);
		} else if (state.ui.status === "validation_error") {
			return (
				<Alert variant="danger">Please fix errors in resource before continuing.</Alert>
				);
		} else if (state.ui.status === "id_duplicate_error") {
			return (
				<Alert variant="danger">This resource has a duplicate ID.</Alert>
				);
		} else if (state.ui.status === "title_duplicate_error") {
			return (
				<Alert variant="danger">This resource has a duplicate title.</Alert>
				);
		} else if (state.ui.status === "url_duplicate_error") {
			return (
				<Alert variant="danger">This resource has a duplicate url.</Alert>
				);
		} else if (state.ui.status === "missing_title_error") {
			return (
				<Alert variant="danger">This resource needs a title.</Alert>
				);
		}
		})();

                //actionWarning = if state.ui.status is "ref_warning"
                //	<RefWarning count={state.ui.count}, update={state.ui.update} />

		const navBar = this.isRemote ?
			<RemoteNavbar
				hasResource={state.bundle ? true : undefined}
				appVersion={this.appVersion} 
				hasProfiles={state.profiles !== null}
			/>
		:
			<NavbarFred hasResource={state.bundle ? true : false} appVersion={this.appVersion} />;
		
		return <div>
			{navBar}
			<div className="container" style={{marginTop: "100px", marginBottom: "50px"}}>
				{bundleBar}
				{error}
				{resourceContent}
			</div>
			<OpenDialog 
				show={state.ui.status === "open"}
				openMode={state.ui.openMode}
				/>
			<CpgDialog
				show={["basic-cpg", "advanced-cpg"].includes(state.ui.status)}
				basic={state.ui.status === "basic-cpg"}	
				/>
			{state.bundle?.resources.length > 0 ? 
			<>
				<ExportDialog show={state.ui.status === "export"} bundle={state.bundle} />
				<ChangeProfileDialog show={state.ui.status === "change_profile"} nodeToChange={state.bundle.resources[state.bundle.pos]}
					profiles={state.profiles}/>
			</>
			: null}
			{state.ui.selectedNode ? 
				<>
					<ValueSetDialog show={state.ui.status === "valueSet"} node={state.ui.selectedNode} 
						profile={state.bundle.resources[state.bundle.pos].profile} valueset={state.valuesets} />
					<SelectResourceDialog show={state.ui.status === "select"} node={state.ui.selectedNode} 
						bundle = {state.bundle} resourceTypeFilter={state.ui.selectCanonicalResourceTypeFilter} /> 
					<CodePickerDialog show={state.ui.status === "codePicker"} node={state.ui.selectedNode} />
				</> :
				null}
			<UserSettingsDialog show={state.ui.status === "settings"} />
		</div>;
	}
}

export default RootComponent;
