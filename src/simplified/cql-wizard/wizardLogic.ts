import State from "../../state";
import { Moment } from "moment";
import { getConceptsOfValueSet, SageCodeConcept, SimplifiedProfiles } from "../../helpers/schema-utils";
import { Coding, PlanDefinitionActionCondition } from "fhir/r4";
import { EditableCondition } from "./conditionEditor";
import _ from "lodash";

// Pages of the wizard
export enum WizardPage {
    SelectResource = 1,
    SelectCodes,
    SelectFilters,
}
export enum StepStatus {
    Disabled = 1, // Step is needed, but cannot be completed yet
    Incomplete,
    Complete,
    Skipped, // Step is not needed
}
export const WizardPagesArr: WizardPage[] = [WizardPage.SelectResource, WizardPage.SelectCodes, WizardPage.SelectFilters];

export interface SageCoding extends Coding {
    code: NonNullable<Coding['code']>
    display: NonNullable<Coding['display']>
    system: NonNullable<Coding['system']>
    version: NonNullable<Coding['version']>
    __sageDefinitions?: string[],
    __sageSynonyms?: string[],
}

// Wizard state and its reducer function
export interface WizardState {
    page: WizardPage,
    pageStatus: { [key in WizardPage]: StepStatus },
    resType: string,
    codes: SageCoding[],
    filters: ElementFilter[],
    actionsDisabled: boolean,
}
export type WizardAction = ['changePage', WizardPage ] | ['selectExprType', string, ElementFilter[]] | ['setCodes', SageCoding[]] | ['setFilters', ElementFilter[]] | ['setState', WizardState] | ['disableActions'] | ['enableActions'];
export function WizardReducer(prevWizState: WizardState, action: WizardAction): WizardState {
    console.log(prevWizState, action);
    // If some asynchronous action is being performed, use 'disableActions' and 'enableActions' to drop all events that occur before it is complete
    if (prevWizState.actionsDisabled && action[0] !== "enableActions") {
        return prevWizState;
    }
    switch(action[0]) {
        case 'disableActions':
            return {
                ...prevWizState,
                actionsDisabled: true,
            }
        case 'enableActions':
            return {
                ...prevWizState,
                actionsDisabled: false,
            }
        case 'setState':
            return {
                ...action[1]
            };
        case 'changePage':
            return {
                ...prevWizState,
                page: action[1]
            }
        case 'selectExprType':
            {
                let newPage = WizardPage.SelectCodes;
                const newPageStatus = {
                    ...prevWizState.pageStatus,
                    [WizardPage.SelectResource]: StepStatus.Complete,
                }
                let newCodes = prevWizState.codes;
                let newFilters = prevWizState.filters;

                // Reset selected codes and filters if the selected resource type has changed
                if (prevWizState.resType != action[1]) {
                    newCodes = [];
                    newFilters = action[2];
                    newPageStatus[WizardPage.SelectFilters] = newFilters.some(v=>v.filter.error) ? StepStatus.Incomplete : StepStatus.Complete;
                }

                // Set status of SelectCodes page
                newPageStatus[WizardPage.SelectCodes] = newCodes.length === 0 ? StepStatus.Incomplete : StepStatus.Complete;

                // Skip code selection if we're filtering for Patient
                if (['Patient'].includes(action[1])) {
                    newPageStatus[WizardPage.SelectCodes] = StepStatus.Skipped;
                    newPage = WizardPage.SelectFilters;
                }
                else {
                    // Disable filters page if no code has been selected
                    if (newCodes.length === 0) {
                        newPageStatus[WizardPage.SelectFilters] = StepStatus.Disabled;
                    }
                }

                return {
                    ...prevWizState,
                    page: newPage,
                    pageStatus: newPageStatus,
                    resType: action[1],
                    codes: newCodes,
                    filters: newFilters,
                };
            }
        case 'setCodes':
            {
                const newPageStatus = {
                    ...prevWizState.pageStatus,
                    [WizardPage.SelectCodes]: action[1].length === 0 ? StepStatus.Incomplete : StepStatus.Complete,
                }

                // Disable filters page if no code has been selected, unless the resource cannot be filtered by code
                // if (action[1].length === 0 && !(['Gender', 'Age'].includes(prevWizState.resType))) {
                //     newPageStatus[WizardPage.SelectFilters] = StepStatus.Disabled;
                // }
                // else { // Enable filters page otherwise
                    newPageStatus[WizardPage.SelectFilters] = prevWizState.filters.some(v => v.filter.error) ? StepStatus.Incomplete : StepStatus.Complete;
                // }

                return {
                    ...prevWizState,
                    pageStatus: newPageStatus,
                    codes: action[1],
                };
            }
        case 'setFilters':
            {
                const newPageStatus = {
                    ...prevWizState.pageStatus,
                    [WizardPage.SelectFilters]: action[1].some(v => v.filter.error) ? StepStatus.Incomplete : StepStatus.Complete,
                }
                return {
                    ...prevWizState,
                    pageStatus: newPageStatus,
                    filters: action[1],
                }
            }
    }
}

// Return an initialized state with values copied from `fromState` if possible
export function initFromState(state: WizardState | null): WizardState {
    const startPage = WizardPage.SelectResource;
    if (state !== null) {
        return {
            ...state,
            page: startPage,
        };
    }
    else {
        return {
            page: startPage,
            pageStatus: {
                [WizardPage.SelectResource]: StepStatus.Incomplete,
                [WizardPage.SelectCodes]: StepStatus.Disabled,
                [WizardPage.SelectFilters]: StepStatus.Disabled,
            },
            resType: "",
            codes: [],
            filters: [],
            actionsDisabled: false,
        }
    }
}

// Various types for filtering by FHIR element
export type ElementFilterType = CodingFilter | DateFilter | BooleanFilter | PeriodFilter | MultitypeFilter | UnknownFilter
export interface ElementFilter<FilterType extends ElementFilterType = ElementFilterType> {
    elementName: string,
    filter: FilterType,
}

export enum FilterType {
    Coding = "coding",
    Date = "date",
    Age = "age",
    Boolean = "boolean",
    Period = "period",
    Integer = "integer",
    Range = "range",
    Multitype = "multitype",
    Unknown = "unknown",
}

export interface CodingFilter {
    type: FilterType.Coding,
    filteredCoding: {
        filterType: CodeFilterType,
        selectedIndexes: number[], // Indexes into CodeBinding.codes
    }
    codeBinding: CodeBinding,
    error: boolean,
}
export enum CodeFilterType {
    None = "no_code",
    Filtered = "some_code(s)",
}
interface CodeBinding {
    codes: SageCodeConcept[],
    isCoding: boolean, // if false, these codes must be compared as strings in CQL
    isSingleton: boolean, // if false, we need to loop through codes of the element in CQL
    definition: string | undefined
}
export interface DateFilter {
    type: FilterType.Date | FilterType.Age,
    filteredDate: {
        filterType: DateFilterType,
        absoluteDate1: Moment | null,
        absoluteDate2: Moment | null,
        relativeAmount: number,
        relativeUnit?: RelativeDateUnit,
    },
    dateBinding: {
        definition: string | undefined
    },
    error: boolean,
}
export enum DateFilterType {
    None = "any_date",
    Before = "abs_before",
    After = "abs_after",
    Between = "abs_between",
    OlderThan = "rel_older",
    NewerThan = "rel_newer",
}

export enum RelativeDateUnit {
    Minutes = "minutes",
    Hours = "hours",
    Days = "days",
    Weeks = "weeks",
    Months = "months",
    Years = "years",
}
export interface PeriodFilter {
    type: FilterType.Period,
    filteredDate: PeriodDateFilter<PeriodDateType>,
    dateBinding: {
        definition: string | undefined
    },
    error: boolean,
}
export type PeriodDateFilter<DateType extends PeriodDateType> = DateType extends PeriodDateType.Absolute ? {
    dateType: DateType,
    startDateType: PeriodDateFilterType,
    startDate: Moment | null,
    endDateType: PeriodDateFilterType,
    endDate: Moment | null,
} : {
    dateType: DateType,
    startDateType: PeriodDateFilterType,
    startDate: RelativeDate | null,
    endDateType: PeriodDateFilterType,
    endDate: RelativeDate | null,
}
export interface RelativeDate {
    amount: number,
    unit: RelativeDateUnit,
}
export enum PeriodDateType { // Both dates must be the same type or else the CQL would not be valid
    Relative = "relative",
    Absolute = "absolute",
}
export enum PeriodDateFilterType {
    None = "any",
    Before = "before",
    After = "after",
}
export interface BooleanFilter {
    type: FilterType.Boolean,
    filteredBoolean: boolean | null,
    error: false, // All possibilities for this filter are accepted
}
export interface UnknownFilter {
    type: FilterType.Unknown,
    curValue: unknown,
    error: boolean,
}
export interface MultitypeFilter {
    type: FilterType.Multitype,
    selectedFilter?: number, // Index of selected filter in `possibleFilters`
    possibleFilters: ElementFilter[],
    error: boolean,
}

// Returns a filter type for the given element path in the profile identified by `url`
// These filter types should include all information needed by the UI to know what controls should be displayed
//  to the user for the element.
async function getFilterTypeOfElement(url: string, elementFhirPath: string, typeIndex?: number): Promise<ElementFilterType> {
    const unknownFilter: UnknownFilter = {
        type: FilterType.Unknown,
        curValue: "test",
        error: false,
    }
    const elementSchema = State.get().profiles[url][`${elementFhirPath}`];
    if (!elementSchema) {
        console.log(`No schema found for ${elementFhirPath} in ${url}`);
        return unknownFilter;
    }

    let selectedTypeIndex = typeIndex;
    // If no particular index was given, check if this element has multiple possible types
    if (selectedTypeIndex === undefined && elementSchema.type.length > 1) {
        return {
            type: FilterType.Multitype,
            possibleFilters: await Promise.all(elementSchema.type.map(async (type, i): Promise<ElementFilter> => {
                return {
                    elementName: `${type.code[0].toUpperCase()}${type.code.slice(1)}`,
                    filter: await getFilterTypeOfElement(url, elementFhirPath, i),
                }
            })),
            error: false,
        }
    }

    // Default to the first type
    if (selectedTypeIndex === undefined) {
        selectedTypeIndex = 0;
    }

    if (["code", "CodeableConcept", "Coding"].includes(elementSchema.type[selectedTypeIndex]?.code)) {
        const valueSetReference = elementSchema.binding?.reference;
        if (valueSetReference === undefined) {
            console.log(`No code bindings exist for ${elementFhirPath}`);
            return unknownFilter;
        }
        const valueSet = State.get().valuesets[valueSetReference];
        if (!valueSet) {
            console.log(`ValueSet ${valueSetReference} could not be found`);
            return unknownFilter
        }
        const codes = await getConceptsOfValueSet(valueSet.rawElement, State.get().valuesets, State.get().codesystems);

        const codingFilter: CodingFilter = {
            type: FilterType.Coding,
            codeBinding: {
                codes,
                isCoding: elementSchema.type[selectedTypeIndex]?.code !== "code",
                isSingleton: elementSchema.max === "1",
                definition: elementSchema.rawElement.definition,
            },
            filteredCoding: {
                filterType: CodeFilterType.None,
                selectedIndexes: []
            },
            error: false,
        }
        return codingFilter;
    }
    else if (["dateTime", "date"].includes(elementSchema.type[selectedTypeIndex]?.code)) {
        const filter: DateFilter = {
            type: elementFhirPath.endsWith(".birthDate") ? FilterType.Age : FilterType.Date,
            dateBinding: {
                definition: elementSchema.rawElement.definition,
            },
            filteredDate: {
                filterType: DateFilterType.None,
                absoluteDate1: null,
                absoluteDate2: null,
                relativeAmount: 0,
            },
            error: false,
        }
        return filter;
    }
    else if (["Period"].includes(elementSchema.type[selectedTypeIndex]?.code)) {
        const filter: PeriodFilter = {
            type: FilterType.Period,
            dateBinding: {
                definition: elementSchema.rawElement.definition,
            },
            filteredDate: {
                dateType: PeriodDateType.Relative,
                startDateType: PeriodDateFilterType.None,
                startDate: null,
                endDateType: PeriodDateFilterType.None,
                endDate: null,
            },
            error: false,
        }
        return filter;
    }
    else if (elementSchema.type[selectedTypeIndex]?.code === "boolean") {
        const booleanFilter: BooleanFilter = {
            type: FilterType.Boolean,
            filteredBoolean: null,
            error: false,
        }
        return booleanFilter;
    }
    else {
        console.debug("unknown", elementSchema);
        return unknownFilter;
    }
}

// Should be rewritten to use friendly-names
export async function createExpectedFiltersForResType(resType: string): Promise<ElementFilter[]> {
    let expectedElements: string[] = [];
    // let expectedBackboneElements: {[key: string]: string[]} = {}
    let schemaResType = resType;
    let url = "";
    switch(resType) {
        case "MedicationRequest": {
            expectedElements = ['status', 'statusReason', 'intent', 'category', 'doNotPerform', 'authoredOn']
            // const url = friendlyResourceRoot.RESOURCES.find(v => v.SELF.FHIR === ACTIVITY_DEFINITION)?.LIST?.find(lv => lv.FHIR === resType)?.DEFAULT_PROFILE_URI;
            url = "http://hl7.org/fhir/StructureDefinition/MedicationRequest"; // temporary
            break;
        }
        case "MedicationStatement": {
            expectedElements = ['status', 'statusReason', 'category', 'effective[x]']
            url = "http://hl7.org/fhir/StructureDefinition/MedicationStatement"; // temporary
            break;
        }
        case "AllergyIntolerance":
            expectedElements = ['clinicalStatus', 'verificationStatus', 'type', 'category', 'criticality', 'onset[x]', 'recordedDate',
             'reaction.severity', 'reaction.onset', 'reaction.substance', 'reaction.exposureRoute'];
            url = "http://hl7.org/fhir/StructureDefinition/AllergyIntolerance"; // temporary
            break;
        case "Condition":
            expectedElements = ['clinicalStatus', 'verificationStatus', 'category', 'onset[x]', 'abatement[x]', 'recordedDate', 'stage.summary','stage.type']
            url = "http://hl7.org/fhir/StructureDefinition/Condition"
            break;
        case "Encounter":
            expectedElements = ['status', 'class', 'serviceType', 'priority', 'period',
            'hospitalization.admitSource','hospitalization.reAdmission','hospitalization.dietPreference','hospitalization.specialCourtesy',
            'hospitalization.specialArrangement','hospitalization.dischargeDisposition',
                'classHistory.class', 'classHistory.period',
                'statusHistory.status', 'statusHistory.period']
            url = "http://hl7.org/fhir/StructureDefinition/Encounter"
            break;
        case "Immunization":
            expectedElements = ['status', 'occurrence[x]', 'recorded']
            url = "http://hl7.org/fhir/StructureDefinition/Immunization"
            break;
        case "Observation":
            expectedElements = ['status', 'category', 'effective[x]', 'value[x]']
            url = "http://hl7.org/fhir/StructureDefinition/Observation"
            break;
        case "Procedure":
            expectedElements = ['status', 'statusReason', 'category', 'performed[x]']
            url = "http://hl7.org/fhir/StructureDefinition/Procedure"
            break;
        case "ServiceRequest":
            expectedElements = ['status', 'intent', 'category', 'priority', 'doNotPerform', 'occurrence[x]', 'authoredOn']
            url = "http://hl7.org/fhir/StructureDefinition/ServiceRequest"
            break;
        case "Patient":
            expectedElements = ['birthDate','gender'];
            schemaResType = "Patient";
            url = "http://hl7.org/fhir/StructureDefinition/Patient";
            break;
    }

    return Promise.all(expectedElements.map(async (expectedElement) => {
        return {
            elementName: expectedElement,
            filter: await getFilterTypeOfElement(url, `${schemaResType}.${expectedElement}`)
        }
    }));
}
export const memoizedCreateExpectedFiltersForResType = _.memoize(createExpectedFiltersForResType);

// Should be rewritten to use friendly-names
export function getSelectableResourceTypes() {
    return ['AllergyIntolerance', 'Condition', 'Device', 'Encounter', 'Immunization', 'MedicationStatement', 'MedicationRequest', 'Observation', 'Procedure', 'ServiceRequest', 'Patient']
}

export function getNextPage(curPage: WizardPage, stepStatus: WizardState["pageStatus"]): [true, WizardPage | null] | [false, WizardPage | null] {
    for (const i of WizardPagesArr) {
        if (i > curPage) {
            switch (stepStatus[i]) {
                case StepStatus.Incomplete:
                case StepStatus.Complete:
                    return [true, i];
                case StepStatus.Disabled:
                    return [false, i];
                case StepStatus.Skipped:
                    break;
            }
        }
    }

    // If at least one step is not completed/skipped, we can't save the expression
    const isWizIncomplete = Object.entries(stepStatus).some(e => e[1] != StepStatus.Complete && e[1] != StepStatus.Skipped);
    return isWizIncomplete ? [false, null] : [true, null];
}

export function getPrevPage(curPage: WizardPage, stepStatus: WizardState["pageStatus"]): [true, WizardPage] | [false, null] {
    if (curPage === WizardPage.SelectResource) {
        return [false, null];
    }
    // Since we're not on the first page, there must be a previous page
    const prevPage: [true, WizardPage] = [true, WizardPage.SelectResource];
    for (const i of WizardPagesArr) {
        if (i < curPage && (stepStatus[i] !== StepStatus.Skipped && stepStatus[i] != StepStatus.Disabled) && i > prevPage[1]) {
            prevPage[1] = i;
        }
    }
    return prevPage;
}

// Temporary storage/loading of wizard states for purpose of cql export feature
export const exprToWizStateMap: { [key: string]: EditableCondition } = {};
export function findEditableCondition(conditions: PlanDefinitionActionCondition[]): EditableCondition | null {
    for (const cond of conditions) {
        if (cond.id !== undefined && exprToWizStateMap[cond.id] !== undefined) {
            return exprToWizStateMap[cond.id];
        }
    }
    return null;
}
export function saveEditableCondition(conditionId: string, stateToSave: EditableCondition) {
    exprToWizStateMap[conditionId] = stateToSave;
}