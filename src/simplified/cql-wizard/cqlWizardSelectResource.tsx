import React, { Dispatch, useEffect, useReducer, useState } from "react";
import { Button } from "react-bootstrap";
import { CSSTransition } from "react-transition-group";
import { getSelectableResourceTypes, WizardAction, WizardState } from './wizardLogic';

interface CqlWizardSelectResourceProps {
    wizDispatch: Dispatch<WizardAction>,
    wizState: WizardState,
}

const rTypes = getSelectableResourceTypes();

export const CqlWizardSelectResource: React.FunctionComponent<CqlWizardSelectResourceProps> = (props) => {
    const [selectedRes, setSelectedRes] = useState(props.wizState.resType);
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        setSelectedRes(props.wizState.resType)
    }, [props.wizState.resType])
    
    return (
        <div className="cql-wizard-select-resource-container">
            <CSSTransition in={showWarning} classNames="cql-wizard-content-transition" timeout={300} unmountOnExit>
                <div className="cql-wizard-select-resource-warning">
                    <b className="cql-wizard-select-resource-warning-text">
                        Changing the selected resource will reset any selected codes and filters. Do you want to proceed?
                    </b>
                    <Button variant="secondary" onClick={() => {
                        setSelectedRes(props.wizState.resType);
                        setShowWarning(false);
                    }}>
                        No
                    </Button>
                    <Button variant="primary" onClick={() => props.wizDispatch(['selectExprType', selectedRes])}>
                        Yes
                    </Button>
                </div>
            </CSSTransition>
            <div className="cql-wizard-select-resource-grid">
                {rTypes.map(v => {
                    const selected = selectedRes == v;
                    return (
                        <Button key={v} active={selected} variant={"outline-primary"} 
                            onClick={()=>{
                                setSelectedRes(v);
                                if (props.wizState.resType != v && props.wizState.resType != '') {
                                    // Resource type is being changed from one to another
                                    setShowWarning(true);
                                }
                                else {
                                    props.wizDispatch(['selectExprType', v]);
                                }
                            }}
                        >
                            {v}
                        </Button>
                    );
                }
                )}
            </div>
        </div>
    );
}