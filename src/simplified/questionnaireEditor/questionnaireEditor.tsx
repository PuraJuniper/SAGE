import { Questionnaire } from "fhir/r4";
import { decorateFhirData, toFhir } from "../../helpers/schema-utils";
import { SageNodeInitializedFreezerNode } from "../../state";
import StructorFrame, { StructorFrameRef } from "./structorFrame";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faCaretLeft} from  '@fortawesome/pro-solid-svg-icons';
import State from "../../state";
import { useRef } from "react";

interface QuestionnaireEditorProps {
    planDefNode: SageNodeInitializedFreezerNode,
    questionnareNode: SageNodeInitializedFreezerNode,
    handleDeleteResource: () => void,
}

export const QuestionnaireEditor = (props: QuestionnaireEditorProps) => {
    const questionnareResource = toFhir(props.questionnareNode, false) as Questionnaire;
    const structorRef = useRef<StructorFrameRef>(null);

	function handleSaveCard() {
        structorRef.current?.triggerStructorSend();
        State.get().set("ui", {status:"collection"})
	}
    
    function handleQuestionnaireSaved(newQuestionnaire: Questionnaire) {
        console.log(newQuestionnaire);
        const qSageNode = decorateFhirData(State.get().profiles, newQuestionnaire);
        if (!qSageNode) {
            console.log("Could not convert exported Questionnaire from Structor into SAGE")
            return false;
        }
        props.questionnareNode.set(qSageNode);
        return true;
    }

    return (
        <div>
            <button className="navigate-reverse col-lg-2 col-md-3"
                onClick={() => {
                    props.handleDeleteResource();
                }}
                >
                <FontAwesomeIcon icon={faCaretLeft} />
                &nbsp;Delete Card
            </button>
            <button className="navigate col-lg-2 col-md-3" 
                onClick={handleSaveCard}
                >
                Save Card&nbsp;
                <FontAwesomeIcon icon={faCaretRight} />
            </button>
            <StructorFrame ref={structorRef} questionnaireFromSage={questionnareResource} questionnaireSavedCallback={handleQuestionnaireSaved} 
                structorReadyCallback={()=>{return 0;}}
            />
        </div>
    );
}