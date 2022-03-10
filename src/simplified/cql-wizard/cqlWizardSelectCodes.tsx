import React, { Dispatch, useEffect, useReducer, useState } from "react";
import { WizardAction, WizardState } from './wizardLogic';
import * as FHIRClient from '../../helpers/FHIRClient';
import { Button, Form, ListGroup, Card, Spinner, Overlay, Tooltip, OverlayTrigger, Popover } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus, faSearch } from "@fortawesome/pro-solid-svg-icons";

import { CSSTransition, TransitionGroup } from "react-transition-group";
import { CSSTransitionStrictMode, HoverOverlay } from "../../helpers/CSSTransitionStrictMode";


const systemDisplayToUrl = {
    'SNOMEDCT': 'http://snomed.info/sct',
    'ICD9CM': 'http://hl7.org/fhir/sid/icd-9-cm',
    'ICD10': 'http://hl7.org/fhir/sid/icd-10',
    'ICD10CM': 'http://hl7.org/fhir/sid/icd-10-cm',
    'NCI': 'http://ncimeta.nci.nih.gov',
    'LOINC': 'http://loinc.org',
    'RXNORM': 'http://www.nlm.nih.gov/research/umls/rxnorm',
    'UCUM': 'http://unitsofmeasure.org',
    'CPT': 'http://www.ama-assn.org/go/cpt',
    'CVX': 'http://hl7.org/fhir/sid/cvx'
  };

interface CqlWizardSelectCodesProps {
    wizDispatch: Dispatch<WizardAction>,
    wizState: WizardState,
}

export interface VsacResponse {
    system: string;
    systemName: string;
    systemOID: string;
    version: string;
    code: string;
    display: string;
}

export const CqlWizardSelectCodes: React.FunctionComponent<CqlWizardSelectCodesProps> = (props) => {
    const [code, setCode] = useState<string>("");
    const [system, setSystem] = useState<keyof (typeof systemDisplayToUrl)>(Object.keys(systemDisplayToUrl)[0] as keyof (typeof systemDisplayToUrl));
    const [vsacResponse, setVsacResponse] = useState<VsacResponse[]>([])
    const [isSearching, setIsSearching] = useState(false);

    const {
        wizState,
        wizDispatch,
    } = props;

    useEffect(() => {
        if (wizState.codes.length === 0) {
            wizDispatch(['setCodes', [{"system":"http://snomed.info/sct","systemName":"SNOMEDCT","systemOID":"2.16.840.1.113883.6.96","version":"http://snomed.info/sct/731000124108/version/2021-09","code":"TEMP TEST","display":"Chest pain (finding)"}]])
        }
    }, [wizState.codes.length, wizDispatch])

    return (
        <div className="cql-wizard-select-code-grid"> 
            <Card className="cql-wizard-select-code-selection-grid" border="primary">
                    <CSSTransition in={wizState.codes.length === 0} timeout={250} classNames="cql-wizard-content-transition" unmountOnExit>
                        <div className="cql-wizard-select-code-selection-empty text-muted">
                            <i>Search for a code on the right</i>
                        </div>
                    </CSSTransition>
                    <ListGroup>
                        <TransitionGroup component={null}>
                            {wizState.codes.map((v, i) => 
                                <CSSTransitionStrictMode key={`${v.systemOID} ${v.code} ${v.version}`} timeout={250} classNames="cql-wizard-code-transition">
                                    <HoverOverlay
                                        placement="right"
                                        overlay={
                                            <Popover id={`code-popover-${v.display}`}>
                                                <Popover.Title as="h3">{`${v.systemName}: ${v.code}`}</Popover.Title>
                                                <Popover.Content>
                                                    {`${v.systemOID}:${v.code}`}
                                                    <br />
                                                    {`Version: ${v.version}`}
                                                </Popover.Content>
                                            </Popover>
                                        }
                                    >
                                        <ListGroup.Item>
                                            <Button
                                                className="cql-wizard-code-selection-item-remove-btn" 
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => wizDispatch(['setCodes', wizState.codes.filter(vi => vi != v)])}
                                            >
                                                <FontAwesomeIcon icon={faMinus} />
                                            </Button>
                                            {v.display}
                                        </ListGroup.Item>
                                    </HoverOverlay>
                                </CSSTransitionStrictMode>
                            )}
                        </TransitionGroup>
                    </ListGroup>

            </Card>
            <Card className="cql-wizard-select-code-input-grid" border="secondary">
                <Form
                    className="cql-wizard-select-code-input-form"
                    onSubmit={(e)=>{
                        e.preventDefault();
                        e.stopPropagation();
                        setIsSearching(true);
                        FHIRClient.getCode(code, systemDisplayToUrl[system]).then((res: VsacResponse | null) => {
                            setVsacResponse(res ? [res, {...res, code: res.code + 1}, {...res, code: res.code + 2}, {...res, code: res.code + 3}, {...res, code: res.code + 4}] : []);
                            setIsSearching(false);
                        });
                    }}
                >
                    <Form.Control autoFocus
                        onChange={(e) => setCode(e.target.value)}
                        value={code}
                    />
                    <Form.Control as="select"
                        onChange={(e) => setSystem(e.target.value as keyof (typeof systemDisplayToUrl))} 
                        value={system}
                        custom
                    >
                        {Object.entries(systemDisplayToUrl).map((option) => {
                            return <option key={option[0]} value={option[0]}>{option[0]}</option>
                        })}
                    </Form.Control>
                    <Button
                        variant="secondary"
                        size="sm"
                        type="submit"
                        disabled={code == ""}
                    >
                        <FontAwesomeIcon icon={faSearch} />
                    </Button>
                    {isSearching && <Spinner animation="border" variant="secondary" role="status" />}
                </Form>
                <div className="cql-wizard-select-code-input-result">
                    {vsacResponse.map(v =>
                        <Card key={`${v.systemOID} ${v.code} ${v.version}`}>
                            <Card.Body>
                                <Card.Title>{v.display}</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">{v.code} <i>{v.systemName}</i></Card.Subtitle>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={wizState.codes.some(vCode => (vCode.code === v.code && vCode.systemOID === v.systemOID && vCode.version === v.version)) !== false}
                                    onClick={()=>{
                                        wizDispatch(['setCodes', wizState.codes.concat([v])]);
                                    }}
                                >
                                    Add Code <FontAwesomeIcon icon={faPlus} />
                                </Button>
                            </Card.Body>
                        </Card>
                    )}
                </div>
            </Card>
        </div>
    );
}
