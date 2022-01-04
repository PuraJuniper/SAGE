import { PlanDefinitionActionCondition, Expression } from "fhir/r4";
import {useState, useEffect} from "react";

import * as cql from 'cql-execution';
import test from "../../test/sample-library.json";

export const getExpressionsFromLibraries = () => {
    const parsedLib = new cql.Library(test);
    const foundExpressions: Expression[] = [];
    for (const expressionKey of Object.keys(parsedLib.expressions)) {
        foundExpressions.push({
            language: 'text/cql',
            expression: expressionKey
        });
    }
    return foundExpressions;
}

const ConditionBuilder = (props:any) => {
    let [condition, setCondition] = useState<PlanDefinitionActionCondition>();
    let [availableExpressions, setAvailableExpressions] = useState<Expression[]>([]);

    const getExpressionsFromLibraries = () => {
		const parsedLib = new cql.Library(test);
        const foundExpressions: Expression[] = [];
		for (const expressionKey of Object.keys(parsedLib.expressions)) {
            foundExpressions.push({
                language: 'text/cql',
                expression: expressionKey
            });
		}
        setAvailableExpressions([...availableExpressions, ...foundExpressions]);
    }

    return (
        <div>
            Selected Expression: {condition?.expression}
            <button onClick={getExpressionsFromLibraries}>
                Load available Expressions
            </button>
            {availableExpressions.map((v) => {
                return <div>{v.language}, {v.expression}</div>
            })}
        </div>
    )

}

export default ConditionBuilder;