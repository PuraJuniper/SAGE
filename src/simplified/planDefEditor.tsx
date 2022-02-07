import State, { SageNodeInitializedFreezerNode } from "../state"
import * as SchemaUtils from "../helpers/schema-utils"
import { ACTIVITY_DEFINITION, QUESTIONNAIRE } from "./nameHelpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faCaretRight} from  '@fortawesome/pro-solid-svg-icons';
import { CardEditor } from "./cardEditor";
import { QuestionnaireEditor } from "./questionnaireEditor";

interface PlanDefEditorProps {
    planDefNode: SageNodeInitializedFreezerNode
}

export const PlanDefEditor = (props: PlanDefEditorProps) => {
    const referencedNodeURI = SchemaUtils.getChildOfNodePath(props.planDefNode, ["action", "definitionCanonical"])?.value;
    console.log(referencedNodeURI);
    function getEditorForURI(referencedURI: string): JSX.Element {
        const {
            node: linkedResourceNode,
            pos: linkedResourcePos
        } = SchemaUtils.findFirstSageNodeByUri(State.get().bundle.resources, referencedURI);
        console.log(linkedResourceNode?.schemaPath);
        console.log(State.get().bundle)
        switch (linkedResourceNode?.schemaPath) {
            case undefined:
                return (
                    <div>        
                        <button className="navigate col-lg-2 col-md-3" 
                            onClick={() => State.get().set("ui", {status:"collection"})}>
                            Saved Cards&nbsp;<FontAwesomeIcon icon={faCaretRight} />    
                        </button>
                        Referenced resource {referencedURI} does not exist in current Bundle
                    </div>
                );
            case ACTIVITY_DEFINITION:
                return <CardEditor actNode={linkedResourceNode} planNode={props.planDefNode}/>
            case QUESTIONNAIRE:
                return <QuestionnaireEditor planDefNode={props.planDefNode} questionnareNode={linkedResourceNode} />
            default:
                return (
                    <div>        
                        <button className="navigate col-lg-2 col-md-3" 
                            onClick={() => State.get().set("ui", {status:"collection"})}>
                            Saved Cards&nbsp;<FontAwesomeIcon icon={faCaretRight} />    
                        </button>
                        <div>
                            Basic view does not support editing resources of type {linkedResourceNode?.schemaPath}
                        </div>
                    </div>
                );
        }
    }

    return (
        <div>
            {referencedNodeURI ? 
            getEditorForURI(referencedNodeURI) :
            <div>
                <button className="navigate col-lg-2 col-md-3" 
                    onClick={() => State.get().set("ui", {status:"collection"})}>
                    Saved Cards&nbsp;<FontAwesomeIcon icon={faCaretRight} />    
                </button>
                Selected PlanDefinition has no action with a &quot;definitionCanonical&quot; -- cannot display in basic view
            </div>}
        </div>
    );
}