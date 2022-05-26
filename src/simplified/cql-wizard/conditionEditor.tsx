import { PlanDefinitionActionCondition } from "fhir/r4";
import React, { useState } from "react";
import { Button, ListGroup, Card, InputGroup, Form } from "react-bootstrap";
import { CqlWizardModal } from "./cqlWizardModal";
import { convertFormInputToNumber } from "./cqlWizardSelectFilters";
import { CodeFilterType, DateFilterType, findEditableCondition, saveEditableCondition, WizardState } from "./wizardLogic";
import * as SchemaUtils from "../../helpers/schema-utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faPlus, faTrash } from "@fortawesome/pro-solid-svg-icons";
import { propTypes } from "react-bootstrap/esm/Image";

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
    curWizState: WizardState | null,
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

    function handleDelete(deletedIdx: number) {
        const newSubExpr = props.subExpression.subExpr.flatMap((v, i) => i === deletedIdx ? [] : [v])
        if (newSubExpr.length === 0) {
            props.handleDeleteSubExpression();
        }
        else {
            props.handleEditSubExpression({
                ...props.subExpression,
                subExpr: newSubExpr,
            });
        }
    }

    function handleEditExpr(editedIdx: number, newExpr: SubExpression | WizExpression) {
        props.handleEditSubExpression({
            ...props.subExpression,
            subExpr: props.subExpression.subExpr.map((v, i) => i === editedIdx ? newExpr : v)
        });
    }

    return (
        <>
            <Card>
                <Card.Body>
                    {/* <Card.Title>
                        {props.subExpression.subExprBool}
                        {props.isPreview ? null : <Button onClick={props.handleDeleteSubExpression}>Delete</Button>}
                        
                    </Card.Title> */}
                    {props.subExpression.subExpr.map((expr, exprIdx) => {
                        if ('subExprBool' in expr) {
                            return (
                                <SubExpressionElement
                                    subExpression={expr}
                                    handleEditSubExpression={(newExpr) => handleEditExpr(exprIdx, newExpr)}
                                    handleDeleteSubExpression={() => handleDelete(exprIdx)}
                                    isPreview={props.isPreview}
                                />
                            )
                        }
                        else {
                            return (
                                <>
                                    <WizardExpression
                                        wizExpression={expr}
                                        handleEditExpression={(newExpr) => handleEditExpr(exprIdx, newExpr)}
                                        handleDeleteExpression={() => handleDelete(exprIdx)}
                                        isPreview={props.isPreview}
                                    />
                                    {props.isPreview ? null :
                                        <Button
                                            onClick={() => {
                                                setNewWizardState({
                                                    show: true,
                                                    onClose: (savedState) => {
                                                        if (savedState !== undefined) {
                                                            handleEditExpr(exprIdx, {
                                                                subExpr: [expr, createNewWizExpression(savedState)],
                                                                subExprBool: props.subExpression.subExprBool === "or" ? "and" : "or",
                                                            })
                                                        }
                                                        setNewWizardState({
                                                            show: false,
                                                            onClose: () => 0
                                                        })
                                                    }
                                                })
                                            }}
                                        >
                                            {props.subExpression.subExprBool === "or" ? "AND" : "OR"}
                                        </Button>
                                    }
                                </>
                            )
                        }
                    })}
                </Card.Body>
                {props.isPreview ? null :
                    <Button
                        onClick={() => {
                            setNewWizardState({
                                show: true,
                                onClose: (savedState) => {
                                    if (savedState !== undefined) {
                                        props.handleEditSubExpression({
                                            ...props.subExpression,
                                            subExpr: props.subExpression.subExpr.concat(createNewWizExpression(savedState))
                                        })
                                    }
                                    setNewWizardState({
                                        show: false,
                                        onClose: () => 0
                                    })
                                }
                            })
                        }}
                    >
                        {props.subExpression.subExprBool.toUpperCase()}
                    </Button>
                }
            </Card>
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
            <div>
                <span>
                    <svg height="20px" width="20px" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <line x1="0" y1="50" x2="100" y2="50" stroke="black" />
                    </svg>
                    {props.wizExpression.curWizState?.resType}
                    {props.isPreview ? null : <>
                        <Button onClick={() => setShowWiz(true)}>
                            <FontAwesomeIcon icon={faPenToSquare} /> Edit
                        </Button>
                        <Button onClick={props.handleDeleteExpression}>
                            <FontAwesomeIcon icon={faTrash} /> Delete
                        </Button>
                    </>
                    }

                </span>
            </div>
        </>
    )
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