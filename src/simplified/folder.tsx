import {useState, useEffect} from "react";
import { propTypes } from "react-bootstrap/esm/Image";
import {BaseCard} from"./baseCard";
import { CSSTransition } from 'react-transition-group';
import State from "../state";

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
    useEffect(() => {
        setTimeout(() => {
            setShow(true);
        }, props.wait);
      }, [props.wait]);
    

    return (
    <CSSTransition
        in={show}
        timeout={9999}
        classNames="res-folder"
        unmountOnExit
    >
    <div className="folder" style={{position:"relative", marginBottom:"65px", marginTop: "10px"}}
        onClick={(e) => {
            setShow(false);
            setTimeout(() => {
                State.emit("set_bundle_pos", props.index);
            }, 300);
        }}>
        <BaseCard header="_" title="PlanDefinition" />
        <div className="folder-type" style={{position:"absolute", top:"-18px", left:"20px", maxWidth:"90%"}}>
            <BaseCard header={props.type} title="" link={props.link}/>
        </div>
        <div style={{position:"absolute", top:"16px", left:"0px", width:"100%"}}>
            <BaseCard header="PlanDefinition" title={props.planTitle}
            content={
                <div>
                {props.actTitle} {props.conditionExpressions.length > 0 ? `WHEN ${props.conditionExpressions[0]} IS TRUE` : ""}
                </div>
                }/>
        </div>
        {State.get().bundle.resources.length > 2 && 
        <button className="delete" 
        onClick={(e) => {
            e.stopPropagation();
            State.emit("remove_from_bundle", props.index + 1);
            State.emit("remove_from_bundle", props.index); 
            State.get().set("ui", {status:"collection"})
        }}>&times;</button>}
    </div>
    </CSSTransition>
    )
}