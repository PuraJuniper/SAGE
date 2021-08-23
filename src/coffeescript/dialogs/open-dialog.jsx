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

class OpenDialog extends React.Component {
    constructor(props) {
        super(...arguments);
        this.state = {
            showSpinner: false,
            tab: "fhirText",
            fhirText: '{"resourceType": "Patient"}',
            fhirUrl: "",
            newResourceType: "Patient",
            newResourceBundle: false
        };
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

    handleClose(e) {
        this.setState({showSpinner: false});
        return State.trigger("set_ui", "ready");
    }

    handleSelectFile(e) {
        return this.refs.fileReaderInput.click();
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

    loadTextResource(data) {
        try {
            const json = JSON.parse(data);
            return State.trigger("load_json_resource", json);
        } catch (e) {
            return State.trigger("set_ui", "load_error");
        }
    }

    handleLoadText(e) {
        return this.loadTextResource(this.state.fhirText);
    }

    handleTextChange(e) {
        return this.setState({fhirText: e.target.value});
    }

    // handleLoadUrl(e) {
    //   if (!(this.state.fhirUrl.length > 2)) {
    //     return;
    //   }
    //   State.trigger("load_url_resource", this.state.fhirUrl);
    //   return e.preventDefault();
    // }

    // beapen SPRINT 1 062518
    handleLoadUrl(e) {
        if (!(this.state.fhirUrl.length > 2)) {
            return;
        }
        let $this = this;
        $.get(this.state.fhirUrl, function (data, status) {
            $this.loadTextResource(JSON.stringify(data));
        });
        State.trigger("load_url_resource", this.state.fhirUrl);
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
        return State.trigger("load_json_resource", json);
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
                        <Button
                            style={{marginTop: "20px"}}
                            className="btn btn-primary btn-block"
                            onClick={this.handleSelectFile.bind(this)}
                            ref="fhirFile"
                        >{`\t\t\t\t\tSelect File`}
                        </Button>
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

    renderNewInput() {
        const resourceNames = [];
        const object = State.get().profiles;
        for (let k in object) {
            const v = object[k];
            if (
                __guard__(
                    __guard__(v[k] != null ? v[k].type : undefined, x1 => x1[0]),
                    x => x.code
                ) === "DomainResource"
            ) {
                resourceNames.push(k);
            }
        }
        const resourceOptions = [];
        for (let name of Array.from(resourceNames.sort())) {
            resourceOptions.push(
                <option value={name} key={name}>
                    {name}
                </option>
            );
        }

        return (
            <Container>
            <form onSubmit={this.handleLoadNew.bind(this)}>
                <Row className="row">
                    <Col md="12">
                        <p style={{marginTop: "20px"}}>Choose a FHIR Resource Type:</p>
                        <select
                            ref="fhirNew"
                            className="form-control"
                            style={{marginTop: "10px"}}
                            onChange={this.handleNewTypeChange.bind(this)}
                            value={this.state.newResourceType}
                        >
                            {resourceOptions}
                        </select>
                    </Col>
                    {!this.props.openMode ? this.renderNewBundleOption() : undefined}
                    <Col
                        md="auto"
                        className="col-xs-4 col-xs-offset-4"
                        style={{marginTop: "10px", marginBottom: "10px"}}
                    >
                        <button
                            className="btn btn-primary btn-block"
                            onClick={this.handleLoadNew.bind(this)}
                        >{`\
\t\t\t\t\tCreate Resource\
`}</button>
                    </Col>
                </Row>
            </form>
            </Container>
        );
    }

    renderNewBundleOption() {
        return (
            <Col md="12" className="checkbox" style={{marginTop: "20px"}}>
                <label>
                    <input
                        type="checkbox"
                        checked={this.state.newResourceBundle}
                        onChange={this.handleNewBundleChange.bind(this)}
                    />
                    {`\
\t\t\t\t Create in a Bundle\
`}
                </label>
            </Col>
        );
    }

    renderTabs() {
        return (
            <Tabs
                activeKey={this.state.tab}
                onSelect={this.handleTabChange.bind(this)}
                onKeyDown={this.handleKeyDown.bind(this)}
                animation="false"
            >
                <Tab eventKey="fhirFile" title="Local File" style={{opacity:1}}>
                    {this.renderFileInput()}
                </Tab>
                <Tab eventKey="fhirText" title="Paste JSON" style={{opacity:1}}>
                    {this.renderTextInput()}
                </Tab>
                <Tab eventKey="fhirUrl" title="Website URL" style={{opacity:1}}>
                    {this.renderUrlInput()}
                </Tab>
                <Tab eventKey="fhirNew" title="Blank Resource" style={{opacity:1}}>
                    {this.renderNewInput()}
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

        const title =
            this.props.openMode === "insert_before" ||
            this.props.openMode === "insert_after"
                ? "Insert Resource"
                : "Open Resource";

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

export default OpenDialog;

function __guard__(value, transform) {
    return typeof value !== "undefined" && value !== null
        ? transform(value)
        : undefined;
}
