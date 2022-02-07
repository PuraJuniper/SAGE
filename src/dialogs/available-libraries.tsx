import { Modal, Tab, Row, Col, ListGroup, Tabs } from "react-bootstrap";
import State from '../state';

interface AvailableLibrariesDialogProps {
    showEditor?: boolean,
    show: boolean,
    onHide: () => void,
}

export default function AvailableLibrariesDialog(props: AvailableLibrariesDialogProps) {
    const libraries = State.get().simplified.libraries;

    const tabsAndContent = Object.keys(libraries).map((v) => {
            return {
                libraryIdentifier: v,
                libraryElement: Object.keys(libraries[v].library.expressions).map((expr) => {
                    return (
                        <div key={expr}>
                            {`${expr}`}
                        </div>
                    );
                }
                ),
                ahrqId: libraries[v].ahrqId
            };
        });

        return (
        <Modal show={props.show} onHide={props.onHide} size="lg">
            <Modal.Header closeButton={true}>
                <Modal.Title>Available Libraries</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tab.Container>
                    <Row>
                        <Col sm={4}>
                            <ListGroup>
                                {tabsAndContent.map((v) => 
                                    <ListGroup.Item key={v.libraryIdentifier} action eventKey={v.libraryIdentifier}>
                                        {v.libraryIdentifier}
                                    </ListGroup.Item>
                                )}
                            </ListGroup>
                        </Col>
                        <Col sm={8}>
                            <Tab.Content>
                                {tabsAndContent.map((v) => 
                                    <Tab.Pane key={v.libraryIdentifier} eventKey={v.libraryIdentifier}>
                                        {v.libraryElement}
                                        {v.ahrqId ? 
                                            <button
                                                onClick={() => State.emit("open_ahrq_artifact", v.ahrqId)}
                                            >
                                                Open in CQL Editor
                                            </button> :
                                            undefined
                                        }
                                    </Tab.Pane>
                                )}
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </Modal.Body>
        </Modal>
    );
}