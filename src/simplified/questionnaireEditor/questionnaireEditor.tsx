import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Questionnaire } from "fhir/r4";
import React, { useRef, useState } from 'react';
import { Button, Card, Col, Row } from "react-bootstrap";
import { decorateFhirData, getChildOfNode, getChildOfNodePath, toFhir } from "../../helpers/schema-utils";
import State, { SageNodeInitializedFreezerNode } from "../../state";
import { buttonSpacer, CardNav, stepProps } from '../outerCardForm';
import StructorFrame, { StructorFrameRef } from "./structorFrame";
import { Model, Survey, StylesManager, FunctionFactory, Serializer, SurveyModel } from "survey-react";
import converter from 'questionnaire-to-survey';

import 'survey-react/modern.min.css';
StylesManager.applyTheme("modern");
const reactConverter = converter(FunctionFactory, Model, Serializer, StylesManager);

interface QuestionnaireEditorProps {
    planDefNode: SageNodeInitializedFreezerNode,
    questionnareNode: SageNodeInitializedFreezerNode,
    handleExit: () => void,
    handleSaveResource: () => void,
    conditionEditor: JSX.Element,
}

export const QuestionnaireEditor = (props: QuestionnaireEditorProps) => {
    const [questionnaireResource, setQuestionnaireResource] = useState<{ resource: Questionnaire, model: SurveyModel | null }>(() => {
        const initialQuestionnaire = toFhir(props.questionnareNode, false) as Questionnaire
        if (initialQuestionnaire.title === undefined) {
            initialQuestionnaire.title = "New Questionnaire"
        }
        if (initialQuestionnaire.description === undefined) {
            initialQuestionnaire.description = "Sample Description";
        }
        return genQuestionnaireResponseState(initialQuestionnaire);
    });

    function genQuestionnaireResponseState(newQuestionnaire: Questionnaire) {
        console.log(newQuestionnaire.item === undefined ? null : reactConverter(newQuestionnaire));
        return {
            resource: newQuestionnaire,
            model: newQuestionnaire.item === undefined ? null : reactConverter(newQuestionnaire)
        };
    }

    const structorRef = useRef<StructorFrameRef>(null);
    const [step, setStep] = useState<number>(1);

	function saveQuestionnaire() {
        structorRef.current?.throttledTriggerStructorSend();
	}
    
    function handleQuestionnaireSaved(newQuestionnaire: Questionnaire) {
        console.log(newQuestionnaire);
        setQuestionnaireResource(genQuestionnaireResponseState(newQuestionnaire));
        setStep(curStep => curStep + 1);
        return true;
    }

    function handleSaveCard() {
        const qSageNode = decorateFhirData(State.get().profiles, questionnaireResource.resource);
        if (!qSageNode) {
            console.log("Warning: Could not convert exported Questionnaire from Structor into SAGE")
        }
        else {
            props.questionnareNode.set(qSageNode);
            // Copy certain fields from the questionnaire
            State.emit("value_change", getChildOfNode(props.planDefNode, "title"), `Use Questionnaire "${questionnaireResource.resource.title}"`, false);
            State.emit("value_change", getChildOfNodePath(props.planDefNode, ["action", "title"]), `Use Questionnaire "${questionnaireResource.resource.title}"`, false);
            State.emit("value_change", getChildOfNode(props.planDefNode, "description"), `Collect information using FHIR Questionnaire: ${questionnaireResource.resource.title}`, false);
            State.emit("value_change", getChildOfNodePath(props.planDefNode, ["action", "description"]), `Collect information using FHIR Questionnaire: ${questionnaireResource.resource.title}`, false);
        }
        props.handleSaveResource();
    }
    
    const saveButton = (
        <Button key="butSave" variant='outline-primary' bsPrefix="card-nav-btn btn"
            onClick={handleSaveCard}
        >
            Save Card&nbsp;
            <FontAwesomeIcon key="butSaveIcon" icon={faCaretRight} />
        </Button>
    )

    const deleteCardButton = (
        <Button key="butCancel" variant='outline-primary' bsPrefix="card-nav-btn btn"
            onClick={props.handleExit}
        >
            Cancel
        </Button>
    );

    const pageTitles = new Map([
        [1, "Page 1: Creating a Questionnaire"],
        [2, "Page 2: Adding Conditions"],
        [3, "Page 3: Card Preview"]
    ])


    const leftNavButton = (
        <Button variant='outline-primary' bsPrefix="card-nav-btn btn"
            onClick={() => setStep(curStep => curStep - 1)}>
            {<> <FontAwesomeIcon icon={faCaretLeft} /> {" Previous"} </>}
        </Button>
    );

    const rightNavButton = (
        <Button variant='outline-primary' bsPrefix="card-nav-btn btn"
            onClick={() => {
                if (step === 1) {
                    // This function should cause `handleQuestionnaireSaved` to run, which will increment the step
                    saveQuestionnaire();
                }
                else {
                    setStep(curStep => curStep + 1)
                }
            }}>
            {<> {"Next "} <FontAwesomeIcon icon={faCaretRight} /></>}
        </Button>
    );

    const questionaireSteps: stepProps[] =
    [
        {title:"Page 1: Creating a Questionnaire", text: "Enter What the card does"},
        {title:"Page 2: Adding Conditions",	       text: "Enter When the card is played"},
        {title:"Page 3: Card Preview",	           text: "Review and Save"},
    ];


    console.log(questionnaireResource);

    return (
        <div style={{display: "flex"}} >
            <div style={{flexGrow: 1, margin: "50px"}}>
            <div className='basic-page-titles'>{pageTitles.get(step)}</div>

            {CardNav(step, questionaireSteps, (selectedKey) => setStep(parseInt(selectedKey ?? "1") ))}
            {step === 1 ?
                <StructorFrame ref={structorRef} questionnaireFromSage={questionnaireResource.resource} questionnaireSavedCallback={handleQuestionnaireSaved} 
                    structorReadyCallback={()=>{return 0;}}
                /> :
                null}
            {step === 2 ? props.conditionEditor : null}
            {step === 3 ?
                <Card style={{ padding: "20px", margin: "10px", borderWidth: "2px", borderColor:'#2D2E74', borderRadius: '40px'}}>
                    <Card.Title>QUESTIONNAIRE</Card.Title>
                    <Card.Body>
                        {questionnaireResource.model !== null ?
                            <Survey model={questionnaireResource.model} /> :
                            null}
                    </Card.Body>
                </Card> :
                null}
            <Row className="mt-5">
                <Col lg="2" xs="3">
                    {deleteCardButton}
                </Col>
                {buttonSpacer(step > 1 ? leftNavButton : null)}
                {buttonSpacer(step <= 2 ? rightNavButton : saveButton)}
            </Row>
            </div>
        </div>
    );
}
