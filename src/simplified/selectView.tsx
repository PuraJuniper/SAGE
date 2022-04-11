import React from 'react';
import { BaseCard } from "./baseCard";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretRight, faInfoCircle, faUserDoctor } from '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import { Container, Row, Col } from "react-bootstrap";
import friendlyNames from "../../friendly-names.json";
import { ACTIVITY_DEFINITION, allFormElems, friendlyResourceRoot, getBorderPropsForType, getFormElementListForResource } from "./nameHelpers";
import { useNavigate } from "react-router-dom";
import { Progress } from './topProgressBar';
import Sidebar from "./sidebar";



const SelectView = () => {
    const navigate = useNavigate();

    return (
        <div style={{display: "flex"}} >
                <Sidebar pageType='create card' pageTitle='What is the card type?'></Sidebar>
                <div style={{flexGrow: 1, margin: "50px"}}>
                <h3  id='page-title' className="col-lg-10 col-md-9">What is the card type?</h3>
                <Progress pageTitle='What is the card type?' fhirType = 'activity'></Progress>
            
                <Container fluid="lg">
                    <Row lg="4" md="3" sm="2" noGutters  style={{'justifyContent': 'center'}}>  
                        {
                            friendlyResourceRoot.RESOURCES
                            .filter(subResType => subResType.SELF.FHIR === 'ActivityDefinition')
                            .map(
                                (resourceType) => {
                                    if (resourceType.LIST) {
                                        return resourceType.LIST
                                        .map(
                                            (resource, i) => {
                                                return (
                                                    <div style={{ padding: "10px" }} key={resource.FHIR}>
                                                        <Col>
                                                            <BaseCard
                                                                bsBg="sage-beige"
                                                                cardImage= {faUserDoctor}
                                                                IconColor = 'black'
                                                                header={resourceType.SELF.FRIENDLY}
                                                                title={resource.FRIENDLY}
                                                                hideHeader = {true}
                                                                wait={i * 25}
                                                                clickable={true}
                                                                profile={resource.DEFAULT_PROFILE_URI}
                                                                titleSize='15px'
                                                                IconSize= '50px'
                                                            /> 
                                                        </Col>
                                                    </div>);
                                            }
                                        );
                                    }
                                }
                            )
                        }
                    </Row>
                </Container>
            <button key="butDel" type='button' className="navigate col-lg-2 col-md-3"
                onClick={() => navigate('/basic-home')}>
                    Back
            </button>
            </div>
        </div>
    );
}
export default SelectView