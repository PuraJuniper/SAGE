import { Expression } from "fhir/r4";
import React, { useEffect, useReducer, useState, Dispatch } from "react";
import { Button, Modal, Pagination, Row } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CqlWizardSelectResource } from "./cqlWizardSelectResource";
import { faArrowLeft, faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { CqlWizardSelectCodes } from "./cqlWizardSelectCodes";
import { WizardAction, WizardPage, WizardReducer, WizardSteps, getNextPage, getPrevPage, initWizState, WizardState } from "./wizardLogic";

function getTitleAndPage(wizardState: WizardState, wizardDispatch: Dispatch<WizardAction>): {title: string, pageComponent: JSX.Element} {
    switch(wizardState.page) {
        case WizardPage.SelectResource:
            return {
                title: "Which resource type do you want to search for?",
                pageComponent: <CqlWizardSelectResource wizState={wizardState} wizDispatch={wizardDispatch} />
            }
        case WizardPage.SelectCodes:
            return {
                title: "Which codes do you want to select?",
                pageComponent: <CqlWizardSelectCodes wizState={wizardState} wizDispatch={wizardDispatch} />
            }
        case WizardPage.SelectFilters:
            return {
                title: "What else should this hold for this resource?",
                pageComponent: <b>Select Filters</b>
            }
    }
}

interface CqlWizardModalProps {
    show: boolean,
    expression: Expression | null,
    onClose: () => void,
    onSaveAndClose: (expr: Expression) => void,
}

export const CqlWizardModal: React.FunctionComponent<CqlWizardModalProps> = (props) => {
    const [curExpr, setCurExpr] = useState<Expression | null>(props.expression);
    const [wizardState, wizardDispatch] = useReducer(WizardReducer, curExpr, initWizState);
    
    // Convenience
    const {
        page,
        pageDisabled,
        resType,
        codes,
        filters
    } = wizardState;

    const handleClose = () => props.onClose();
    const handleSaveAndClose = (expr: Expression) => props.onSaveAndClose(expr);
    
    const {title: pageTitle, pageComponent: pageContent} = getTitleAndPage(wizardState, wizardDispatch);
    
    const paginationItems = WizardSteps.map((v) => 
        <Pagination.Item key={v} active={page==v} disabled={pageDisabled[v]} onClick={() => wizardDispatch(['changeStep', v])}>
            {v}
        </Pagination.Item>
    );
    
    const [canProceed, nextPage] = getNextPage(page, pageDisabled);
    const [canGoBack, prevPage] = getPrevPage(page, pageDisabled);
    return (
        <Modal
            show={props.show}
            onHide={handleClose}
            size="xl"
            centered
            contentClassName="cql-wizard-modal"
        >
            <Modal.Header>
                <div className="cql-wizard-header-content">
                    <Pagination className="cql-wizard-pagination">
                        {paginationItems}
                    </Pagination>
                    <Modal.Title>{pageTitle}</Modal.Title>
                </div>
            </Modal.Header>
            <Modal.Body className="cql-wizard-modal-body">
                <div className="cql-wizard-body-content">
                    <Button variant="light" className="cql-wizard-nav-button" disabled={!canGoBack}
                        onClick={() => {
                            if (prevPage) {
                                wizardDispatch(['changeStep', prevPage])
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </Button>
                    <div className="cql-wizard-page-content-closest-positioned-ancestor">
                        <TransitionGroup component={null}>
                            <CSSTransition classNames="cql-wizard-content-transition" key={page} timeout={300}>
                                <div className="cql-wizard-page-content">
                                    {pageContent}
                                </div>
                            </CSSTransition>
                        </TransitionGroup>
                    </div>
                    <Button variant="light" className="cql-wizard-nav-button" disabled={!canProceed}
                        onClick={() => {
                            if (nextPage) {
                                wizardDispatch(['changeStep', nextPage])
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={faArrowRight} />
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
}