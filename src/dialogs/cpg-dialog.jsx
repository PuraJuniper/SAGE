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

    handleOpen(status, e) {
		return State.trigger("set_ui", status);
	}
    
    handleResource(status, e) {
		e.preventDefault();
		return State.trigger("set_ui", status);
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
                        <p style={{marginTop: "20px"}}>Enter CPG Name:</p>
                        <input
                            className="form-control"
                            style={{marginTop: "10px", marginBottom: "10px"}}
                        />
                        <p style={{marginTop: "20px"}}>Enter Author Name:</p>
                        <input
                            className="form-control"
                            style={{marginTop: "10px", marginBottom: "10px"}}
                        />
                    </Col>
                    <Col
                        md="auto"
                        className="col-xs-4 col-xs-offset-4"
                        style={{marginTop: "10px", marginBottom: "10px"}}
                    >
                    <button
                            className="btn btn-primary btn-block"
                            onClick={this.handleResource.bind(this, "open")}
                        >{`\
\t\t\t\t\tOpen Resource\
`}</button>
                    </Col>
                </Row>
            </form>
            </Container>
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
                <Tab eventKey="fhirNew" title="Menu" style={{opacity:1}}>
                    {this.renderNewInput()}
                </Tab>
            </Tabs>
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
                :"Clinical Practice Guideline";

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
