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
import Select from 'react-select'
import {Container, Row, Col, Modal, Tabs, Tab, Button} from "react-bootstrap";

import State from "../state";

class ValueSetDialog extends React.Component {
    constructor(props) {
      super(...arguments);
      super(props);
      this.state = {
        showSpinner:false
      }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      switch (nextProps.resourceType) {
        case "CPGImmunizationActivity":
          return {
            valueset: nextProps.valueset["http://hl7.org/fhir/uv/ips/ValueSet/vaccines-gps-uv-ips"],
          };
      }
      prevState.valueset = null;
      return prevState;
    } 

    handleClose(e) {
        this.setState({showSpinner: false});
        this.setState({option: null});
        return State.emit("set_ui", "ready");
    }
    
    handleCodeChange(option) {
        this.setState({option: option.value});
    }

    handleInsert(e) {        
        State.emit("set_ui", "ready");
        let system = this.state.valueset.system;
        let code = this.state.option[1];
        let version = this.state.valueset.version;
        let display = this.state.option[0];
        let systemOID = "";
        State.emit("insert_from_code_picker", this.props.node, system, code, systemOID, version, display);
        this.setState({option: null});
    }

	buildOptions() {
		return this.state.valueset?.items.map((option, idx) => {
			return {value:option, label: option[0] + " | " + option[1]}
		});
	}
    
    renderCodePicker() {
        const inputElements = <div>
            <p>
                Choose from Valuset:
            </p>
            <Select 
                options={this.buildOptions()}
                onChange = {this.handleCodeChange.bind(this)}
            />
        </div>;

        return (
            <div className="row">
                <div className="col-md-12">
                    {inputElements}
                </div>
                <div className="col-md-12">
                    <button 
                        className="btn btn-primary btn-block" 
                        disabled={!this.state.option}
                        onClick={this.handleInsert.bind(this)}
                        style={{marginTop:"10px"}}
                    >
                        Select
                    </button>
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

        const title = "ValueSet Selector"

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

export default ValueSetDialog;
