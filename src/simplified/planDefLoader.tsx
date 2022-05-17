import React from "react";
import { useParams } from "react-router-dom";
import State from "../state";
import { PlanDefEditor } from "./planDefEditor";

interface PlanDefLoaderProps {
    newCard: boolean
}

export const getPlanDef = (planDefPosNum: number) => {
    return {
        planDefNode: State.get().bundle.resources[planDefPosNum],
        planDefPos: planDefPosNum
    }
}

export const PlanDefLoader = (props: PlanDefLoaderProps) => {
    const { planDefPos } = useParams();
    const planDefPosNum = planDefPos ? parseInt(planDefPos, 10) : NaN;

    return (
        isNaN(planDefPosNum) || planDefPosNum >= State.get().bundle.resources.length ?
            <div>
                Invalid bundle position: {planDefPos}
            </div> : <PlanDefEditor newCard={props.newCard} {...getPlanDef(planDefPosNum)} />
    );
}
