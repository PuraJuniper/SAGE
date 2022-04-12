import React, { Dispatch, useEffect, useState } from "react";
import { SageCoding, WizardAction, WizardState } from './wizardLogic';
import { Button, Form, ListGroup, Card, Spinner, Overlay, Tooltip, OverlayTrigger, Popover } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus, faQuestion, faQuestionCircle, faSearch } from "@fortawesome/pro-solid-svg-icons";
import * as Bioportal from './bioportal';

import { CSSTransition, TransitionGroup } from "react-transition-group";
import { CSSTransitionStrictMode, HoverOverlay } from "../../helpers/CSSTransitionStrictMode";

const ALL_SYSTEMS = "__ALL_SYSTEMS__";

interface CqlWizardSelectCodesProps {
    wizDispatch: Dispatch<WizardAction>,
    wizState: WizardState,
}

export const CqlWizardSelectCodes: React.FunctionComponent<CqlWizardSelectCodesProps> = (props) => {
    const [searchInput, setSearchInput] = useState<string>("");
    const [searchResults, setSearchResults] = useState<SageCoding[]>([]);
    const [searchSystem, setSearchSystem] = useState<string>(ALL_SYSTEMS);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (props.wizState.codes.length === 0) {
            wizDispatch(['setCodes', [{
                code: 'test_code',
                display: 'test code',
                system: 'test',
                version: 'test',
            }]])
        }
    })

    const {
        wizState,
        wizDispatch,
    } = props;

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
                                <CSSTransitionStrictMode key={`${v.system} ${v.code} ${v.version}`} timeout={250} classNames="cql-wizard-code-transition">
                                    <HoverOverlay
                                        placement="right"
                                        overlay={
                                            <Popover id={`code-popover-${v.display}`}>
                                                <Popover.Header as="h3">{`${v.display}`}</Popover.Header>
                                                <Popover.Body>
                                                    {`System: ${v.system}`}
                                                    <br />
                                                    {`Code: ${v.code}`}
                                                    <br />
                                                    {v.version ? `Version: ${v.version}` : null}
                                                </Popover.Body>
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
                        const system = searchSystem === ALL_SYSTEMS ? undefined : [searchSystem];
                        Bioportal.searchForText(searchInput, system).then(v => {
                            setSearchResults(v);
                            setIsSearching(false);
                        })
                    }}
                >
                    <Form.Control autoFocus
                        onChange={(e) => setSearchInput(e.target.value)}
                        value={searchInput}
                    />
                    <Form.Control as="select"
                        onChange={(e) => setSearchSystem(e.target.value)} 
                        value={searchSystem}
                    >
                        <option key={ALL_SYSTEMS} value={ALL_SYSTEMS}>All Systems</option>
                        {Object.keys(Bioportal.ontologyToSystemAndVersion).map((system) => {
                            return <option key={system} value={system}>{system}</option>
                        })}
                    </Form.Control>
                    <Button
                        variant="secondary"
                        size="sm"
                        type="submit"
                        disabled={searchInput == ""}
                    >
                        <FontAwesomeIcon icon={faSearch} />
                    </Button>
                    {isSearching && <Spinner animation="border" variant="secondary" role="status" />}
                </Form>
                <div className="cql-wizard-select-code-input-result">
                    {searchResults.map(v =>
                        <Card key={`${v.system} ${v.code} ${v.version}`}>
                            <Card.Body>
                                <Card.Title>
                                    {v.display}
                                    {v.__sageDefinitions !== undefined || v.__sageSynonyms !== undefined ?
                                        <HoverOverlay
                                            placement="right"
                                            overlay={
                                                <Popover id={`search-result-popover-${v.system}-${v.code}`}>
                                                    <Popover.Body>
                                                        {v.__sageDefinitions ? [`Definition(s): ${v.__sageDefinitions.join(", ")}`, <br key="__sageDefinitions-br" />] : null}
                                                        {v.__sageSynonyms ? `Synonym(s): ${v.__sageSynonyms.join(", ")}` : null}
                                                    </Popover.Body>
                                                </Popover>
                                            }
                                        >
                                            <FontAwesomeIcon style={{marginLeft: '10px'}} icon={faQuestionCircle} />
                                        </HoverOverlay> :
                                        null
                                    }
                                </Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">
                                    {v.code} <i>{v.system}</i>
                                </Card.Subtitle>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={wizState.codes.some(existingCode => (existingCode.code === v.code && existingCode.system === v.system && existingCode.version === v.version)) !== false}
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
