import {BaseCard} from"./baseCard";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faInfoCircle} from  '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import { Container, Row, Col } from "react-bootstrap";
import friendlyNames from "../../friendly-names.json";
import { ACTIVITY_DEFINITION } from "./nameHelpers";

const SelectView = () => {    
    return (
        <div style={{marginTop:"50px", paddingRight:"12px"}}>
            <div className="row">
            <h3 className="col-lg-10 col-md-9" style={{color:"#2a6b92"}}><b>Make a Card</b></h3>
            <button className="navigate col-lg-2 col-md-3" 
                onClick={() => State.get().set("ui", {status:"collection"})}>
                Saved Cards&nbsp;<FontAwesomeIcon icon={faCaretRight} />
                            
            </button>
            </div>
            <div className="box">
            <Container fluid="lg">
                <Row lg="4" md="3" sm="2" noGutters> 
                {
                friendlyNames.RESOURCES.map(
                    (resourceType) => {
                        return resourceType.LIST.map(
                            (resource, i) => {
                                return (
                                <div style={{padding: "10px"}} key={resource.FHIR}>
                                <Col>
                                    <BaseCard 
                                        bsBg="sage-white"
                                        bsText="sage-blue"
                                        bsBorder={resourceType.SELF.FHIR == ACTIVITY_DEFINITION ? "activitydefinition" : "questionnaire"}
                                        header={resourceType.SELF.FRIENDLY}
                                        title={resource.FRIENDLY} 
                                        content={
                                        <span style={{fontSize:"20px", textAlign:"right"}}>
                                            <a href={resource.PROFILE_URI} target="_blank" rel="noreferrer" className="c-tooltip">
                                                <FontAwesomeIcon icon={faInfoCircle} />
                                                <span className="c-tooltiptext">FHIR Docs</span>
                                            </a>
                                        </span>
                                        }
                                        wait={i*25}
                                        clickable={true}
                                        profile={resource.PROFILE_URI}
                                    />
                                </Col>
                                </div>);
                            }
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

export default SelectView
