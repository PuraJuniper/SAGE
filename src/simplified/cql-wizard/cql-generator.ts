import axios, { AxiosRequestConfig } from "axios";
import { AggregateType, EditableCondition, SubExpression } from "./conditionEditor";
import { ElementFilter, CodeFilterType, DateFilterType, CodingFilter, DateFilter, RelativeDateUnit, FilterTypeCode, MultitypeFilter } from "./wizardLogic";

interface CqlDefinition {
    identifier: string, // identifier to reference this definition elsewhere in the CQL file
    definition: string, // actual definition
}

// 59621000 exists on https://cql-runner.dataphoria.org/ patient
// Note: this function will be rewritten to be more performant etc after it is proven to work (generated cql must be executable by encender)
export async function generateCqlFromConditions(conditionStates: EditableCondition[], libraryName: string, libraryVersion: string) {
    console.log("Generating CQL JSON ELM from:");
    console.log(conditionStates);
    if (libraryName === "") {
        console.log("Error: Library name must not be the empty string");
        return null;
    }

    /**
     * Library declarations (always needed)
     */
    const libraryDeclaration = `library "${libraryName}" version '${libraryVersion}'`;
    const usingDataModel = `using FHIR version '4.0.1'`;
    const includeFhirHelpers = `include "FHIRHelpers" version '4.0.1' called FHIRHelpers`;
    const contextPatient = `context Patient`;

    /**
     * Returns an identifier used to refer to the given code. (Will create a definition for it in `codesystemDefinitions` if one doesn't already exist)
     */
    const codesystemDefinitions = new Map<string, { codesystemDef: CqlDefinition, codeDefinitions: Map<string, CqlDefinition> }>(); // <Codesystem URL, { CQL definition, Map<Code, CQL definition> }>
    function getOrCreateCodeIdentifier(codesystemUrl: string, code: string) {
        let codesystemIncludes = codesystemDefinitions.get(codesystemUrl);
        if (codesystemIncludes === undefined) {
            // Codesystem has not been defined yet, so define it
            const csId = codesystemUrl;
            codesystemDefinitions.set(codesystemUrl, {
                codesystemDef: {
                    identifier: csId,
                    definition: `codesystem "${csId}": '${codesystemUrl}'`
                },
                codeDefinitions: new Map<string, CqlDefinition>()
            })
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            codesystemIncludes = codesystemDefinitions.get(codesystemUrl)!;
        }
        let codeDef = codesystemIncludes.codeDefinitions.get(code);
        if (codeDef === undefined) {
            // Code has not been defined for this codesystem, so define it
            const codeId = `${codesystemIncludes.codesystemDef.identifier}_${code}`
            codesystemIncludes.codeDefinitions.set(code, {
                identifier: codeId,
                definition: `code "${codeId}": '${code}' from "${codesystemIncludes.codesystemDef.identifier}"`,
            })
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            codeDef = codesystemIncludes.codeDefinitions.get(code)!;
        }

        return codeDef.identifier;
    }

    /**
     * Iterate through each condition, creating all necessary expressions for it
     */
    const exprDefinitions = new Map<string, CqlDefinition>(); // <Condition ID, CQL Expression definition for this condition>
    for (const conditionState of conditionStates) {
        const conditionExpr = generateCqlFromSubExpression(conditionState.conditionId, conditionState.expr, getOrCreateCodeIdentifier);
        exprDefinitions.set(conditionExpr.identifier, conditionExpr);
    }

    console.log(codesystemDefinitions);
    console.log(exprDefinitions);

    /**
     * Build final CQL output
     */
    const finalCql = (
`${libraryDeclaration}
${usingDataModel}
${includeFhirHelpers}

// Codesystems and codes
${Array.from(codesystemDefinitions.values()).map(codesystemDef => {
    return (
`${codesystemDef.codesystemDef.definition}
${Array.from(codesystemDef.codeDefinitions.values()).map(codeDef=>codeDef.definition).join('\n')}`
    )
}).join('\n\n')}

// Context
${contextPatient}

// Evaluated expressions
${Array.from(exprDefinitions.values()).map(exprDef=>exprDef.definition).join('\n')}`
    );

    console.log(finalCql);
    return finalCql;
}

export async function makeCQLtoELMRequest(cql: string) {
    const options: AxiosRequestConfig<string> = {
        method: "POST",
        url: `https://cql-translation-service.junipercds.com/cql/translator`,
        data: cql,
        headers: {
            'Accept': 'application/elm+json',
            'Content-Type': 'application/cql',
        },
        params: {
            // http://hl7.org/fhir/uv/cpg/STU1/libraries.html#translation-to-elm
            // "annotations": "true",
            // "locators": "true",
            // "disable-list-domotion": "true",
            // "disable-list-promotion": "true",
            // 'disable-method-invocation': 'true',
            // 'date-range-optimization': 'true',
            // 'result-types': 'true',
            // 'detailed-errors': 'false',
            // 'disable-list-traversal': 'false',
            // 'signatures': 'All'
        },
    };
    return axios(options).then(res => {
        if (res.data) {
            return window.btoa(JSON.stringify(res.data));
        }
        else {
            console.log("Error: CQL to ELM conversion returned no data");
            return null;
        }
    }, error => {
        console.log(error);
        return null;
    });
}

function generateCqlFromSubExpression(subExpressionId: string, subExpression: SubExpression, getOrCreateCodeIdentifier: (system: string, code: string) => string): CqlDefinition {
    const subExprDefinitions = new Map<string, CqlDefinition>();
    for (const subExpr of subExpression.subExpr) {
        if ('curWizState' in subExpr) {
            if (subExpr.curWizState === null) {
                console.log(`warning: null wizard state received -- skipping subexpression with id: ${subExpressionId}`)
                continue;
            }
            // Base filtering of the resource selected on page 1 of the wizard using the codes selected on page 2 of the wizard
            let innerResDef = `[${subExpr.curWizState.resType}: { "${subExpr.curWizState.codes.map(v=>getOrCreateCodeIdentifier(v.system, v.code)).join('", "')}" }] R`;

            // Extra filters (from the restrictions selected on page 3 of the wizard)
            //  Iterate through each conditionstate's filters and add them to a list of clauses per condition
            if (subExpr.curWizState.filters.length > 0) {
                const filterToCQL = (filter: ElementFilter): string | null => {
                    switch (filter.filter.type) {
                        case FilterTypeCode.Coding: {
                            const codingFilter = filter.filter as CodingFilter;
                            if (codingFilter.filterProps.filterType === CodeFilterType.None) {
                                return null;
                            }
                            else {
                                return codingFilter.filterProps.selectedIndexes.map(selectedIndex => {
                                    const selectedCode = codingFilter.binding.codes[selectedIndex];
                                    if (codingFilter.binding.isSingleton) {
                                        return `R.${filter.elementName} ~ "${getOrCreateCodeIdentifier(selectedCode.system, selectedCode.code)}"${codingFilter.binding.isCoding ? "" : ".code"}`
                                    }
                                    else {
                                        return `exists(R.${filter.elementName} RCodeList where RCodeList ~ "${getOrCreateCodeIdentifier(selectedCode.system, selectedCode.code)}"${codingFilter.binding.isCoding ? "" : ".code"})`
                                    }
                                }).join(`
                    and `
                                );
                            }
                        }

                    
                        case FilterTypeCode.Date:
                        case FilterTypeCode.Age: {
                            const dateFilter = filter.filter as DateFilter;
                            switch (dateFilter.filterProps.filterType) {
                                case DateFilterType.None:
                                    return null;
                                case DateFilterType.After:
                                    return `R.${filter.elementName} after day of Date(${dateFilter.filterProps.absoluteDate1?.year()}, ${dateFilter.filterProps.absoluteDate1?.month()}, ${dateFilter.filterProps.absoluteDate1?.day()})`;
                                case DateFilterType.Before:
                                    return `R.${filter.elementName} before day of Date(${dateFilter.filterProps.absoluteDate1?.year()}, ${dateFilter.filterProps.absoluteDate1?.month()}, ${dateFilter.filterProps.absoluteDate1?.day()})`;
                                case DateFilterType.Between:
                                    return (
    `R.${filter.elementName} included in day of Interval[DateTime(${dateFilter.filterProps.absoluteDate1?.year()}, ${dateFilter.filterProps.absoluteDate1?.month()}, ${dateFilter.filterProps.absoluteDate1?.day()}), DateTime(${dateFilter.filterProps.absoluteDate2?.year()}, ${dateFilter.filterProps.absoluteDate2?.month()}, ${dateFilter.filterProps.absoluteDate2?.day()})]`
                                    )
                                case DateFilterType.OlderThan:
                                case DateFilterType.YoungerThan: {
                                    let cqlUnit = null;
                                    switch (dateFilter.filterProps.relativeUnit) {
                                        case RelativeDateUnit.Minutes:
                                            cqlUnit = "minute";
                                            break;
                                        case RelativeDateUnit.Hours:
                                            cqlUnit = "hour";
                                            break;
                                        case RelativeDateUnit.Days:
                                            cqlUnit = "day";
                                            break;
                                        case RelativeDateUnit.Weeks:
                                            cqlUnit = "week";
                                            break;
                                        case RelativeDateUnit.Months:
                                            cqlUnit = "month";
                                            break;
                                        case RelativeDateUnit.Years:
                                            cqlUnit = "year";
                                            break;
                                    }
                                    return `R.${filter.elementName} ${dateFilter.filterProps.filterType === DateFilterType.OlderThan ? "before" : "after"} ${cqlUnit} of (Now() - ${dateFilter.filterProps.relativeAmount} ${cqlUnit})`;
                                }
                                default:
                                    return null;
                            }
                        }

                        case FilterTypeCode.Period:
                            return null;

                        case FilterTypeCode.Boolean:
                            return `R.${filter.elementName} is ${filter.filter.filterProps.filterType === true ? 'true' : 'false'}`; // Avoiding the slim chance that some browser prints true as 'True' or something

                        case FilterTypeCode.Multitype: {
                            const mtFilter = filter.filter as MultitypeFilter;
                            if (mtFilter.selectedFilter === undefined) {
                                return null;
                            }
                            else {
                                return filterToCQL({
                                    elementName: `${filter.elementName.slice(0, -3)}${mtFilter.possibleFilters[mtFilter.selectedFilter].elementName}`,
                                    filter: mtFilter.possibleFilters[mtFilter.selectedFilter].filter
                                })
                            }
                        }

                        case FilterTypeCode.Unknown:
                            return null;
                        
                        default:
                            return null;
                    }
                }
                const clauses = subExpr.curWizState.filters.flatMap(filter => {
                    const res = filterToCQL(filter);
                    return res === null ? [] : [res]
                });
                console.log("Clauses", clauses);
                if (clauses.length > 0) {
                    innerResDef = (`
    ${innerResDef}
            where ${clauses.join(`
                and `
                    )}`);
                }
            }
            
            // Output filter (from the buttons on the the condition editor page)
            const existsPrefix = `${subExpr.curWizState.exists ? '' : 'not '}exists(${innerResDef})`
            const atLeastVal = subExpr.curWizState.atLeast ? `Count(${innerResDef}) >= ${subExpr.curWizState.atLeast}` : null
            const noMoreThanVal = subExpr.curWizState.noMoreThan ? `Count(${innerResDef}) <= ${subExpr.curWizState.noMoreThan}` : null
            const resDefWrapped = `${existsPrefix}${atLeastVal ? ' and ' + atLeastVal : ''}${noMoreThanVal ? ' and ' + noMoreThanVal : ''}` ;
            
            const subExprId = generateUniqueId();
            subExprDefinitions.set(subExprId, {
                identifier: subExprId,
                definition: `
define "${subExprId}":
        ${resDefWrapped}
`
            });
        }
        else {
            const subExprDef = generateCqlFromSubExpression(generateUniqueId(), subExpr, getOrCreateCodeIdentifier);
            subExprDefinitions.set(subExprDef.identifier, subExprDef);
        }
    }
    const subExprDef = `
${Array.from(subExprDefinitions.values()).map(exprDef=>exprDef.definition).join('\n')}
define ${subExpressionId}:
    ${Array.from(subExprDefinitions.keys()).join(subExpression.subExprBool === 'and' ? ' and ' : ' or ')}
`
    return {
        identifier: subExpressionId,
        definition: subExprDef
    };
}

let uniqueIdCount = 0;
function generateUniqueId() {
    return `UniqueId${uniqueIdCount++}`;
}