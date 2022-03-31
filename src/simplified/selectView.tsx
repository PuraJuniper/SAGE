import { BaseCard } from "./baseCard";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretRight, faInfoCircle,faGrid,faBookMedical,faCirclePlus } from '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import { Container, Row, Col, Card } from "react-bootstrap";
import friendlyNames from "../../friendly-names.json";
import { ACTIVITY_DEFINITION, allFormElems, friendlyResourceRoot, getBorderPropsForType, getFormElementListForResource } from "./nameHelpers";

console.log(friendlyResourceRoot.RESOURCES)

const listOfHomePage = [
    {
        'title':'New Card',
        'cardText':'Create Cards',
        'cardImage':'',
        'cardColor':'sage-purple'
    },
    {
        'title':'List Of Questions',
        'cardText':'An Example Questionaire',
        'cardImage':'',
        'cardColor':'sage-blue'
    },
    {
        'title':'Saved Cards',
        'cardText':'View Cards',
        'cardImage':'',
        'cardColor':'sage-green'
    }
]

const SelectView = () => {
    return (
    <div style={{ marginTop: "50px", paddingRight: "12px" }}>

        <h3 className="col-lg-10 col-md-9" style={{ color: "#2a6b92" }}><b>Home Page</b></h3>

        <Container fluid="lg">
            <Row lg="4" md="3" sm="2" noGutters>
                <div style={{ padding: "10px" }} key={listOfHomePage[0].title}>
                    <Col>
                        <h4 style={{'fontSize':'10px'}}>{listOfHomePage[0].title}</h4>
                        <Card bg="sage-purple" text= {'white'} >
                            <Card.Body style={{'padding': '10'}}>
                                <Row style={{'justifyContent': 'flex-end', 'margin':'0'}}>
                                    <span style={{ fontSize: "20px", textAlign: "right" }}>
                                        <a href='' target="_blank" rel="noreferrer" className="c-tooltip">
                                            <FontAwesomeIcon icon={faInfoCircle} style={{'color':'white'}} />
                                            <span className="c-tooltiptext">FHIR Docs</span>
                                        </a>
                                    </span>
                                </Row>
                                <Card.Title style={{ fontSize: "20px", textAlign: "center" }}>{listOfHomePage[0].cardText}</Card.Title>
                                <Row style={{'justifyContent': 'center', 'marginBottom':'30px'}}>
                                    <FontAwesomeIcon icon={faCirclePlus} style={{'color':'white', 'height':'60px'}} />
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </div>
                <div style={{ padding: "10px" }} key={listOfHomePage[1].title}>
                    <Col>
                        <h4 style={{'fontSize':'10px'}}>{listOfHomePage[1].title}</h4>
                        <Card bg="sage-darkblue" text= {'white'} >
                            <Card.Body style={{'padding': '10'}}>
                                <Row style={{'justifyContent': 'flex-end', 'margin':'0'}}>
                                    <span style={{ fontSize: "20px", textAlign: "right" }}>
                                        <a href='' target="_blank" rel="noreferrer" className="c-tooltip">
                                            <FontAwesomeIcon icon={faInfoCircle} style={{'color':'white'}} />
                                            <span className="c-tooltiptext">FHIR Docs</span>
                                        </a>
                                    </span>
                                </Row>
                                <Card.Title style={{ fontSize: "20px", textAlign: "center" }}>{listOfHomePage[1].cardText}</Card.Title>
                                <Row style={{'justifyContent': 'center', 'marginBottom':'30px'}}>
                                    <FontAwesomeIcon icon={faBookMedical} style={{'color':'white', 'height':'60px'}} />
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </div>
                <div style={{ padding: "10px"}} key={listOfHomePage[2].title}>
                    <Col>
                        <h4 style={{'fontSize':'10px'}}>{listOfHomePage[2].title}</h4>
                        <Card bg="sage-green">
                            <Card.Body style={{'padding': '10px'}}>
                                <Row style={{'justifyContent': 'flex-end', 'margin':'0'}}>
                                    <span style={{ fontSize: "20px", textAlign: "right" }}>
                                        <a href='' target="_blank" rel="noreferrer" className="c-tooltip">
                                            <FontAwesomeIcon icon={faInfoCircle} style={{'color':'white'}} />
                                            <span className="c-tooltiptext">FHIR Docs</span>
                                        </a>
                                    </span>
                                </Row>
                                <Card.Title style={{ fontSize: "20px", textAlign: "center" }}>{listOfHomePage[2].cardText}</Card.Title>
                                <Row style={{'justifyContent': 'center', 'marginBottom':'30px'}}>
                                    <FontAwesomeIcon icon={faGrid} style={{'color':'white', 'height':'60px'}} />
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </div>

                
            </Row>
        </Container>
    </div>

    );
}
export default SelectView