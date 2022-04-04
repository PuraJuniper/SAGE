import { Questionnaire } from "fhir/r4";
import { decorateFhirData, getChildOfNode, getChildOfNodePath, toFhir } from "../../helpers/schema-utils";
import { SageNodeInitializedFreezerNode } from "../../state";
import StructorFrame, { StructorFrameRef } from "./structorFrame";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faCaretLeft} from  '@fortawesome/pro-solid-svg-icons';
import State from "../../state";
import { useRef, useState } from "react";
import { Card } from "react-bootstrap";

interface QuestionnaireEditorProps {
    planDefNode: SageNodeInitializedFreezerNode,
    questionnareNode: SageNodeInitializedFreezerNode,
    handleDeleteResource: () => void,
    handleSaveResource: () => void,
    conditionEditor: JSX.Element,
}

export const QuestionnaireEditor = (props: QuestionnaireEditorProps) => {
    const [questionnaireResource, setQuestionnaireResource] = useState<Questionnaire>(() => {
        const initialQuestionnaire = toFhir(props.questionnareNode, false) as Questionnaire
        if (initialQuestionnaire.title === undefined) {
            initialQuestionnaire.title = "New Questionnaire"
        }
        if (initialQuestionnaire.description === undefined) {
            initialQuestionnaire.description = "Sample Description";
        }
        return initialQuestionnaire;
    });
    const structorRef = useRef<StructorFrameRef>(null);
    const [step, setStep] = useState<number>(1);

	function saveQuestionnaire() {
        structorRef.current?.throttledTriggerStructorSend();
	}
    
    function handleQuestionnaireSaved(newQuestionnaire: Questionnaire) {
        console.log(newQuestionnaire);
        setQuestionnaireResource(newQuestionnaire);
        setStep(curStep => curStep + 1);
        return true;
    }

    function handleSaveCard() {
        const qSageNode = decorateFhirData(State.get().profiles, questionnaireResource);
        if (!qSageNode) {
            console.log("Warning: Could not convert exported Questionnaire from Structor into SAGE")
        }
        else {
            props.questionnareNode.set(qSageNode);
            // Copy certain fields from the questionnaire
            State.emit("value_change", getChildOfNode(props.planDefNode, "title"), `Use Questionnaire "${questionnaireResource.title}"`, false);
            State.emit("value_change", getChildOfNodePath(props.planDefNode, ["action", "title"]), `Use Questionnaire "${questionnaireResource.title}"`, false);
            State.emit("value_change", getChildOfNode(props.planDefNode, "description"), `Collect information using FHIR Questionnaire: ${questionnaireResource.title}`, false);
            State.emit("value_change", getChildOfNodePath(props.planDefNode, ["action", "description"]), `Collect information using FHIR Questionnaire: ${questionnaireResource.title}`, false);
        }
        props.handleSaveResource();
    }
    
    const saveButton = (
        <button key="butSave" type="button" className="navigate col-lg-2 col-md-3"
            onClick={handleSaveCard}
        >
            Save Card&nbsp;
            <FontAwesomeIcon key="butSaveIcon" icon={faCaretRight} />
        </button>
    )

    const deleteCardButton = (
        <button key="butDel" type='button' className="navigate col-lg-2 col-md-3"
            onClick={props.handleDeleteResource}
        >
            Cancel
        </button>
    );

    const pageTitles = new Map([
        [1, "Page 1: Creating a Questionnaire"],
        [2, "Page 2: Adding Conditions"],
        [3, "Page 3: Card Preview"]
    ])


    const leftNavButton = (
        <button type='button' className={"navigate-reverse col-lg-2 col-md-3"}
            onClick={() => setStep(curStep => curStep - 1)}>
            {<> <FontAwesomeIcon icon={faCaretLeft} /> {" Previous"} </>}
        </button>
    );

    const rightNavButton = (
        <button type='button' className={"navigate col-lg-2 col-md-3"}
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
        </button>
    );

    return (
        <div>
            <div className='basic-page-titles'>{pageTitles.get(step)}</div>
            {step === 1 ?
                <StructorFrame ref={structorRef} questionnaireFromSage={questionnaireResource} questionnaireSavedCallback={handleQuestionnaireSaved} 
                    structorReadyCallback={()=>{return 0;}}
                /> :
                null}
            {step === 2 ? props.conditionEditor : null}
            {step === 3 ?
                <Card style={{ padding: "20px", margin: "10px", borderWidth: "2px", borderColor:'rgb(42, 107, 146)', borderRadius: '40px'}}>
                    <Card.Title>QUESTIONNAIRE</Card.Title>
                    <Card.Body>

                    </Card.Body>
                </Card> :
                null}
            <div>
                {step > 1 ? leftNavButton : null}
                {step <= 2 ? rightNavButton : saveButton}
                {deleteCardButton}
            </div>
        </div>
    );
}
