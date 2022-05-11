import React, { Dispatch, useEffect, useState } from "react";
import { SageCoding, WizardAction, WizardState } from './wizardLogic';
import * as Bioportal from './bioportal';
import AsyncSelect from "react-select/async";
import { debouncedLoadCodes, loadCodes } from "../codeableConceptEditor";

const ALL_SYSTEMS = "__ALL_SYSTEMS__";

interface CqlWizardSelectCodesProps {
    wizDispatch: Dispatch<WizardAction>,
    wizState: WizardState,
}

export const CqlWizardSelectCodes: React.FunctionComponent<CqlWizardSelectCodesProps> = (props) => {
    const [searchInput, setSearchInput] = useState("");
    const [searchResults, setSearchResults] = useState<SageCoding[]>([]);
    const [searchSystem, setSearchSystem] = useState<string>(ALL_SYSTEMS);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (props.wizState.codes.length === 0) {
            wizDispatch(['setCodes', [{
                code: 'test_code',
                display: 'test code',
                system: 'test',
                version: 'test',
            }]])
        }
        console.log(props.wizState.codes);
    })
    const {
        wizState,
        wizDispatch,
    } = props;

    return (
        <AsyncSelect<SageCoding, true>
            isMulti
            inputValue={searchInput}
            onInputChange={(newInput, action): string => {
                // Must return a value (https://github.com/JedWatson/react-select/issues/3210#issuecomment-566482487)
                switch (action.action) {
                    case "set-value":
                    case "input-blur":
                        return searchInput;
                    case "input-change":
                        setSearchInput(newInput);
                        return newInput;
                    case "menu-close":
                        setSearchInput("");
                        return "";
                }
            }}
            closeMenuOnSelect={false}
            closeMenuOnScroll={false}
            options={wizState.codes}
            loadOptions={debouncedLoadCodes}
            noOptionsMessage={input => input.inputValue !== "" ? `No code found for ${input.inputValue}` : `Please enter a code or the name of a code`}
            onChange={newCodes => wizDispatch(['setCodes', [...newCodes]])}
            formatOptionLabel={code => {
                return (
                    <div>
                        <b>{code.display ?? "Unknown Code Name"}</b>
                        <br />
                        {code.code} <i>{(code.system && Bioportal.systemUrlToOntology[code.system]) ?? code.system}</i>
                    </div>
                )
            }}
            getOptionValue={option => `${option.system}${option.version}${option.code}`}
            isOptionSelected={option => wizState.codes.some(v => option.code === v?.code && option.system === v?.system && option.version === v?.version)}
            styles={{
                menu: provided => ({ ...provided, zIndex: 9999 }), // https://stackoverflow.com/a/55831990
                control: provided => ({ ...provided, minHeight: "60px" }) 
            }}
        />
    );
}
