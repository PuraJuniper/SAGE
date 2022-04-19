import React from "react";
import "react-step-progress-bar/styles.css";
import { Col, Container, Row } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "./sidebar";
import State from "../state";
import { Progress } from "./topProgressBar";
import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const activityPlanSteps =
[
    {name:"version", value:"1.0.0", type: 'input'},
    {name:"date", value:"", type: 'date'},
    {name:"status", value:"draft", type: 'select'},
    {name:"experimental", value: true, type: 'select'},
    {name:"publisher", value: "publisher", type: 'input'},
    {name:"copyright", value:"", type: 'input'},
    {name:"approvalDate", value:"", type: 'date'},
    {name:"lastReviewDate",value:"", type: 'date'},
    {name:"CPGName", value: "cpgname", type: 'input'},
    {name:"author", value:"author", type: 'input'},
    {name:"editor", value :"editor", type: 'input'},
    {name:"reviewer", value:"reviewer", type: 'input'},
]


export default class Authoring extends React.Component {
    constructor(props) {
        super(...arguments);
        this.state = {
            submitInvalid: false,
            showSpinner: false,
            tab: "CPGNew",
            version:"1.0.0",
            date:"",
            status:"draft",
            experimental: true,
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
    render() {
    console.log(this.state)
            return ( 
        <div style={{display: "flex"}} >
            <Sidebar pageType='create card' pageTitle='Authoring Information'></Sidebar>
            <div style={{flexGrow: 1, margin: "50px"}}>
            <h3  id='page-title' className="col-lg-10 col-md-9">Authoring Information</h3>
            <Progress pageTitle='Authoring Information' fhirType = 'activity'></Progress>
             
             <p style={{fontSize: "12px", fontWeight: "bold"}}><span style={{color: "red"}}>*</span> represents required fields.</p>
            
            <Container>
                <Row className="row">
                    <Col md="6">   
                        <p style={{marginTop: "10px"}}>Version:<span style={{color: "red"}}>*</span></p>
                        <input
                            className= {(!this.state.version ? "form-control is-invalid" : "form-control")}
                            value={this.state.version}
                            onChange = {(e) => {
                                this.setState({ version: e.target.value });
                            }}
                        />
                    </Col>    
                    <Col md="6">
                        <p style={{marginTop: "10px"}}>Date:</p>
                        <input
                             className= "form-control"
                             type="date"
                             value={this.state.date}
                            onChange = {(e) => {
                                this.setState({ date: e.target.value });
                            }}
                        />  

                    </Col>
                    <Col md="6">
                    <p style={{marginTop: "10px"}}>Status:<span style={{color: "red"}}>*</span></p>
                    <select
					        className="form-control input-sm" 
					        onChange = {(e) => {
						        this.setState({ status: e.target.value })
					        }}
					    ref="inputField"
				    >
                        <option value="draft">Draft (draft)</option>
				        <option value="active">Active (active)</option>
                        <option value="retired">Retired (retired)</option>
                        <option value="unknown">Unknown (unknown)</option>
                    </select>
                    </Col> 
                    <Col md="6">
                        <p style={{marginTop: "10px"}}>Experimental:<span style={{color: "red"}}>*</span></p>
                        <select
					        className="form-control input-sm" 
					        onChange = {(e) => {
						        this.setState({ experimental: e.target.value == "true" ? true : false });
					        }}
                            ref="inputField"
                        >
				        <option value = {true}>Yes</option>
				        <option value= {false}>No</option>
			            </select>
                    </Col>
                </Row>
                <Row className="row">
                    <Col md="6">
                    <p style={{marginTop: "10px"}}>Publisher:<span style={{color: "red"}}>*</span></p>
                    <input
                            className= {(!this.state.publisher ? "form-control is-invalid" : "form-control")}
                            value={this.state.publisher}
                            onChange = {(e) => {
                                this.setState({ publisher: e.target.value });
                            }}
                        />
                    </Col>
                    <Col md="6">
                        <p style={{marginTop: "10px"}}>Copyright:</p>
                        <input
                              className="form-control"
                              value={this.state.copyright}
                            onChange = {(e) => {
                                this.setState({ copyright: e.target.value });
                            }}
                        />  
                    </Col>   
                    <Col md="6">
                        <p style={{marginTop: "10px"}}>Approval Date:</p>
                        <input
                            className="form-control"
                            value={this.state.approvalDate}
                            type = "date"
                            onChange = {(e) => {
                                this.setState({ approvalDate: e.target.value });
                            }}
                        />  
                    </Col> 
                    <Col md="6">
                        <p style={{marginTop: "10px"}}>Last Review Date:</p>
                        <input
                            className="form-control"
                            value={this.state.lastReviewDate}
                            type = "date"
                            onChange = {(e) => {
                                this.setState({ lastReviewDate: e.target.value });
                            }}
                        />  

                    </Col> 
                </Row>
                <Row className="row">
                <Col md="12">                                     
                        <p style={{marginTop: "10px"}}>CPG Name:<span style={{color: "red"}}>*</span></p>
                        <input
                            className= {(!this.state.CPGName ? "form-control is-invalid" : "form-control")}
                            value={this.state.CPGName}
                            onChange = {(e) => {
                                this.setState({ CPGName: e.target.value });
                            }}
                        />
                    </Col>
                </Row>
                <Row className="row">
                <Col md="4">                                     
                        <p style={{marginTop: "10px"}}>Author:<span style={{color: "red"}}>*</span></p>
                        <input
                            className= {(!this.state.author ? "form-control is-invalid" : "form-control")}
                            value={this.state.author}
                            onChange = {(e) => {
                                this.setState({ author: e.target.value });
                            }}
                        />
                    </Col>
                    <Col md="4">                                     
                        <p style={{marginTop: "10px"}}>Editor:<span style={{color: "red"}}>*</span></p>
                        <input
                            className= {(!this.state.editor ? "form-control is-invalid" : "form-control")}
                            value={this.state.editor}
                            onChange = {(e) => {
                                this.setState({ editor: e.target.value });
                            }}
                        />
                    </Col>
                    <Col md="4">                                     
                        <p style={{marginTop: "10px"}}>Reviewer:<span style={{color: "red"}}>*</span></p>
                        <input
                            className= {(!this.state.reviewer ? "form-control is-invalid" : "form-control")}
                            value={this.state.reviewer}
                            onChange = {(e) => {
                                this.setState({ reviewer: e.target.value });
                            }}
                        />
                    </Col>
                </Row>
                <NavButtons
                    handleNext={() => {
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
                        });
                    }}
                />
            </Container>
            </div>
        </div>
        );     

        }
    }
const NavButtons = (props) => {
    const navigate = useNavigate();
    const [searchParams, _] = useSearchParams();
    const nextPage = searchParams.get('next') ?? 'create'

    return (
        <div style={{display: "flex", marginTop: '1rem'}} >
            <button  type='button' className="navigate-reverse col-lg-2 col-md-3"
                onClick={() => navigate('/basic-home')}>
                {<> <FontAwesomeIcon icon={faCaretLeft} /> {" Home"} </>}
            </button>
            <button  type='button' className="navigate col-lg-2 col-md-3"
                onClick={() => {
                    props.handleNext();
                    navigate(`/${nextPage}`);
                }}>
                {<> {"Next "} <FontAwesomeIcon icon={faCaretRight} /></>}
            </button>
            
        </div>
    );
}
