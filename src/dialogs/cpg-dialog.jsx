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

class CpgDialog extends React.Component {
    constructor(props) {
        super(...arguments);
        this.state = {
            showSpinner: false,
            tab: "CPGNew",
            CPGName: "",
            authorName: "",
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

        return window.setTimeout(() => {
            return this.refs[this.state.tab].focus();
        }, 100);
    }

    handleClose(e) {
        this.setState({showSpinner: false});
        return State.trigger("set_ui", "ready");
    }

    handleCPGNameChange(e) {
        this.setState({
            CPGName: e.target.value,
        });
    }

    handleAuthorNameChange(e) {
        this.setState({
            authorName: e.target.value,
        });
    }

    handleTabChange(key) {
        return this.setState({tab: key});
    }
    
    handleOpenResource(status, e) {
		e.preventDefault();
        State.get().set({
            CPGName: this.state.CPGName,
            authorName: this.state.authorName,
        })
		return State.trigger("set_ui", status);
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
                            onChange={this.handleSelectFile.bind(this)}
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
                    <p style={{marginTop: "20px"}}>
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
                        onClick={this.handleLoadText.bind(this)}
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
                        <p style={{marginTop: "20px"}}>
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
                            onClick={this.handleLoadUrl.bind(this)}
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
                    <Col md="12">                                                
                        <p style={{marginTop: "20px"}}>Enter CPG Name:</p>
                        <input
                            className="form-control"
                            style={{marginTop: "10px", marginBottom: "10px"}}
                            value={this.state.CPGName}
                            onChange={this.handleCPGNameChange.bind(this)}
                        />
                        <p style={{marginTop: "20px"}}>Enter Author Name:</p>
                        <input
                            className="form-control"
                            style={{marginTop: "10px", marginBottom: "10px"}}
                            value={this.state.authorName}
                            onChange={this.handleAuthorNameChange.bind(this)}
                        />
                    </Col>
                    <Col
                        md="auto"
                        className="col-xs-4 col-xs-offset-4"
                        style={{marginTop: "10px", marginBottom: "10px"}}
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