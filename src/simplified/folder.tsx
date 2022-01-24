import {useState, useEffect} from "react";
import {BaseCard} from"./baseCard";
import { CSSTransition } from 'react-transition-group';
import State from "../state";
import { CloseButton } from "react-bootstrap";
import { PLAN_DEFINITION } from "./nameHelpers";

interface FolderProps {
    actTitle: string,
    planTitle: string,
    conditionExpressions: string[],
    index: number,
    type: string,
    link?: string
    wait: number
}

export const Folder = (props: FolderProps) => {
    const [show, setShow] = useState(false);
    const isActivity = props.type != "computable"; // bad
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setShow(true);
        }, props.wait);
        return () => clearTimeout(timeoutId);
      }, [props.wait]);
    

    return (
    <CSSTransition
        in={show}
        timeout={9999}
        classNames="res-folder"
        unmountOnExit
    >
    <div className="folder" style={{position:"relative", marginBottom:"100px", marginTop: "10px"}}
        onClick={(e) => {
            setShow(false);
            State.emit("set_bundle_pos", props.index);
        }}>
        <BaseCard header="_" title={PLAN_DEFINITION} />
        <div className="folder-type" style={{position:"absolute", top:"-18px", left:"20px", maxWidth:"90%"}}>
            <BaseCard
                bsBg="sage-white"
                bsText="sage-blue"
                bsBorder={isActivity ? "activitydefinition" : "questionnaire"}
                header={props.type} title="" link={props.link}
            />
        </div>
        <div style={{position:"absolute", top:"16px", left:"0px", width:"100%"}}>
            <BaseCard header={PLAN_DEFINITION} title={props.planTitle}
            content={
                <span>
                {props.actTitle} {props.conditionExpressions.length > 0 ? `WHEN ${props.conditionExpressions[0]} IS TRUE` : ""}
                </span>
                }/>
        </div>
        {State.get().bundle.resources.length > 2 && 
            <div className="delete">
                <CloseButton
                    onClick={(e) => {
                        e.stopPropagation();
                        State.emit("remove_from_bundle", props.index + 1);
                        State.emit("remove_from_bundle", props.index); 
                        State.get().set("ui", {status:"collection"})
                    }}
                />
            </div>
        }
    </div>
    </CSSTransition>
    )
}