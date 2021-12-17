/* eslint-disable no-undef */
/* eslint-disable react/no-string-refs */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import {Container, Row, Col, Modal, Tabs, Tab, Button} from "react-bootstrap";
import State from "../state";
import * as SchemaUtils from "../helpers/schema-utils";

class CpgDialog extends React.Component {
    constructor(props) {
        super(...arguments);
        this.state = {
            showSpinner: false,
            tab: "CPGNew",
            version:"1.0.0",
            date:"",
            status:"0",
            experimental:"",
            copyright:"",
            approvalDate:"",
            lastReviewDate:"",
            author:"author",
            editor:"editor",
            reviewer:"reviewer",
            CPGName: "cpgname",
            publisher: "publisher",
            fhirText: '{"resourceType": "Patient"}',
            fhirUrl: "",
            newResourceType: "Patient",
            newResourceBundle: false
        };
    }

    handleSelectFile(e) {
        //return this.refs.fileReaderInput.click();
        return this.handleFileSelected(e); 
    }

    handleFileSelected(e) {
        const file = __guard__(
            __guard__(e != null ? e.target : undefined, x1 => x1.files),
            x => x[0]
        );
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            this.loadTextResource(e.target.result);
            return this.setState({showSpinner: false});
        };
        reader.readAsText(file);
        return this.setState({showSpinner: true});
    }

    handleKeyDown(e) {
        if ((this.state.tab === "text" && e.ctrlKey) || e.metaKey) {
            return this.selectAll(this.refs.fhirText);
        }
    }

    handleDrag(action, e) {
        e.preventDefault();
        if (action === "over") {
            return this.setState({drag: true});
        } else if (action === "leave") {
            return this.setState({drag: false});
        } else if (action === "drop") {
            let droppedFiles;
            if (
                (droppedFiles =
                    e.dataTransfer != null ? e.dataTransfer.files : undefined)
            ) {
                e.target.files = droppedFiles;
                this.setState({drag: false});
                return this.handleFileSelected(e);
            }
        }
    }

    selectAll(domNode) {
        if (!domNode) {
            return;
        }
        domNode.focus();
        if (
            domNode.selectionStart === domNode.selectionEnd &&
            domNode.setSelectionRange
        ) {
            return domNode.setSelectionRange(0, domNode.value.length);
        }
    }

    loadTextResource(data) {
        try {
            const json = JSON.parse(data);
            return State.emit("load_json_resource", json);
        } catch (e) {
            return State.emit("set_ui", "load_error");
        }
    }

    handleLoadText(e) {
        return this.loadTextResource(this.state.fhirText);
    }

    handleTextChange(e) {
        return this.setState({fhirText: e.target.value});
    }

    handleLoadUrl(e) {
        if (!(this.state.fhirUrl.length > 2)) {
            return;
        }
        let $this = this;
        $.get(this.state.fhirUrl, function (data, status) {
            $this.loadTextResource(JSON.stringify(data));
        });
        State.emit("load_url_resource", this.state.fhirUrl);
        return e.preventDefault();
    }

    handleUrlChange(e) {
        return this.setState({fhirUrl: e.target.value});
    }

    handleLoadNew(e) {
        e.preventDefault();
        let json = {resourceType: this.state.newResourceType};
        if (this.state.newResourceBundle) {
            json = {resourceType: "Bundle", entry: [{resource: json}]};
        }
        return State.emit("load_json_resource", json);
    }

    handleNewTypeChange(e) {
        return this.setState({newResourceType: e.target.value});
    }

    handleNewBundleChange(e) {
        return this.setState({newResourceBundle: !this.state.newResourceBundle});
    }

    handleTabChange(key) {
        return this.setState({tab: key});
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            this.props.show === false ||
            (prevState.tab === this.state.tab && prevProps.show === this.props.show)
        ) {
            return;
        }

        // return window.setTimeout(() => {
        //     return this.refs[this.state.tab].focus();
        // }, 100);
    }

    handleClose(e) {
        this.setState({showSpinner: false});
        return State.emit("set_ui", "closedialog");
    }

    handleVersionChange(e) {
        this.setState({
            version: e.target.value,
        });
    }

    handleDateChange(e) {
        this.setState({
            date: e.target.value,
        });
    }

    handleCPGNameChange(e) {
        this.setState({
            CPGName: e.target.value,
        });
    }

    handleStatusChange(e) {
        this.setState({
            status: e.target.value,
        });
    }

    handleExperimentalChange(e) {
        this.setState({
            experimental: e.target.value,
        });
    }

    handleCopyrightChange(e) {
        this.setState({
            copyright: e.target.value,
        });
    }

    handleapprovaldateChange(e) {
        this.setState({
            approvalDate: e.target.value,
        });
    }

    handlelastreviewdateChange(e) {
        this.setState({
            lastReviewDate: e.target.value,
        });
    }

    handleAuthorNameChange(e) {
        this.setState({
            publisher: e.target.value,
        });
    }

    handleAuthorChange(e) {
        this.setState({
            author: e.target.value,
        });
    }

    handleEditorChange(e) {
        this.setState({
            editor: e.target.value,
        });
    }

    handleReviewerChange(e) {
        this.setState({
            reviewer: e.target.value,
        });
    }

    handleTabChange(key) {
        return this.setState({tab: key});
    }
    
    handleOpenResource(status, e) {
        if (!this.state.CPGName || !this.state.publisher) return;
		e.preventDefault();
        State.get().set({
            version: this.state.version,
            date: this.state.date,
            status: this.state.status,
            experimental: this.state.experimental,
            copyright: this.state.copyright,
            approvalDate: this.state.approvalDate,
            lastReviewDate: this.state.lastReviewDate,
            CPGName: this.state.CPGName,
            publisher: this.state.publisher,
            author: this.state.author,
            editor: this.state.editor,
            reviewer: this.state.reviewer,
        })
        if (this.props.basic) {
            State.get().set("mode", "basic");
            return State.get().set("ui", {status:"cards"});
        }
        State.get().set("mode", "advanced");
        var resourceJson = {resourceType: "PlanDefinition"};
        var json = {resourceType: "Bundle", entry: [{resource: resourceJson}]};
        const resourceProfile = SchemaUtils.getProfileOfResource(State.get().profiles, resourceJson);
		json.entry[0].resource.meta = {
			profile: [resourceProfile]
		};
        return State.emit("load_json_resource", json);
	}

    renderFileInput() {
        const dragClass = this.state.drag ? " dropzone" : "";
        return (
            <Container
                className={dragClass}
                onDrop={this.handleDrag.bind(this, "drop")}
                onDragOver={this.handleDrag.bind(this, "over")}
                onDragEnter={this.handleDrag.bind(this, "enter")}
                onDragLeave={this.handleDrag.bind(this, "leave")}
                animation="false"
            >
                <Row className="justify-content-md-center" style={{marginTop: "20px"}}>
                    <Col md="auto">
                        Choose (or drag and drop) a local JSON FHIR Resource or Bundle
                    </Col>
                </Row>
                <Row>
                    <Col>
                    <input
                            type = "file"
                            id = "fileUpload"
                            style={{display: "none"}}
                            onChange={(e) => {
                                State.get().set("mode", "advanced");
                                this.handleSelectFile.bind(this)(e);
                            }}
                            ref="fhirFile"
                        />
                        <label htmlFor="fileUpload" className="btn btn-primary btn-block" style={{marginTop: "20px"}}>
                            {`\t\t\t\t\tSelect File`}</label>
                    </Col>
                </Row>
            </Container>
        );
    }

    renderTextInput() {
        return (
            <div className="row">
                <div className="col-md-12">
                    <p style={{marginTop: "10px"}}>
                        Paste in a JSON FHIR Resource or Bundle:
                    </p>
                    <textarea
                        ref="fhirText"
                        className="form-control"
                        style={{height: "200px", marginTop: "10px", marginBottom: "10px"}}
                        onChange={this.handleTextChange.bind(this)}
                        value={this.state.fhirText}
                        onKeyDown={this.handleKeyDown.bind(this)}
                    />
                </div>
                <div
                    className="col-md-4 col-md-offset-4"
                    style={{marginBottom: "10px"}}
                >
                    <button
                        className="btn btn-primary btn-block"
                        onClick={(e) => {
                            State.get().set("mode", "advanced");
                            this.handleLoadText.bind(this)(e)
                        }}
                        disabled={this.state.fhirText.length < 3}
                    >{`\
\t\t\t\t\tLoad JSON\
`}</button>
                </div>
            </div>
        );
    }

    renderUrlInput() {
        return (
            <form onSubmit={this.handleLoadUrl.bind(this)}>
                <div className="row">
                    <div className="col-md-12">
                        <p style={{marginTop: "10px"}}>
                            Enter the URL for a JSON FHIR Resource or Bundle:
                        </p>
                        <input
                            ref="fhirUrl"
                            className="form-control"
                            style={{marginTop: "10px", marginBottom: "10px"}}
                            onChange={this.handleUrlChange.bind(this)}
                            value={this.state.fhirUrl}
                        />
                    </div>
                    <div
                        className="col-md-4"
                        style={{marginBottom: "10px"}}
                    >
                        <button
                            className="btn btn-primary btn-block"
                            onClick={(e) => {
                                State.get().set("mode", "advanced");
                                this.handleLoadUrl.bind(this)(e)
                            }}
                            disabled={this.state.fhirUrl.length < 3}
                        >{`\
\t\t\t\t\tRead JSON\
`}</button>
                    </div>
                </div>
            </form>
        );
    }

    renderNewCPGInput() {
        return (
            <Container>
                <Row className="row">
                    <Col md="6">   
                        <p style={{marginTop: "10px"}}>Version:</p>
                        <input
                            className="form-control"
                            value={this.state.version}
                            onChange={this.handleVersionChange.bind(this)}
                        />   
                    </Col>    
                    <Col md="6">
                        <p style={{marginTop: "10px"}}>Date:</p>
                        <input
                            className="form-control"
                            value={this.state.date}
                            onChange={this.handleDateChange.bind(this)}
                        />  
                    </Col>
                    <Col md="6">
                    <p style={{marginTop: "10px"}}>Status:</p>
                    <select
					        className="form-control input-sm" 
					        onChange = {(e) => {
						        this.handleStatusChange.bind(this)(e);
					        }}
					    ref="inputField"
				    >
                        <option value="0">Draft (draft)</option>
				        <option value="1">Active (active)</option>
                        <option value="2">Retired (retired)</option>
                        <option value="3">Unknown (unknown)</option>
                    </select>
                    </Col> 
                    <Col md="6">
                        <p style={{marginTop: "10px"}}>Experimental:</p>
                        <select
					        className="form-control input-sm" 
					        onChange = {(e) => {
						        this.handleExperimentalChange.bind(this)(e);
					        }}
					    ref="inputField"
				    >
				        <option value="Yes">Yes</option>
				        <option value="No">No</option>
			            </select>
                    </Col>
                </Row>
                <Row className="row">
                    <Col md="6">
                    <p style={{marginTop: "10px"}}>Publisher:</p>
                        <input
                            className="form-control"
                            value={this.state.publisher}
                            onChange={this.handleAuthorNameChange.bind(this)}
                        />
                    </Col>
                    <Col md="6">
                        <p style={{marginTop: "10px"}}>Copyright:</p>
                        <input
                            className="form-control"
                            value={this.state.copyright}
                            onChange={this.handleCopyrightChange.bind(this)}
                        />  
                    </Col>   
                    <Col md="6">
                        <p style={{marginTop: "10px"}}>Approval Date:</p>
                        <input
                            className="form-control"
                            value={this.state.approvalDate}
                            onChange={this.handleapprovaldateChange.bind(this)}
                        />  
                    </Col> 
                    <Col md="6">
                        <p style={{marginTop: "10px"}}>Last Review Date:</p>
                        <input
                            className="form-control"
                            value={this.state.lastReviewDate}
                            onChange={this.handlelastreviewdateChange.bind(this)}
                        />  
                    </Col> 
                </Row>
                <Row className="row">
                <Col md="12">                                     
                        <p style={{marginTop: "10px"}}>CPG Name:</p>
                        <input
                            className="form-control"
                            value={this.state.CPGName}
                            onChange={this.handleCPGNameChange.bind(this)}
                        />
                    </Col>
                </Row>
                <Row className="row">
                <Col md="4">                                     
                        <p style={{marginTop: "10px"}}>Author:</p>
                        <input
                            className="form-control"
                            value={this.state.author}
                            onChange={this.handleAuthorChange.bind(this)}
                        />
                    </Col>
                    <Col md="4">                                     
                        <p style={{marginTop: "10px"}}>Editor:</p>
                        <input
                            className="form-control"
                            value={this.state.editor}
                            onChange={this.handleEditorChange.bind(this)}
                        />
                    </Col>
                    <Col md="4">                                     
                        <p style={{marginTop: "10px"}}>Reviewer:</p>
                        <input
                            className="form-control"
                            value={this.state.reviewer}
                            onChange={this.handleReviewerChange.bind(this)}
                        />
                    </Col>
                </Row>
                <Row className="row">
                    <Col
                        md="auto"
                        className="col-xs-4 col-xs-offset-4"
                        style={{marginTop: "20px", marginBottom: "10px"}}
                    >
                        <button
                            className="btn btn-primary btn-block"
                            onClick={this.handleOpenResource.bind(this, "open")}
                        >
                            Open Resource
                        </button>
                    </Col>
                </Row>
            </Container>
        );
    }

    renderTabs() {
        return (
            <Tabs
                activeKey={this.state.tab}
                onSelect={this.handleTabChange.bind(this)}
                animation="false"
            >
                <Tab eventKey="CPGNew" title="Main" style={{opacity:1}}>
                    {this.renderNewCPGInput()}
                </Tab>
                <Tab eventKey="fhirFile" title="Local File" style={{opacity:1}}>
                    {this.renderFileInput()}
                </Tab>
                <Tab eventKey="fhirText" title="Paste JSON" style={{opacity:1}}>
                    {this.renderTextInput()}
                </Tab>
                <Tab eventKey="fhirUrl" title="Website URL" style={{opacity:1}}>
                    {this.renderUrlInput()}
                </Tab>
            </Tabs>
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

        const title = "Clinical Practice Guideline";

        const content = this.state.showSpinner
            ? this.renderSpinner()
            : this.renderTabs();

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

export default CpgDialog;

function __guard__(value, transform) {
    return typeof value !== "undefined" && value !== null
        ? transform(value)
        : undefined;
}