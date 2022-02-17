import { Expression } from "fhir/r4";
import { VsacResponse } from "./cqlWizardSelectCodes";

// Pages of the wizard
export enum WizardPage {
    SelectResource = 1,
    SelectCodes,
    SelectFilters
}
export const WizardSteps = [WizardPage.SelectResource, WizardPage.SelectCodes, WizardPage.SelectFilters];

// Wizard state and its reducer function
export interface WizardState {
    page: WizardPage,
    pageDisabled: {[key in WizardPage]?: boolean},
    resType: string,
    codes: VsacResponse[],
    filters: string[],
}
export type WizardAction = ['changeStep', WizardPage] | ['selectExprType', string] | ['setCodes', VsacResponse[]] | ['setFilters', string[]];
export function WizardReducer(prevWizState: WizardState, action: WizardAction): WizardState {
    switch(action[0]) {
        case 'changeStep':
            if (action[1] in WizardPage) {
                return {
                    ...prevWizState,
                    page: action[1]
                }
            }
            else {
                return prevWizState;
            }
        case 'selectExprType':
            {
                let newPage = WizardPage.SelectCodes;
                const newPageDisabled: typeof prevWizState.pageDisabled = {} // enable all pages
                let newCodes = prevWizState.codes;
                let newFilters = prevWizState.filters;

                // Reset selected codes and filters if the selected resource type has changed
                if (prevWizState.resType != action[1]) {
                    newCodes = [];
                    newFilters = [];
                }

                // Skip and disable code selection if we're filtering for age or gender
                if (['Gender', 'Age'].includes(action[1])) {
                    newPage = WizardPage.SelectFilters;
                    newPageDisabled[WizardPage.SelectCodes] = true;
                }
                else {
                    // Disable filters page if no code has been selected
                    if (newCodes.length === 0) {
                        newPageDisabled[WizardPage.SelectFilters] = true;
                    }
                }
                
                return {
                    ...prevWizState,
                    page: newPage,
                    pageDisabled: newPageDisabled,
                    resType: action[1],
                    codes: newCodes,
                    filters: newFilters,
                };
            }
        case 'setCodes':
            {
                const newPageDisabled = {
                    ...prevWizState.pageDisabled,
                }

                // Disable filters page if no code has been selected, unless the resource cannot be filtered by code
                if (action[1].length === 0 && !(['Gender', 'Age'].includes(prevWizState.resType))) {
                    newPageDisabled[WizardPage.SelectFilters] = true;
                }
                else {
                    newPageDisabled[WizardPage.SelectFilters] = false;
                }

                return {
                    ...prevWizState,
                    pageDisabled: newPageDisabled,
                    codes: action[1],
                };
            }
        case 'setFilters':
            return {
                ...prevWizState,
                filters: action[1],
            }
    }
}

export function initWizState(initialExpr: Expression | null): WizardState {
    return {
        page: WizardPage.SelectResource,
        pageDisabled: {
            [WizardPage.SelectCodes]: true,
            [WizardPage.SelectFilters]: true
        },
        resType: "",
        codes: [],
        filters: []
    }
}

export function getNextPage(page: WizardPage, pageDisabled: WizardState["pageDisabled"]): [true, WizardPage] | [false, null] {
    for (const i of WizardSteps) {
        if (i > page && !pageDisabled[i]) {
            return [true, i];
        }
    }
    return [false, null];
}

export function getPrevPage(page: WizardPage, pageDisabled: WizardState["pageDisabled"]): [true, WizardPage] | [false, null] {
    if (page === WizardPage.SelectResource) {
        return [false, null];
    }
    // Since we're not on the first page, there must be a previous page
    const prevPage: [true, WizardPage] = [true, WizardPage.SelectResource];
    for (const i of WizardSteps) {
        if (i < page && !pageDisabled[i] && i > prevPage[1]) {
            prevPage[1] = i;
        }
    }
    return prevPage;
}