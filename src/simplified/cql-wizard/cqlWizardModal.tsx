import React, { useEffect, useReducer, useState, Dispatch } from "react";
import { Button, Card, Modal, Pagination, Row } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CqlWizardSelectResource } from "./cqlWizardSelectResource";
import { faArrowLeft, faArrowRight, faCheck } from "@fortawesome/pro-solid-svg-icons";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { CqlWizardSelectCodes } from "./cqlWizardSelectCodes";
import { WizardAction, WizardPage, WizardReducer, WizardPagesArr, getNextPage, getPrevPage, initFromState, WizardState, StepStatus } from "./wizardLogic";
import { CqlWizardSelectFilters } from "./cqlWizardSelectFilters";
import { CSSTransitionStrictMode } from "../../helpers/CSSTransitionStrictMode";

// Get the title for the dialog header and the page content for the dialog body
function getTitleAndPage(wizardState: WizardState, wizardDispatch: Dispatch<WizardAction>): {title: string, pageComponent: JSX.Element} {
    switch(wizardState.page) {
        case WizardPage.SelectResource:
            return {
                title: "Which resource type do you want to search for?",
                pageComponent: <CqlWizardSelectResource wizState={wizardState} wizDispatch={wizardDispatch} />
            }
        case WizardPage.SelectCodes:
            return {
                title: `${wizardState.resType}: Which codes do you want to select?`,
                pageComponent: <CqlWizardSelectCodes wizState={wizardState} wizDispatch={wizardDispatch} />
            }
        case WizardPage.SelectFilters:
            return {
                title: `${wizardState.resType}: What restrictions should apply?`,
                pageComponent: <CqlWizardSelectFilters wizState={wizardState} wizDispatch={wizardDispatch} />
            }
    }
}

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
    
    const {title: pageTitle, pageComponent: pageContent} = getTitleAndPage(wizardState, wizardDispatch);
    
    // Page items for header pagination
    const paginationItems = WizardPagesArr.map((v) => 
        <Pagination.Item key={v} active={page==v}
            disabled={pageStatus[v] === StepStatus.Disabled || pageStatus[v] === StepStatus.Skipped}
            onClick={() => wizardDispatch(['changePage', v])}
        >
            <div className="cql-wizard-pagination-text">
                {(()=>{
                    switch(v) {
                        case WizardPage.SelectResource:
                            return "Select Resource";
                        case WizardPage.SelectCodes:
                            return "Select Codes";
                        case WizardPage.SelectFilters:
                            return "Select Restrictions";
                    }
                })()}
            </div>
        </Pagination.Item>
    );
    
    const [canProceed, nextPage] = getNextPage(page, pageStatus);
    const [canGoBack, prevPage] = getPrevPage(page, pageStatus);
    return (
        <Card
            className="cql-wizard-modal"
        >
            <Card.Header>
                <div className="cql-wizard-header-content">
                    <Pagination className="cql-wizard-pagination">
                        {paginationItems}
                    </Pagination>
                    <Modal.Title>{pageTitle}</Modal.Title>
                </div>
            </Card.Header>
            <Card.Body className="cql-wizard-modal-body">
                <div className="cql-wizard-body-content">
                    <Button variant="light" className="cql-wizard-nav-button" disabled={!canGoBack}
                        onClick={() => {
                            if (prevPage) {
                                wizardDispatch(['changePage', prevPage])
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </Button>
                    <div className="cql-wizard-page-content-closest-positioned-ancestor">
                        <TransitionGroup component={null}>
                            <CSSTransitionStrictMode classNames="cql-wizard-content-transition" key={page} timeout={300}>
                                <div className="cql-wizard-page-content">
                                    {pageContent}
                                </div>
                            </CSSTransitionStrictMode>
                        </TransitionGroup>
                    </div>
                    <Button variant={nextPage === null && canProceed ? "success" : "light"} className="cql-wizard-nav-button" disabled={!canProceed}
                        onClick={() => {
                            if (nextPage === null) {
                                handleSaveAndClose();
                            }
                            else {
                                wizardDispatch(['changePage', nextPage])
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={nextPage === null ? faCheck : faArrowRight} />
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}