import React from 'react';
import { BaseCard } from "./baseCard";


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGrid,faBookMedical,faCirclePlus } from '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import { Container, Row, Col, Card } from "react-bootstrap";
import friendlyNames from "../../friendly-names.json";
import { ACTIVITY_DEFINITION, allFormElems, friendlyResourceRoot, getBorderPropsForType, getFormElementListForResource } from "./nameHelpers";
import Sidebar from './sidebar';

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
        'textColor':'white',
        'FHIR': '',
    }
]
console.log(friendlyResourceRoot.RESOURCES[4].SELF.FHIR)
const BasicHomeView = () => {
    return (
        <div style={{display: "flex"}}>
             <Sidebar pageType='generic' pageTitle='Home Page'></Sidebar>
             <div style={{flexGrow: 1, margin: "50px"}}>
            <div className="row">
                <h3 id='page-title' className="col-lg-10 col-md-9">Home Page</h3>
            </div>
                <Container fluid="lg">
                    <Row lg="4" md="3" sm="2" noGutters>
                        {
                            listOfHomePage.map(
                                (resource, i) => {
                                    return (
                                        <div style={{ flex: '0 0 35%' , maxWidth: '35%' , padding: "10px" }} key={resource.FHIR}>
                                        <h4 style={{'fontSize':'10px'}}>{resource.header}</h4>
                                            <Col style={{ padding: "0px" }}>
                                                 <BaseCard
                                                    bsBg={resource.cardColor}
                                                    bsText={resource.textColor}
                                                    cardImage= {resource.cardImage}
                                                    IconColor = 'white'
                                                    IconSize= '60px'
                                                    header={resource.FHIR}
                                                    title={resource.title}
                                                    titleSize='20px'
                                                    hideHeader = {true}
                                                    wait={i * 25}
                                                    clickable={true}
                                                    profile={resource.profile}
                                                /> 
                                            </Col>
                                        </div>);
                                }
                            )
                        }
                    </Row>
                </Container>
                </div>
        </div>
    );
}
export default BasicHomeView