import React, { Dispatch, useEffect, useReducer, useState } from "react";
import { Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { CSSTransition } from "react-transition-group";
import { getSelectableResourceTypes, WizardAction, WizardState, ElementFilter, memoizedCreateExpectedFiltersForResType } from './wizardLogic';

interface CqlWizardSelectResourceProps {
    wizDispatch: Dispatch<WizardAction>,
    wizState: WizardState,
}

const rTypes = getSelectableResourceTypes();

export const CqlWizardSelectResource: React.FunctionComponent<CqlWizardSelectResourceProps> = (props) => {
    const [selectedRes, setSelectedRes] = useState(props.wizState.resType);
    const [showWarning, setShowWarning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setSelectedRes(props.wizState.resType)
    }, [props.wizState.resType])
    
    return (
        <div className="cql-wizard-page-content-closest-positioned-ancestor">
            <CSSTransition in={showWarning} classNames="cql-wizard-content-transition" timeout={300} unmountOnExit>
                <Container className="cql-wizard-select-resource-warning">
                    <Row className="gy-4 justify-content-center">
                        <Col xs={12}>
                            <b>Changing the selected resource will reset any selected codes and filters. Do you want to proceed?</b>
                        </Col>
                        <Col xs={3}>
                            <Button variant="danger" size='lg' onClick={() => {
                                setSelectedRes(props.wizState.resType);
                                setShowWarning(false);
                            }}>
                                No
                            </Button>
                        </Col>
                        <Col xs={3}>
                            <Button variant="primary" size='lg' onClick={async () => {
                                if (isLoading) return;
                                setShowWarning(false);
                                setIsLoading(true);
                                let newElementFilters: ElementFilter[] = [];
                                try {
                                    props.wizDispatch(['disableActions']);
                                    newElementFilters = await memoizedCreateExpectedFiltersForResType(selectedRes);
                                }
                                finally {
                                    props.wizDispatch(['enableActions']);
                                }
                                props.wizDispatch(['selectExprType', selectedRes, newElementFilters])
                                setIsLoading(false);
                            }}>
                                Yes
                            </Button>
                        </Col>
                    </Row>    
                </Container>
            </CSSTransition>
            <div className="cql-wizard-select-resource-grid">
                {rTypes.map(v => {
                    const selected = selectedRes == v;
                    return (
                        <Button key={v} active={selected} variant={"outline-secondary"} 
                            onClick={async ()=>{
                                if (isLoading) return;
                                setIsLoading(true);
                                setSelectedRes(v);
                                if (props.wizState.resType != v && props.wizState.resType != '') {
                                    // Resource type is being changed from one to another
                                    setShowWarning(true);
                                }
                                else {
                                    let newElementFilters: ElementFilter[] = [];
                                    try {
                                        props.wizDispatch(['disableActions']);
                                        newElementFilters = await memoizedCreateExpectedFiltersForResType(v);
                                    }
                                    finally {
                                        props.wizDispatch(['enableActions']);
                                    }
                                    props.wizDispatch(['selectExprType', v, newElementFilters]);
                                }
                                setIsLoading(false);
                            }}
                        >
                            {v}
                            {selected && isLoading ?
                                <Spinner style={{marginLeft: "5px"}} as="span" size="sm" animation={"border"} /> :
                                null}
                        </Button>
                    );
                }
                )}
            </div>
        </div>
    );
}