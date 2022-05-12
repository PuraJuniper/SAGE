import { faUserDoctor } from '@fortawesome/pro-solid-svg-icons';
import React from 'react';
import { Col, Container, Row } from "react-bootstrap";
import { NavigateFunction, useNavigate } from "react-router-dom";
import State from "../state";
import { BaseCard } from "./baseCard";
import { AUTHOR_THEN_CARD_ROUTE, AUTHOR_THEN_EXIT_ROUTE } from './basicView';
import { friendlyResourceRoot } from "./nameHelpers";
import Sidebar from "./sidebar";
import { Progress } from './topProgressBar';


export const CreateCardWorkflow = (navigate: NavigateFunction) => {
    //if first card of folder
    if (State.get().bundle.resources.length < 2) {
        return navigate(`/${AUTHOR_THEN_CARD_ROUTE}`)
    } else {
        return navigate('/create');
    }
}

const SelectView = () => {

    return (
        <div style={{display: "flex"}} >
                <Sidebar pageType='create card' pageTitle='What is the card type?'></Sidebar>
                <div style={{flexGrow: 1, margin: "50px"}}>
                <h3  id='page-title' className="col-lg-10 col-md-9">What is the card type?</h3>
            
                <Container fluid="lg">
                    <Row lg="4" md="3" sm="2" className="g-0" style={{'justifyContent': 'center'}}>  
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
            </div>
        </div>
    );
}
export default SelectView