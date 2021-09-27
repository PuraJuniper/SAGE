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
                <Tab eventKey="CPGNew" title="Menu" style={{opacity:1}}>
                    {this.renderNewCPGInput()}
                </Tab>
            </Tabs>
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
