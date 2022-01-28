import { useState, useEffect } from "react";
import { Folder } from "./folder";
import State, { SageReactions } from "../state";
import * as SchemaUtils from "../helpers/schema-utils"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faCaretLeft } from '@fortawesome/pro-solid-svg-icons';
import { SageNodeInitialized } from "../helpers/schema-utils";


const Collection = () => {

    const resources = State.get().bundle?.resources ?? [];

    return (
        <div style={{ marginTop: "50px" }}>
            <div className="row">
                <h3 className="col-lg-10 col-md-9" style={{ color: "#2a6b92" }}><b>Saved Cards</b></h3>
                <button className="navigate-reverse col-lg-2 col-md-3"
                    onClick={() => State.get().set("ui", { status: "cards" })}>
                    <FontAwesomeIcon icon={faCaretLeft} />
                    &nbsp;New Card
                </button>
                <button className="navigate-reverse col-lg-2 col-md-2"
                    onClick={() => State.get().set("ui", { status: "export" })}>
                    <FontAwesomeIcon icon={faDownload} />
                    &nbsp;Export as FHIR Bundle
                </button>
            </div>
            <div className="row box">
                {
                    resources.reduce(
                        function (accumulator: any[], currentValue, currentIndex, array) {
                            if (currentIndex % 2 === 0)
                                accumulator.push(array.slice(currentIndex, currentIndex + 2));
                            return accumulator;
                        }, []).map((pair, i) => {
                            const actNode = pair[0];
                            const planDefNode = pair[1];
                            const actTitleNode = SchemaUtils.getChildOfNode(actNode, "title");
                            const planTitleNode = SchemaUtils.getChildOfNode(planDefNode, "title");
                            const actDescNode = SchemaUtils.getChildOfNode(actNode, "description");
                            const firstExpression: string | undefined = SchemaUtils.getChildOfNodePath(planDefNode, ["action", "condition", "expression", "expression"])?.value;
                            const conditionExpressions: string[] = firstExpression ? [firstExpression] : [];
                            return <div className="col-lg-3 col-md-4 col-sm-6" key={i*2}>
                                <Folder
                                    actTitle={actTitleNode?.value ? actTitleNode.value : "Untitled AD"}
                                    planTitle={planTitleNode?.value ? planTitleNode.value : "Untitled PD"}
                                    actDesc={actDescNode?.value ? actDescNode.value : ""}
                                    conditionExpressions={conditionExpressions}
                                    profile={SchemaUtils.toFhir(actNode, false).meta?.profile?.[0] ?? ""}
                                    wait={i * 25}
                                    index={i*2}
                                />
                            </div>
                        })
                }
                {resources.length == 0 ? <div style={{ margin: "50px", marginTop: "40px" }}> <i>No Cards</i> </div> : undefined}
            </div>
        </div>
    );
}

export default Collection