import AsyncSelect from "react-select/async";
import { SageCoding } from "./cql-wizard/wizardLogic";
import * as Bioportal from './cql-wizard/bioportal';
import _ from "lodash"
import { CodeableConcept, Coding } from "fhir/r4";
import { useEffect, useState } from "react";
import * as SchemaUtils from "../helpers/schema-utils";
import State from "../state";

function loadCodes(inputValue: string, callback: (results: SageCoding[]) => void, filteredCodeSet?: SageCoding[]) {
    console.log(filteredCodeSet);
    if (filteredCodeSet !== undefined) {
        const lowerCaseInput = inputValue.toLowerCase();
        callback(filteredCodeSet.filter(v => v.code === inputValue || v.display.toLowerCase().startsWith(lowerCaseInput)));
    }
    Bioportal.searchForText(inputValue).then(v => callback(v));
}
const debouncedLoadCodes = _.debounce(loadCodes, 500)

export interface CodeableConceptEditorProps {
    curCodeableConcept: CodeableConcept,
    setCurCodeableConcept: (newCodeableConcept: CodeableConcept) => void,
    codeValueSetUrl?: string,
}

const CodeableConceptEditor: React.FC<CodeableConceptEditorProps> = (props: CodeableConceptEditorProps) => {
    const selectedCode: Coding | undefined = props.curCodeableConcept.coding?.[0];
    function createCodeableConceptFromCode(code: Coding | null): CodeableConcept {
        return {
            coding: code ? [code] : undefined
        }
    }

    const [filteredCodes, setFilteredCodes] = useState<SageCoding[] | undefined>(undefined);
    useEffect(() => {
        async function getPossibleCodes() {
            if (props.codeValueSetUrl !== undefined) {
                const valueSet = State.get().valuesets[props.codeValueSetUrl];
                if (!valueSet) {
                    setFilteredCodes(undefined);
                }
                else {
                    setFilteredCodes((await SchemaUtils.getConceptsOfValueSet(valueSet.rawElement, State.get().valuesets, State.get().codesystems)).map(v => {
                        return {
                            code: v.code,
                            display: v.display ?? "Unknown Code Display",
                            system: v.system,
                            version: v.version ?? "Unknown Code Version",
                        }
                    }));
                }
            }
            else {
                setFilteredCodes(undefined);
            }
        }
        getPossibleCodes();
    }, [props.codeValueSetUrl])

    return (
        <div>
            <AsyncSelect<Coding>
                loadOptions={(inputValue: string, callback: (results: SageCoding[]) => void) => debouncedLoadCodes(inputValue, callback, filteredCodes)}
                value={selectedCode}
                noOptionsMessage={input => input.inputValue !== "" ? `No code found for ${input.inputValue}` : `Please enter a code or the name of a code`}
                isClearable={true}
                onChange={newCode => props.setCurCodeableConcept(createCodeableConceptFromCode(newCode))}
                formatOptionLabel={code => {
                    return (
                        <div>
                            <b>{code.display ?? "Unknown Code Name"}</b>
                            <br />
                            {code.code} <i>{(code.system && Bioportal.systemUrlToOntology[code.system]) ?? code.system}</i>
                        </div>
                    )
                }}
                isOptionSelected={option => option.code === selectedCode?.code && option.system === selectedCode?.system && option.version === selectedCode?._version}
            />
        </div>
    )
}

export default CodeableConceptEditor;