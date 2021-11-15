/* eslint-disable no-undef */
/* eslint-disable react/no-string-refs */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import {Modal} from "react-bootstrap";
import { SageNodeInitialized, SimplifiedProfiles } from "../helpers/schema-utils";

import State from "../state";

type ChangeProfileProps = {
    show: boolean,
    nodeToChange: SageNodeInitialized,
    previousProfile: keyof SimplifiedProfiles,
    profiles: SimplifiedProfiles,
}

type ChangeProfileState = {
    newProfile: keyof SimplifiedProfiles,
    showSpinner: boolean,
}

class ChangeProfileDialog extends React.Component<ChangeProfileProps, ChangeProfileState> {
    constructor(props: ChangeProfileProps) {
        super(props);
        this.state = {
            newProfile: props.previousProfile,
            showSpinner: false,
        };
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps: ChangeProfileProps, prevState: ChangeProfileState) {
    }

    handleClose() {
        this.setState({showSpinner: false});
        return State.emit("set_ui", "ready");
    }

    handleSubmit() {
        State.emit("set_ui", "ready");
        return State.emit("change_profile", this.props.nodeToChange, this.state.newProfile);
    }

    handleSystemChange(e: React.ChangeEvent<HTMLSelectElement>) {
        return this.setState({newProfile: e.target.value});
    }

	buildProfilesDropdownOptions() {
        if (!this.props.nodeToChange) {
            return;
        }
		return Object.entries(this.props.profiles).filter((v) => {return v[1]['__meta']['type'] == this.props.nodeToChange.nodePath}).map((option, idx) => {
            return <option value={option[0]}>{option[1]['__meta']['id']}</option>
		});
	}

    renderCurrentProfile() {
        return <div>
            <h5>
                Current Profile:
            </h5>
            {this.props.previousProfile}
        </div>
    }
    
    renderProfileSelect() {
        const inputElements = <div>
            <p style={{marginTop: "20px"}}>
                Selected Profile:
            </p>
            <select
                ref="system"
                className="form-control input-sm" 
                style={{marginBottom: "10px"}}
                onChange={this.handleSystemChange.bind(this)} 
                value={this.state.newProfile}
            >
                {this.buildProfilesDropdownOptions()}
            </select>
        </div>;

        const verifyButtonElement = <div>
            <button
                className="btn btn-primary col-md-12"
                onClick={this.handleSubmit.bind(this)}
            >
                Change Profile
            </button>
        </div>

        return (
            <div className="row">
                <div className="col-md-12">
                    {inputElements}
                </div>
                <div
                    className="col-md-12"
                    style={{marginBottom: "10px"}}
                >
                    {verifyButtonElement}
                </div>
            </div>
        );
    }

    renderSpinner() {
        return (
            <div className="spinner">
                <img src="../img/ajax-loader.gif"/>
            </div>
        );
    }

    render() {
        if (!this.props.show) {
            return null;
        }

        const content = this.state.showSpinner
            ? this.renderSpinner()
            : <div>
                {this.renderCurrentProfile()}
                {this.renderProfileSelect()}
            </div>;

        const title = "Change Profile"

        return (
            <Modal show={true} onHide={this.handleClose.bind(this)} animation={false} size="lg">
                <Modal.Header closeButton={true}>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{content}</Modal.Body>
            </Modal>
        );
    }
}

export default ChangeProfileDialog;