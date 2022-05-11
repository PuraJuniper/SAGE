import React, { useEffect, useReducer } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CqlWizardSelectResource } from "./cqlWizardSelectResource";
import { faCheck, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { WizardAction, WizardPage, WizardReducer, WizardPagesArr, getNextPage, getPrevPage, initFromState, WizardState, StepStatus } from "./wizardLogic";
import { CqlWizardSelectFilters } from "./cqlWizardSelectFilters";

interface CqlWizardModalProps {
    show: boolean,
    initialWizState: WizardState | null,
    onClose: () => void,
    onSaveAndClose: (wizState: WizardState) => void,
}

export const CqlWizardModal: React.FunctionComponent<CqlWizardModalProps> = (props) => {
    const [wizardState, wizardDispatch] = useReducer(WizardReducer, props.initialWizState, initFromState);

    useEffect(() => {
        wizardDispatch(["setState", initFromState(props.initialWizState)]);
    }, [props.initialWizState])
    
    // Convenience
    const {
        page,
        pageStatus,
        resType,
        codes,
        filters
    } = wizardState;

    const handleClose = () => props.onClose();
    const handleSaveAndClose = () => {
        // Reset wizard state since changes have been committed
        props.onSaveAndClose(wizardState);
        wizardDispatch(["setState", initFromState(null)]);
    }
    
    const [canSubmit] = getNextPage(WizardPage.SelectFilters, pageStatus);
    return (
        <Modal
            show={props.show}
            onHide={handleClose}
            size="xl"
            centered
            animation={true}
            contentClassName="cql-wizard-modal"
            backdrop="static"
        >
            <Modal.Header closeButton>
                <Modal.Title>Create a condition</Modal.Title>
            </Modal.Header>
            <Modal.Body className="cql-wizard-modal-body">
                <Container className="cql-wizard-body-content" fluid>
                    <Row className="gy-4">
                        <Col xs={12}>
                            <b>Which resource are you searching for?</b>
                            <CqlWizardSelectResource wizState={wizardState} wizDispatch={wizardDispatch} />
                        </Col>
                        {resType !== '' ?
                            <Col xs={12}>
                                <CqlWizardSelectFilters wizState={wizardState} wizDispatch={wizardDispatch} />
                            </Col> :
                            null}
                    </Row>
                </Container>
                <div className="cql-wizard-floating-buttons">
                    <Button onClick={handleClose} variant="sage-primary" className="shadow">
                        <FontAwesomeIcon icon={faXmark} style={{ marginRight: "0.5rem" }} />
                        Cancel
                    </Button>
                    <Button disabled={!canSubmit} onClick={handleSaveAndClose} variant="sage-secondary" className="shadow">
                        <FontAwesomeIcon icon={faCheck} style={{ marginRight: "0.5rem" }} />
                        Save Condition
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
}