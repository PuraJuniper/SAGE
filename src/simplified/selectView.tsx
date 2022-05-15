import { faUserDoctor } from '@fortawesome/pro-solid-svg-icons';
import React from 'react';
import { Col, Container, Row } from "react-bootstrap";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { generateResourceReference, incrementNextId } from '../helpers/schema-utils';
import State from "../state";
import { BaseCard } from "./baseCard";
import { AUTHOR_THEN_CARD_ROUTE, AUTHOR_THEN_EXIT_ROUTE } from './basicView';
import { ACTIVITY_DEFINITION, friendlyResourceRoot, PLAN_DEFINITION } from "./nameHelpers";
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
    const navigate = useNavigate();

    return (
        <Container className="p-5" >
            <Row>
                <h3 id='page-title' className='col'>What is the card type?</h3>
            </Row>
            <Row lg="4" md="3" sm="2" className="g-0" style={{'justifyContent': 'center'}}>  
                {
                    friendlyResourceRoot.RESOURCES
                    .filter(subResType => subResType.SELF.FHIR === 'ActivityDefinition')
                    .map(
                        (resourceType) => {
                            if (resourceType.LIST) {
                                return [...resourceType.LIST].sort((a, b) => // Sorting by friendly name alphabetically
                                    a.FRIENDLY > b.FRIENDLY ? 1 : (a.FRIENDLY < b.FRIENDLY ? -1 : 0)
                                ).map((resource, i) => {
                                    let disabled = true;
                                    // Sorry
                                    if (resource.DEFAULT_PROFILE_URI?.endsWith('cpg-medicationrequestactivity') || resource.DEFAULT_PROFILE_URI?.endsWith('cpg-collectinformationactivity')) {
                                        disabled = false;
                                    }
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
                                                    infoLink={resource.DEFAULT_PROFILE_URI}
                                                    onClick={() => {
                                                        if (State.get().bundle?.resources.length) {
                                                            State.get().bundle.set("pos", State.get().bundle.resources.length-1);
                                                            State.get().ui.set("openMode", "insert");
                                                        }
                                                        const nextId = incrementNextId(); // Saving some trouble by using this -- we should decide on a standard way to generate unique URLs
                                                        const { referencedResourceName, referencedResourceUrl } = generateResourceReference(ACTIVITY_DEFINITION, nextId);
                                                        const json = {
                                                            resourceType: "Bundle",
                                                            entry: [
                                                                {
                                                                    resource: {
                                                                        resourceType: ACTIVITY_DEFINITION,
                                                                        name: referencedResourceName,
                                                                        url: referencedResourceUrl,
                                                                        meta: {profile: [resource.DEFAULT_PROFILE_URI]}
                                                                    }
                                                                },
                                                                {
                                                                    resource: {
                                                                        resourceType: PLAN_DEFINITION,
                                                                        library: "", // r4 expects library as an array, cpg expects a single value (we are always using the cpg spec in basic view)
                                                                        action: [
                                                                            {
                                                                                title: "",
                                                                                description: "",
                                                                                condition: [],
                                                                                definitionCanonical: referencedResourceUrl
                                                                            }
                                                                        ],
                                                                        relatedArtifact: []
                                                                    }
                                                                }
                                                            ]
                                                        };
                                                        State.emit("load_json_resource", json);
                                                        // Set current editor position to the last resource (should be the PlanDefinition in `json` after the "load_json_resource" call)
                                                        State.emit("set_bundle_pos", State.get().bundle.resources.length-1);
                                                        navigate(`/edit/${State.get().bundle.resources.length-1}`);
                                                    }}
                                                    profile={resource.DEFAULT_PROFILE_URI}
                                                    titleSize='15px'
                                                    IconSize= '50px'
                                                    disabled={disabled}
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
            <Row>
                <button className="navigate col-lg-2 col-3" onClick={() => navigate('/basic-home')}>
                    Cancel
                </button>
            </Row>
        </Container>
    );
}
export default SelectView