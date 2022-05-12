import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import "react-step-progress-bar/styles.css";
import State from "../state";
import { activityFieldSaveHandler, planFieldSaveHandler, fieldSaveHandler } from "./cardEditor";
import { getRelatedActivityNode } from './planDefEditor';
import Sidebar from "./sidebar";
import * as CardEditor from "../simplified/cardEditor";
import { generateCardNameString, generateResourceReference } from "../helpers/schema-utils";
import { ACTIVITY_DEFINITION, PLAN_DEFINITION } from "./nameHelpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretRight } from "@fortawesome/pro-solid-svg-icons";
export interface AuthoringState {
    submitInvalid: boolean,
    showSpinner: boolean,
    tab: string,
    version: string,
    date: string,
    status: string,
    experimental: boolean,
    copyright: string,
    approvalDate: string,
    lastReviewDate: string,
    author: string,
    editor: string,
    reviewer: string,
    CPGName: string,
    publisher: string,
    fhirText: string,
    fhirUrl: string,
    newResourceType: string,
    newResourceBundle: boolean
}




export default class Authoring extends React.Component<any, AuthoringState> {

    constructor(props: any) {

        super(props);
        this.state = State.get().author.authorings[State.get().author.pos]
    }
    render() {

        // console.log(this.state)
        return (
            <div style={{ display: "flex" }} >
                <Sidebar pageType='create card' pageTitle='Authoring Information'></Sidebar>
                <div style={{ flexGrow: 1, margin: "50px" }}>
                    <h3 id='page-title' className="col-lg-10 col-md-9">Authoring Information</h3>

                    <p style={{ fontSize: "12px", fontWeight: "bold" }}><span style={{ color: "red" }}>*</span> represents required fields.</p>

                    <Container>
                        <Row className="row">
                            <Col md="6">
                                <p style={{ marginTop: "10px" }}>Version:<span style={{ color: "red" }}>*</span></p>
                                <input
                                    className={(!this.state.version ? "form-control is-invalid" : "form-control")}
                                    value={this.state.version}
                                    onChange={(e) => {
                                        this.setState({ version: e.target.value });
                                    }}
                                />
                            </Col>
                            <Col md="6">
                                <p style={{ marginTop: "10px" }}>Date:</p>
                                <input
                                    className="form-control"
                                    type="date"
                                    value={this.state.date}
                                    onChange={(e) => {
                                        this.setState({ date: e.target.value });
                                    }}
                                />

                            </Col>
                            <Col md="6">
                                <p style={{ marginTop: "10px" }}>Status:<span style={{ color: "red" }}>*</span></p>
                                <select
                                    className="form-control input-sm"
                                    value={this.state.status}
                                    onChange={(e) => {
                                        this.setState({ status: e.target.value })
                                    }}
                                    // ref="inputField"
                                >
                                    <option value="draft">Draft (draft)</option>
                                    <option value="active">Active (active)</option>
                                    <option value="retired">Retired (retired)</option>
                                    <option value="unknown">Unknown (unknown)</option>
                                </select>
                            </Col>
                            <Col md="6">
                                <p style={{ marginTop: "10px" }}>Experimental:<span style={{ color: "red" }}>*</span></p>
                                <select
                                    className="form-control input-sm"
                                    value={this.state.experimental.toString()}
                                    onChange={(e) => {
                                        this.setState({ experimental: e.target.value == "true" ? true : false });
                                    }}
                                    // ref="inputField"
                                >
                                    <option value={"true"}>Yes</option>
                                    <option value={"false"}>No</option>
                                </select>
                            </Col>
                        </Row>
                        <Row className="row">
                            <Col md="6">
                                <p style={{ marginTop: "10px" }}>Publisher:<span style={{ color: "red" }}>*</span></p>
                                <input
                                    className={(!this.state.publisher ? "form-control is-invalid" : "form-control")}
                                    value={this.state.publisher}
                                    onChange={(e) => {
                                        this.setState({ publisher: e.target.value });
                                    }}
                                />
                            </Col>
                            <Col md="6">
                                <p style={{ marginTop: "10px" }}>Copyright:</p>
                                <input
                                    className="form-control"
                                    value={this.state.copyright}
                                    onChange={(e) => {
                                        this.setState({ copyright: e.target.value });
                                    }}
                                />
                            </Col>
                            <Col md="6">
                                <p style={{ marginTop: "10px" }}>Approval Date:</p>
                                <input
                                    className="form-control"
                                    value={this.state.approvalDate}
                                    type="date"
                                    onChange={(e) => {
                                        this.setState({ approvalDate: e.target.value });
                                    }}
                                />
                            </Col>
                            <Col md="6">
                                <p style={{ marginTop: "10px" }}>Last Review Date:</p>
                                <input
                                    className="form-control"
                                    value={this.state.lastReviewDate}
                                    type="date"
                                    onChange={(e) => {
                                        this.setState({ lastReviewDate: e.target.value });
                                    }}
                                />

                            </Col>
                        </Row>
                        <Row className="row">
                            <Col md="12">
                                <p style={{ marginTop: "10px" }}>CPG Name:<span style={{ color: "red" }}>*</span></p>
                                <input
                                    className={(!this.state.CPGName ? "form-control is-invalid" : "form-control")}
                                    value={this.state.CPGName}
                                    onChange={(e) => {
                                        this.setState({ CPGName: e.target.value });
                                    }}
                                />
                            </Col>
                        </Row>
                        <Row className="row">
                            <Col md="4">
                                <p style={{ marginTop: "10px" }}>Author:<span style={{ color: "red" }}>*</span></p>
                                <input
                                    className={(!this.state.author ? "form-control is-invalid" : "form-control")}
                                    value={this.state.author}
                                    onChange={(e) => {
                                        this.setState({ author: e.target.value });
                                    }}
                                />
                            </Col>
                            <Col md="4">
                                <p style={{ marginTop: "10px" }}>Editor:<span style={{ color: "red" }}>*</span></p>
                                <input
                                    className={(!this.state.editor ? "form-control is-invalid" : "form-control")}
                                    value={this.state.editor}
                                    onChange={(e) => {
                                        this.setState({ editor: e.target.value });
                                    }}
                                />
                            </Col>
                            <Col md="4">
                                <p style={{ marginTop: "10px" }}>Reviewer:<span style={{ color: "red" }}>*</span></p>
                                <input
                                    className={(!this.state.reviewer ? "form-control is-invalid" : "form-control")}
                                    value={this.state.reviewer}
                                    onChange={(e) => {
                                        this.setState({ reviewer: e.target.value });
                                    }}
                                />
                            </Col>
                        </Row>
                        <NavButtons
                            handleSave={() => {State.get().author.authorings[State.get().author.pos].set(this.state);}}
                            handleUpdateExistingCards={ () => {
                                const pdLength = State.get().bundle.resources.length;
                                for (let index = 0; index < pdLength; index++) {
                                    const pd = State.get().bundle.resources[index]
                                    const actNode = getRelatedActivityNode(pd);
                                    if (pd.schemaPath == PLAN_DEFINITION && actNode.node) {
                                        // //Name
                                        planFieldSaveHandler(pd, "name", generateCardNameString(pd.schemaPath, this.state, pd));
                                        activityFieldSaveHandler(actNode.node, "name", generateCardNameString(actNode.node.schemaPath, this.state, actNode.node))
                                        // //URL
                                        fieldSaveHandler("definitionCanonical", generateResourceReference(actNode.node.schemaPath, pd).referencedResourceUrl, actNode.node, pd)
                                        planFieldSaveHandler(pd, "url", generateResourceReference(pd.schemaPath, pd).referencedResourceUrl);
                                        activityFieldSaveHandler(actNode.node, "url", generateResourceReference(actNode.node.schemaPath, actNode.node).referencedResourceUrl)
                                        // version
                                        fieldSaveHandler("version", this.state.version, actNode.node, pd)
                                        //status
                                        fieldSaveHandler("status", this.state.status, actNode.node, pd)
                                        //experimental
                                        fieldSaveHandler("experimental", this.state.experimental, actNode.node, pd)
                                        //publisher
                                        fieldSaveHandler("publisher", this.state.publisher, actNode.node, pd)
                                    }
                                }
                            }}
                        />
                    </Container>
                </div>
            </div>
        );

    }
}
const NavButtons = (
    props: { 
        handleSave: () => void; 
        handleUpdateExistingCards: () => void;
    } ) => {
    const navigate = useNavigate();
    const [searchParams, _] = useSearchParams();
    const nextPage = searchParams.get('next') ?? 'create'

    const continueToCreateCardButton = <button type='button' className="navigate col-lg-2 col-md-3"
        onClick={() => {
            props.handleSave();
            navigate('/create');
        } }>
        {<> {"Next "} <FontAwesomeIcon icon={faCaretRight} /></>}
    </button>;
    return (
        <div style={{ display: "flex", marginTop: '1rem' }} >
            <button type='button' className="navigate-reverse col-lg-2 col-md-3"
                onClick={() => {
                    props.handleSave();
                    props.handleUpdateExistingCards();
                    navigate('/basic-home');
                }}>
                {<> {"Save and Exit"} </>}
            </button>
            {(State.get().bundle.resources.length < 2) && continueToCreateCardButton}

        </div>
    );
}
