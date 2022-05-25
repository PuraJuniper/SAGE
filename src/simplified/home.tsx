import { faBookMedical, faCirclePlus, faGrid, IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import React from 'react';
import { Col, Container, Row } from "react-bootstrap";
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { BaseCard } from "./baseCard";
import { SAVED_CARDS_ROUTE } from './basicView';
import { friendlyResourceRoot } from "./nameHelpers";
import { CreateCardWorkflow } from './selectView';



console.log(friendlyResourceRoot.RESOURCES)

interface homePageCardProps {
    title: string,
    profile?: string,
    cardImage: IconDefinition,
    cardColor: string,
    textColor: string,
    FHIR?: string,
    clickHandler: (navigate: NavigateFunction) => void
}

const listOfHomePage: homePageCardProps[] = [
    {
        'title': 'Create Cards',
        'cardImage': faCirclePlus,
        'cardColor': 'sage-purple',
        'textColor': 'white',
        clickHandler: CreateCardWorkflow
    },
    {
        'title': 'Saved Cards',
        'cardImage': faGrid,
        'cardColor': 'sage-green',
        'textColor': 'white',
        clickHandler: (navigate: NavigateFunction) => navigate(`/${SAVED_CARDS_ROUTE}`)
    }
]

const BasicHomeView = () => {
    const navigate = useNavigate();
    return (
        <div style={{ display: "flex" }}>
            <div style={{ flexGrow: 1, margin: "50px" }}>
                <div className="row">
                    <h3 id='page-title' className="col-lg-10 col-md-9">Home</h3>
                </div>
                <Container>
                    <Row style={{marginRight: "15%", marginLeft: "15%", minHeight: "15rem"}}>
                        {
                            listOfHomePage.map(
                                (resource, i) => {
                                    return (
                                        
                                        <Col key={`${resource.title}-${i}`}>
                                        <BaseCard
                                            bsBg={resource.cardColor}
                                            bsText={resource.textColor}
                                            cardImage={resource.cardImage}
                                            IconColor='white'
                                            IconSize='60px'
                                            header={resource.FHIR ?? ''}
                                            title={resource.title}
                                            titleSize='20px'
                                            hideHeader={true}
                                            wait={i * 25}
                                            onClick={() => resource.clickHandler(navigate)}
                                            profile={resource.profile}
                                        />

                                        </Col>
                                    );
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