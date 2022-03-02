import {useState, useEffect} from "react";
import {BaseCard} from"./baseCard";
import { CSSTransition } from 'react-transition-group';
import State from "../state";
import { CloseButton } from "react-bootstrap";
import {getBorderPropsForType, PLAN_DEFINITION, profileToFriendlyResourceListEntry, profileToFriendlyResourceSelf } from "./nameHelpers";

interface FolderProps {
    actTitle: string,
    actDesc: string,
    planTitle: string,
    conditionExpressions: string[],
    index: number,
    profile: string,
    link?: string
    wait: number
}

export const Folder = (props: FolderProps) => {
    const [show, setShow] = useState(false);
    const friendlyName = profileToFriendlyResourceListEntry(props.profile)?.SELF.FRIENDLY ?? "Unknown";
    const resourceType = profileToFriendlyResourceSelf(props.profile)?.FHIR ?? "";
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
                bsBorder={getBorderPropsForType(resourceType)}
                header={friendlyName} title="" link={props.link}
            />
        </div>
        <div style={{position:"absolute", top:"16px", left:"0px", width:"100%"}}>
            <BaseCard header={PLAN_DEFINITION} title={props.planTitle}
            content={
                <span>
                {props.actDesc} {props.conditionExpressions.length > 0 ? `WHEN ${props.conditionExpressions[0]} IS TRUE` : ""}
                </span>
                }/>
        </div>
        {
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