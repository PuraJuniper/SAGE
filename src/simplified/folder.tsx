import React from 'react';
import {useState, useEffect} from "react";
import {BaseCard} from"./baseCard";
import { CSSTransition } from 'react-transition-group';
import State, { GeneratedLibraries } from "../state";
import { CloseButton, Spinner } from "react-bootstrap";
import {getBorderPropsForType, PLAN_DEFINITION, profileToFriendlyResourceListEntry, profileToFriendlyResourceSelf } from "./nameHelpers";
import * as SchemaUtils from '../helpers/schema-utils';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faQuestionCircle } from "@fortawesome/pro-solid-svg-icons";
import { useNavigate } from "react-router-dom";

interface FolderProps {
    actTitle: string,
    actDesc: string,
    planTitle: string,
    referencedLibraries: string[],
    conditionExpressions: string[],
    pdIndex: number, // Position of plandef in state.bundle.resources
    refIndex: number | null, // Position of pd's referenced resource in state.bundle.resources
    profile: string,
    link?: string
    wait: number
}

export const Folder = (props: FolderProps) => {
    const navigate = useNavigate();

    const [show, setShow] = useState(false);
    const friendlyName = profileToFriendlyResourceListEntry(props.profile)?.SELF.FRIENDLY ?? "Unknown";
    const resourceType = profileToFriendlyResourceSelf(props.profile)?.FHIR ?? "";
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setShow(true);
        }, props.wait);
        return () => clearTimeout(timeoutId);
    }, [props.wait]);
    
    // All FHIR Libraries referenced by this PlanDefinition on mount that cannot be resolved by SAGE
    // Note: This does not update if props.refrencedLibraries changes while this Folder is already mounted
    const [unresolvedLibrariesOnMount, setUnresolvedLibrariesOnMount] = useState<string[]>(()=>{
        return props.referencedLibraries.flatMap(libraryUrl => {
            const {
                node: referencedLibrary,
            } = SchemaUtils.findFirstSageNodeByUri(State.get().bundle.resources, libraryUrl);
            if (referencedLibrary === null) {
                // Check if library is in SAGE's generated store
                const generatedLib = State.get().simplified.generatedLibraries[libraryUrl];
                if (generatedLib === undefined || generatedLib.isGenerating === true) {
                    return [libraryUrl]
                }
                else {
                    // Generated FHIR Library exists in SAGE's store
                    return [];
                }
            }
            // Library exists in bundle, so skip it
            return [];
        });
    });

    // Register event listener on SAGE's generated libraries object to trigger a rerender whenever
    //  an unresolved library is resolved
    useEffect(() => {
        const genLibariesListener = State.get().simplified.generatedLibraries.getListener();
        const checkForUnresolvedLibrary = function (libraries: GeneratedLibraries) {
            for (const unresolvedLib of unresolvedLibrariesOnMount) {
                if (libraries[unresolvedLib]?.isGenerating === false) {
                    setUnresolvedLibrariesOnMount(old => old.filter(v=>v!==unresolvedLib));
                }
            }
        };
        genLibariesListener.on("update", checkForUnresolvedLibrary);
        return () => {
            genLibariesListener.off("update", checkForUnresolvedLibrary);
        };
    }, [unresolvedLibrariesOnMount])

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
            navigate(`/edit/${props.pdIndex}`);
        }}>
        <BaseCard header="_" title={PLAN_DEFINITION} hideHeader={false}/>
        <div className="folder-type" style={{position:"absolute", top:"-18px", left:"20px", maxWidth:"90%"}}>
            <BaseCard
                bsBg="sage-white"
                bsText="sage-blue"
                bsBorder={getBorderPropsForType(resourceType)}
                header={friendlyName} title="" link={props.link}
                hideHeader={false}
            />
        </div>
        <div style={{position:"absolute", top:"16px", left:"0px", width:"100%"}}>
            <BaseCard header={PLAN_DEFINITION} title={props.planTitle} hideHeader={false}
            content={
                <span>
                {props.actDesc} {props.conditionExpressions.length > 0 ? `WHEN "${props.conditionExpressions.join('" AND "')}" IS TRUE` : ""}
                </span>
                }/>
        </div>
        <div className="delete">
            <CloseButton
                onClick={(e) => {
                    e.stopPropagation();
                    if (props.refIndex !== null) {
                        State.emit("remove_from_bundle", props.pdIndex, props.refIndex);
                    }
                    else {
                        State.emit("remove_from_bundle", props.pdIndex);
                    }
                }}
            />
        </div>
        <div className="basic-collection-library-loading">
            {unresolvedLibrariesOnMount.map(libraryUrl => {
                // Render status of each unresolved FHIR Library
                const generatedLib = State.get().simplified.generatedLibraries[libraryUrl];
                if (generatedLib === undefined) {
                    // Library does not exist anywhere in SAGE, show missing symbol
                    return <FontAwesomeIcon key={libraryUrl} icon={faQuestionCircle} />
                }
                else {
                    if (generatedLib.errorOccurred) {
                        // Library has some error
                        return <FontAwesomeIcon key={libraryUrl} icon={faExclamationTriangle} />
                    }
                    else {
                        // Library is still being generated, show loading symbol
                        return <Spinner key={libraryUrl} animation="border" />
                    }
                }
            })}
        </div>
    </div>
    </CSSTransition>
    )
}