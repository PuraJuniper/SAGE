import { BaseCard } from "./baseCard";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretRight, faInfoCircle, faUserDoctor } from '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import { Container, Row, Col } from "react-bootstrap";
import friendlyNames from "../../friendly-names.json";
import { ACTIVITY_DEFINITION, allFormElems, friendlyResourceRoot, getBorderPropsForType, getFormElementListForResource } from "./nameHelpers";

const SelectView = () => {
    return (
        <div style={{ marginTop: "50px", paddingRight: "12px" }}>
            <div className="row">
                <h3 className="col-lg-10 col-md-9" style={{ color: "#2a6b92" }}><b>Home Page</b></h3>
                <button className="navigate col-lg-2 col-md-3"
                    onClick={() => State.get().set("ui", { status: "collection" })}>
                    Saved Cards&nbsp;<FontAwesomeIcon icon={faCaretRight} />
                </button>
            </div>
            <div className="box">
                <Container fluid="lg">
                    <Row lg="4" md="3" sm="2" noGutters>
                        {
                            friendlyResourceRoot.RESOURCES.map(
                                (resourceType) => {
                                    if (resourceType.LIST) {
                                        return resourceType.LIST
                                        .filter(subResType => allFormElems(getFormElementListForResource(subResType.FHIR)).length > 0)
                                        .map(
                                            (resource, i) => {
                                                return (
                                                    <div style={{ padding: "10px" }} key={resource.FHIR}>
                                                        <Col>
                                                            <BaseCard
                                                                bsBg="sage-beige"
                                                                bsBorder={getBorderPropsForType(resourceType.SELF.FHIR)}
                                                                cardImage= {faUserDoctor}
                                                                IconColor = 'black'
                                                                header={resourceType.SELF.FRIENDLY}
                                                                title={resource.FRIENDLY}
                                                                hideHeader = {true}
                                                                wait={i * 25}
                                                                clickable={true}
                                                                profile={resource.DEFAULT_PROFILE_URI}
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