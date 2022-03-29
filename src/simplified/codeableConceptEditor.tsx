import AsyncSelect from "react-select/async";
import { SageCoding } from "./cql-wizard/wizardLogic";
import * as Bioportal from './cql-wizard/bioportal';
import _ from "lodash"
import { CodeableConcept, Coding } from "fhir/r4";

function loadCodes(inputValue: string, callback: (results: SageCoding[]) => void) {
    Bioportal.searchForText(inputValue).then(v => callback(v));
}
const debouncedLoadCodes = _.debounce(loadCodes, 500)

export interface CodeableConceptEditorProps {
    curCodeableConcept: CodeableConcept,
    setCurCodeableConcept: (newCodeableConcept: CodeableConcept) => void,
    codeFilter?: string,
}

const CodeableConceptEditor: React.FC<CodeableConceptEditorProps> = (props: CodeableConceptEditorProps) => {
    const selectedCode: Coding | undefined = props.curCodeableConcept.coding?.[0];
    function createCodeableConceptFromCode(code: Coding | null): CodeableConcept {
        return {
            coding: code ? [code] : undefined
        }
    }

    return (
        <div>
            <AsyncSelect<Coding>
                loadOptions={debouncedLoadCodes}
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