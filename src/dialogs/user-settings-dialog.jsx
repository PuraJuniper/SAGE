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
import {Container, Row, Col, Modal, Tabs, Tab, Button} from "react-bootstrap";

import State from "../state";

const FHIRClient = require('../helpers/FHIRClient');

class UserSettingsDialog extends React.Component {
    constructor(props) {
        super(...arguments);
        this.state = {
            UMLSKey: State.get().UMLSKey,
            VSACEndpoint: State.get().VSACEndpoint,
            endpointVerified: null, // True if verified, false if failed verification, null if no verification attempted
            verifying: false, // Loading indicator
        };
    }

    componentDidUpdate(prevProps, prevState) {
    }

    handleClose(e) {
        this.setState({showSpinner: false});
        return State.trigger("set_ui", "ready");
    }
    
    handleSave(e) {
        State.get().set({
            VSACEndpoint: this.state.VSACEndpoint,
            UMLSKey: this.state.UMLSKey,
        })
        return State.trigger("set_ui", "ready");
    }
    
    // Attempts to request a known code
    handleTestEndpoint(e) {
        this.setState({verifying: true}, () => {
            FHIRClient.getOneCode(this.state.VSACEndpoint, this.state.UMLSKey).then((res) => {
                if (res) {
                    this.setState({endpointVerified: true});
                }
                else {
                    this.setState({endpointVerified: false});
                }
                this.setState({verifying: false});
            });
        });
    }

    handleEndpointChange(e) {
        this.setState({
            endpointVerified: null,
            VSACEndpoint: e.target.value,
        });
    }

    handleUMLSChange(e) {
        this.setState({
            UMLSKey: e.target.value,
        });
    }

    renderUserSettings() {
        const inputElements = <div>
            <p style={{marginTop: "20px"}}>
                VSAC Endpoint:
            </p>
            <textarea
                ref="endpoint"
                className="form-control"
                style={{marginTop: "10px", marginBottom: "10px"}}
                value={this.state.VSACEndpoint}
                onChange={this.handleEndpointChange.bind(this)}
            />
            <p style={{marginTop: "20px"}}>
                UMLS Key:
            </p>
            <textarea
                ref="umls"
                className="form-control"
                style={{marginTop: "10px", marginBottom: "10px"}}
                value={this.state.UMLSKey}
                onChange={this.handleUMLSChange.bind(this)}
            />
        </div>;

        const verifyStatus = this.state.endpointVerified ?
            <div>
                Success!
            </div>
            :
            <div>
                Failed
            </div>;

        const verifyButtonElement = <span>
            <button
                className="btn btn-primary btn-block"
                onClick={this.handleTestEndpoint.bind(this)}
                disabled={this.state.verifying}
            >
                Test Endpoint
            </button>
            {this.state.endpointVerified != null ? verifyStatus : undefined}
        </span>;

        const saveButtonElement = <div>
            <button
                className="btn btn-primary btn-block"
                onClick={this.handleSave.bind(this)}
            >
                Save Changes
            </button>
        </div>;

        return (
            <div className="row">
                <div className="col-md-12">
                    {inputElements}
                </div>
                <div
                    className="col-md-4 col-md-offset-4"
                    style={{marginBottom: "10px"}}
                >
                    {verifyButtonElement}
                    {saveButtonElement}
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
            : this.renderUserSettings();

        const title = "User Settings"

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

export default UserSettingsDialog;
