import React, { Dispatch, useEffect, useReducer, useState } from "react";
import { Button, Col, Row, Spinner } from "react-bootstrap";
import { CSSTransition } from "react-transition-group";
import { getSelectableResourceTypes, WizardAction, WizardState, createExpectedFiltersForResType, ElementFilter } from './wizardLogic';

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
        <div className="cql-wizard-select-resource-container">
            <CSSTransition in={showWarning} classNames="cql-wizard-content-transition" timeout={300} unmountOnExit>
                <div className="cql-wizard-select-resource-warning">
                    <Col>
                        <Row style={{'justifyContent': "space-evenly", 'marginBottom': '20px'}}>
                        <b className="cql-wizard-select-resource-warning-text">
                            Changing the selected resource will reset any selected codes and filters. Do you want to proceed?
                        </b>
                        </Row>
                        <Row style={{'justifyContent': "space-evenly", 'marginBottom': '20px'}}>
                        <Button variant="danger" size='lg' onClick={() => {
                            setSelectedRes(props.wizState.resType);
                            setShowWarning(false);
                        }}>
                            No
                        </Button>
                        <Button variant="primary" size='lg' onClick={async () => {
                            if (isLoading) return;
                            setShowWarning(false);
                            setIsLoading(true);
                            let newElementFilters: ElementFilter[] = [];
                            try {
                                props.wizDispatch(['disableActions']);
                                newElementFilters = await createExpectedFiltersForResType(selectedRes);
                            }
                            finally {
                                props.wizDispatch(['enableActions']);
                            }
                            props.wizDispatch(['selectExprType', selectedRes, newElementFilters])
                            setIsLoading(false);
                        }}>
                            Yes
                        </Button>
                        </Row>
                    </Col>    
                </div>
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
                                        newElementFilters = await createExpectedFiltersForResType(v);
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