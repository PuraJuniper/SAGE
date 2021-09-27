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

const systemDisplayToUrl = {
    'SNOMEDCT (http://snomed.info/sct)': 'http://snomed.info/sct',
    'ICD9CM (http://hl7.org/fhir/sid/icd-9-cm)': 'http://hl7.org/fhir/sid/icd-9-cm',
    'ICD10 (http://hl7.org/fhir/sid/icd-10)': 'http://hl7.org/fhir/sid/icd-10',
    'ICD10CM (http://hl7.org/fhir/sid/icd-10-cm)': 'http://hl7.org/fhir/sid/icd-10-cm',
    'NCI (http://ncimeta.nci.nih.gov)': 'http://ncimeta.nci.nih.gov',
    'LOINC (http://loinc.org)': 'http://loinc.org',
    'RXNORM (http://www.nlm.nih.gov/research/umls/rxnorm)': 'http://www.nlm.nih.gov/research/umls/rxnorm',
    'UCUM (http://unitsofmeasure.org)': 'http://unitsofmeasure.org',
    'CPT (http://www.ama-assn.org/go/cpt)': 'http://www.ama-assn.org/go/cpt',
    'CVX (http://hl7.org/fhir/sid/cvx)': 'http://hl7.org/fhir/sid/cvx'
  };

class CodePickerDialog extends React.Component {
    constructor(props) {
        super(...arguments);
        this.state = {
            system: systemDisplayToUrl[Object.keys(systemDisplayToUrl)[0]],
            code: "29857009",
            valid: false, // Whether the entered code and system define a valid code
            VSACResult: null, // Contains the last result from `FHIRClient.getCode()`
        };
    }

    componentDidUpdate(prevProps, prevState) {
    }

    handleClose(e) {
        this.setState({showSpinner: false});
        return State.trigger("set_ui", "ready");
    }
    
    handleCodeChange(e) {
        return this.setState({code: e.target.value});
    }
    
    handleSystemChange(e) {
        return this.setState({system: e.target.value});
    }

    handleVerify(e) {
        FHIRClient.getCode(this.state.code, this.state.system).then(res => {
            if (res) {
                this.setState({
                    VSACResult: res,
                    valid: true,
                });
            }
            else {
                this.setState({
                    VSACResult: res,
                    valid: false,
                });
            }
        });
    }

    handleInsert(system, code, systemOID, version, display, e) {        
        State.emit("set_ui", "ready");
        return State.emit("insert_from_code_picker", this.props.node, system, code, systemOID, version, display);
    }

	buildSystemDropdownOptions() {
		return Object.entries(systemDisplayToUrl).map((option, idx) => {
			return <option value={option[1]}>{option[0]}</option>
		});
	}
    
    renderCodePicker() {
        const inputElements = <div>
            <p style={{marginTop: "20px"}}>
                Code:
            </p>
            <textarea
                ref="code"
                className="form-control"
                style={{marginTop: "10px", marginBottom: "10px"}}
                onChange={this.handleCodeChange.bind(this)}
                value={this.state.code}
            />
            <select
                ref="system"
                className="form-control input-sm" 
                style={{margin: "10px"}}
                onChange={this.handleSystemChange.bind(this)} 
                value={this.state.system}
            >
                {this.buildSystemDropdownOptions()}
            </select>
        </div>;

        const verifyButtonElement = <div>
            <button
                className="btn btn-primary btn-block"
                onClick={this.handleVerify.bind(this)}
                disabled={this.state.code == ""}
            >
                Verify Code
            </button>
        </div>

        const VSACResult = this.state.VSACResult;
        const VSACResponseElement = VSACResult ? 
            <div>
                <div>System OID: {VSACResult.systemOID}</div>
                <div>Version: {VSACResult.version}</div>
                <div>Display: {VSACResult.display}</div>
                <button
                    onClick={this.handleInsert.bind(this, VSACResult.system, 
                        VSACResult.code, VSACResult.systemOID,
                        VSACResult.version, VSACResult.display)}
                    disabled={!this.state.valid}
                >
                    Pick this Code
                </button>
            </div>
            : undefined;
        
        console.log("Parsed VSAC result:", this.state.VSACResult);

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
                </div>
                <div>
                    {VSACResponseElement}
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
            : this.renderCodePicker();

        const title = "VSAC Code Picker"

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

export default CodePickerDialog;