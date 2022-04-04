import React from 'react';
import { BaseCard } from "./baseCard";


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGrid,faBookMedical,faCirclePlus } from '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import { Container, Row, Col, Card } from "react-bootstrap";
import friendlyNames from "../../friendly-names.json";
import { ACTIVITY_DEFINITION, allFormElems, friendlyResourceRoot, getBorderPropsForType, getFormElementListForResource } from "./nameHelpers";
import { HomeCard } from "./homeCard";

console.log(friendlyResourceRoot.RESOURCES)

const listOfHomePage = [
    {
        'header':'New Card',
        'title':'Create Cards',
        'cardImage':faCirclePlus,
        'cardColor':'sage-purple',
        'textColor':'white',
        'FHIR': '',
    },
    {
        'header':friendlyResourceRoot.RESOURCES[4].SELF.FRIENDLY,
        'title':'An Example Questionaire',
        'profile': friendlyResourceRoot.RESOURCES[4].SELF.DEFAULT_PROFILE_URI,
        'cardImage':faBookMedical,
        'cardColor':'sage-darkblue',
        'textColor':'white',
        'FHIR': friendlyResourceRoot.RESOURCES[4].SELF.FHIR
    },
    {
        'header':'Saved Cards',
        'title':'View Cards',
        'cardImage':faGrid,
        'cardColor':'sage-green',
        'textColor':'black',
        'FHIR': '',
    }
]

const BasicHomeView = () => {
    return (
        <div style={{ marginTop: "50px", paddingRight: "12px" }}>
            <div className="row">
                <h3 className="col-lg-10 col-md-9" style={{ color: "#2a6b92" }}><b>Home Page</b></h3>
            </div>

                <Container fluid="lg">
                    <Row lg="4" md="3" sm="2" noGutters>
                        {
                            listOfHomePage.map(
                                (resource, i) => {
                                    return (
                                        <div style={{ padding: "10px" }} key={resource.FHIR}>
                                        <h4 style={{'fontSize':'10px'}}>{resource.header}</h4>
                                            <Col style={{ padding: "0px" }}>
                                                <HomeCard
                                                    bsBg={resource.cardColor}
                                                    bsText={resource.textColor}
                                                    cardImage={resource.cardImage}
                                                    title={resource.title}
                                                    FHIR = {resource.FHIR} 
                                                    profile = {resource.profile} 
                                                    wait={i * 25}
                                                    clickable={true}
                                                />
                                            </Col>
                                        </div>);
                                }
                            )
                        }
                    </Row>
                </Container>
        </div>
    );
}
export default BasicHomeView