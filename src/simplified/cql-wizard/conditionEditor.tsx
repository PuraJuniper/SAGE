import { PlanDefinitionActionCondition } from "fhir/r4";
import React, { useState } from "react";
import { Button, ListGroup, Card, InputGroup, Form, Container, Row, Col } from "react-bootstrap";
import { CqlWizardModal } from "./cqlWizardModal";
import { convertFormInputToNumber } from "./cqlWizardSelectFilters";
import { CodeFilterType, DateFilterType, findEditableCondition, saveEditableCondition, WizardState } from "./wizardLogic";
import * as SchemaUtils from "../../helpers/schema-utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faPlus, faTrash } from "@fortawesome/pro-solid-svg-icons";
import { propTypes } from "react-bootstrap/esm/Image";
import { CardTabTitle } from "../savedCards";
import { trim } from "lodash";
import { capitalizeWord } from "../nameHelpers";

/**
 * Types required for the condition editor
 */
export enum AggregateType {
    Exists = "exists",
    DoesNotExist = "doesNotExist",
    AtLeast = "atLeast",
    NoMoreThan = "noMoreThan"
}
export interface WizExprAggregate {
    aggregate: AggregateType,
    count?: number,
}
export interface WizExpression {
    curWizState: WizardState,
    exprAggregate: WizExprAggregate,
}
export interface SubExpression {
    subExpr: (WizExpression | SubExpression)[],
    subExprBool: 'and' | 'or',
}
export interface EditableCondition {
    expr: SubExpression,
    conditionId: string,
}

function createNewWizExpression(wizState: WizardState): WizExpression {
    return {
        curWizState: wizState,
        exprAggregate: {
            aggregate: AggregateType.Exists
        }
    }
}

interface ConditionEditorProps {
    pdConditions: PlanDefinitionActionCondition[],
    setPdConditions: (newConditions: PlanDefinitionActionCondition[]) => void,
}

export const ConditionPreview = (props: ConditionEditorProps) => {
    const condition = findEditableCondition(props.pdConditions);
    return (
        <>
            {condition === null ? null :
                <SubExpressionElement
                    subExpression={condition.expr}
                    handleEditSubExpression={function (newSubExpr: SubExpression): void {
                        throw new Error("Function not implemented.");
                    }}
                    handleDeleteSubExpression={function (): void {
                        throw new Error("Function not implemented.");
                    }}
                    isPreview={true} />
            }
        </>
    )
}

export const ConditionEditor = (props: ConditionEditorProps) => {
    // `draftCondition` maps to the single PlanDefinitionActionCondition that represents the condition built in this editor  
    const [draftCondition, setDraftCondition] = useState<EditableCondition | null>(() => findEditableCondition(props.pdConditions));
    const [showNewWizard, setShowNewWizard] = useState(false);

    return (
        <div className="condition-editor-body">
            <React.StrictMode>
                {draftCondition === null ?
                    <>
                        {showNewWizard ?
                            <FreshWizardModal onClose={(savedState) => {
                                if (savedState !== undefined) {
                                    const newCond: EditableCondition = {
                                        conditionId: `index-${SchemaUtils.getNextId()}`, // Need some unique id
                                        expr: {
                                            subExpr: [createNewWizExpression(savedState)],
                                            subExprBool: "and",
                                        }
                                    };
                                    const newCondition: PlanDefinitionActionCondition = {
                                        id: newCond.conditionId,
                                        expression: {
                                            language: "text/cql",
                                            expression: newCond.conditionId,
                                        },
                                        kind: "applicability",
                                    }
                                    props.setPdConditions(props.pdConditions.concat(newCondition));
                                    saveEditableCondition(newCond.conditionId, newCond);
                                    setDraftCondition(newCond)
                                }
                                setShowNewWizard(false);
                            }} /> :
                            null}
                        <Button onClick={() => setShowNewWizard(true)}>
                            <FontAwesomeIcon icon={faPlus} /> Add a condition for this card
                        </Button>
                    </> :
                    <SubExpressionElement subExpression={draftCondition.expr}
                        handleDeleteSubExpression={() => {
                            props.setPdConditions(props.pdConditions.filter(v => v.id !== draftCondition.conditionId));
                            setDraftCondition(null);
                        }}
                        handleEditSubExpression={(newSubExpr) => {
                            const newCond: EditableCondition = { ...draftCondition, expr: newSubExpr };
                            saveEditableCondition(draftCondition.conditionId, newCond);
                            return setDraftCondition(newCond);
                        }}
                    />
                }
            </React.StrictMode>
        </div>
    )
}

interface ConditionElementProps {
    subExpression: SubExpression,
    handleEditSubExpression: (newSubExpr: SubExpression) => void,
    handleDeleteSubExpression: () => void,
    isPreview?: boolean;
}
const SubExpressionElement = (props: ConditionElementProps) => {
    const [newWizardState, setNewWizardState] = useState<{ show: boolean, onClose: (savedState?: WizardState) => void }>({ show: false, onClose: () => 0 })
    function isWizardExpression(val: WizExpression | SubExpression | undefined): val is WizExpression { return (val as WizExpression).curWizState !== undefined; }
    function hasExtraSubExpression(expList: (WizExpression | SubExpression)[]): boolean { return (expList.length === 1 && !isWizardExpression(expList.at(0))) }
    function removeExtraExpressions(exp: SubExpression): SubExpression {
        const firstSubExp = exp.subExpr.at(0)
        if (hasExtraSubExpression(exp.subExpr) && (firstSubExp !== undefined) && (!isWizardExpression(firstSubExp))) {
            return removeExtraExpressions(firstSubExp);
        } else {
            return exp;
        }
    }

    const expressionTrimmed = removeExtraExpressions(props.subExpression);

    function handleDelete(deletedIdx: number) {
        const newSubExpr = expressionTrimmed.subExpr.flatMap((v, i) => i === deletedIdx ? [] : [v])
        if (newSubExpr.length === 0) {
            props.handleDeleteSubExpression();
        }
        else {
            props.handleEditSubExpression({
                ...expressionTrimmed,
                subExpr: newSubExpr,
            });
        }
    }

    function handleEditExpr(editedIdx: number, newExpr: SubExpression | WizExpression) {
        props.handleEditSubExpression({
            ...expressionTrimmed,
            subExpr: expressionTrimmed.subExpr.map((v, i) => i === editedIdx ? newExpr : v)
        });
    }

    return (
        <>
            {expressionTrimmed.subExpr.length === 0 ? null :
                <Card style={{ backgroundColor: expressionTrimmed.subExprBool === "or" ? "white" : "lightgrey", borderWidth: "2px", borderColor: 'var(--sage-dark-purple)' }}>
                    <Card.Body >
                        {
                            expressionTrimmed.subExpr.map((expr, exprIdx) => {
                                if (isWizardExpression(expr)) {
                                    return (
                                        <>
                                            {exprIdx > 0 ? CardTabTitle(expressionTrimmed.subExprBool.toUpperCase()) : null}
                                            {wizExpressionWithConditional(expr, handleEditExpr, exprIdx, handleDelete, props.isPreview, expressionTrimmed, setNewWizardState)}
                                        </>
                                    )
                                } else {
                                    return (<>
                                        {exprIdx > 0 ? CardTabTitle(expr.subExprBool.toUpperCase()) : null}
                                        <SubExpressionElement
                                            key={expr.subExpr.toString()}
                                            subExpression={expr}
                                            handleEditSubExpression={(newExpr) => handleEditExpr(exprIdx, newExpr)}
                                            handleDeleteSubExpression={() => handleDelete(exprIdx)}
                                            isPreview={props.isPreview}
                                        />
                                    </>
                                    )
                                }
                            })
                        }

                    </Card.Body>
                    <Card.Footer>
                        {newBooleanButton(props.isPreview, setNewWizardState,
                            function handleSubEditExpr(ss: WizardState) {
                                props.handleEditSubExpression({
                                    ...expressionTrimmed,
                                    subExpr: expressionTrimmed.subExpr.concat(createNewWizExpression(ss))
                                });
                            }, expressionTrimmed.subExprBool.toUpperCase())}
                    </Card.Footer>
                </Card>
            }

            {newWizardState.show ?
                <FreshWizardModal onClose={newWizardState.onClose} /> :
                null}
        </>
    )
}

interface WizardExpressionProps {
    wizExpression: WizExpression,
    handleEditExpression: (newExpr: WizExpression) => void,
    handleDeleteExpression: () => void,
    booleanConditionalButton: JSX.Element | null,
    isPreview?: boolean
}
const WizardExpression = (props: WizardExpressionProps) => {
    const [showWiz, setShowWiz] = useState(props.wizExpression.curWizState === null);

    return (
        <>
            <CqlWizardModal show={showWiz} initialWizState={props.wizExpression.curWizState}
                onClose={() => {
                    setShowWiz(false);
                    if (props.wizExpression.curWizState === null) {
                        props.handleDeleteExpression();
                    }
                }}
                onSaveAndClose={(newWizState) => {
                    setShowWiz(false);
                    props.handleEditExpression({
                        ...props.wizExpression,
                        curWizState: newWizState,
                    })
                }}
            />
            <Container style={{ borderStyle: 'solid', borderWidth: "2px", borderColor: 'var(--sage-dark-purple)' }}>
                {/* <svg height="20px" width="20px" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="50" x2="100" y2="50" stroke="black" />
                </svg> */}
                {friendlyWizardExpression()}
                {props.isPreview ? null : <>
                    <Container style={{textAlign: 'right'}}>
                        {props.booleanConditionalButton}
                        <Button onClick={() => setShowWiz(true)}>
                            <FontAwesomeIcon icon={faPenToSquare} /> Edit
                        </Button>
                        <Button onClick={props.handleDeleteExpression}>
                            <FontAwesomeIcon icon={faTrash} /> Delete
                        </Button>
                    </Container>
                </>
                }
            </Container>
        </>
    )

    function friendlyWizardExpression(): JSX.Element | undefined {
        // const filters = props.wizExpression.curWizState.filters.map(filter => `${capitalizeWord(filter.elementName)}: ${filter.filter.toFriendlyString()}`)
        return (
                <Container>
                    <Col><b>{props.wizExpression.curWizState?.resType} conditions: </b></Col>
                    <Col>
                        <Row>
                            {props.wizExpression.curWizState.filters.map(f => {
                                return (
                                    <Col key={f.elementName}>
                                        <Col style={{borderStyle: 'solid', borderColor: 'grey', margin: '0.25rem'}}>
                                        <Container >
                                            <Row><b>{capitalizeWord(f.elementName)}:</b></Row>
                                            <Row><Col style={{textAlign: 'center'}}>{f.filter.toFriendlyString()}</Col></Row>
                                        </Container>
                                        </Col>
                                    </Col>
                                )
                            })}
                        </Row>
                    </Col>
                </Container>
        );
    }
}

interface FreshWizardModalProps {
    onClose: (savedState?: WizardState) => void,
}
const FreshWizardModal = ({ onClose }: FreshWizardModalProps) => {
    return (
        <CqlWizardModal show={true} initialWizState={null}
            onClose={() => onClose()}
            onSaveAndClose={(newWizState) => onClose(newWizState)}
        />
    )
}

function wizExpressionWithConditional(expr: WizExpression, handleEditExpr: (editedIdx: number, newExpr: SubExpression | WizExpression) => void, exprIdx: number, handleDelete: (deletedIdx: number) => void, isPreview: boolean | undefined, subExp: SubExpression, setNewWizardState: React.Dispatch<React.SetStateAction<{ show: boolean; onClose: (savedState?: WizardState | undefined) => void; }>>): JSX.Element {
    return <>
        <WizardExpression
            wizExpression={expr}
            handleEditExpression={(newExpr) => handleEditExpr(exprIdx, newExpr)}
            handleDeleteExpression={() => handleDelete(exprIdx)}
            isPreview={isPreview}
            booleanConditionalButton={newBooleanButton(isPreview, setNewWizardState,
                function handleWizEditExpr(savedState: WizardState) {
                    handleEditExpr(exprIdx, {
                        subExpr: [expr, createNewWizExpression(savedState)],
                        subExprBool: subExp.subExprBool === "or" ? "and" : "or",
                    });
                }, subExp.subExprBool === "or" ? "AND" : "OR")} />

    </>;
}
function newBooleanButton(isPreview: boolean | undefined,
    setNewWizardState: React.Dispatch<React.SetStateAction<{ show: boolean; onClose: (savedState?: WizardState | undefined) => void; }>>,
    handleWizEditExpr: (savedState: WizardState) => void, buttonText: string) {
    return isPreview ? null :
        <Button
            onClick={() => {
                setNewWizardState({
                    show: true,
                    onClose: (savedState) => {
                        if (savedState !== undefined) {
                            handleWizEditExpr(savedState);
                        }
                        setNewWizardState({
                            show: false,
                            onClose: () => 0
                        });
                    }
                });
            }}
        >
            {buttonText}
        </Button>;
}

