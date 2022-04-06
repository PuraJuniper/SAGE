import React from 'react';
import { BaseCard } from "./baseCard";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretRight, faInfoCircle, faUserDoctor } from '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import { Container, Row, Col } from "react-bootstrap";
import friendlyNames from "../../friendly-names.json";
import { ACTIVITY_DEFINITION, allFormElems, friendlyResourceRoot, getBorderPropsForType, getFormElementListForResource } from "./nameHelpers";
import { useNavigate } from "react-router-dom";
import { Progress } from './breadcrumb';


const SelectView = () => {
    const navigate = useNavigate();

    return (
        <div>
           
                <h3 className="col-lg-10 col-md-9"><b>What Is The Card Type?</b></h3>
                <Progress pageTitle='What Is The Card Type?' fhirType = 'activity'></Progress>
            
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
    );
}
export default SelectView