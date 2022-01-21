import { ACTIVITY_DEFINITION, getFhirProps, PLAN_DEFINITION, QUESTIONNAIRE } from "./simplified/nameHelpers";

const hiddenElementsForType = (resourceType: string): string[] => {
    const suffixes = ['meta', 'url', 'id', 'name', 'publisher', 'version', 'linkId'];
    return suffixes.map(
        (suffix) => resourceType + '.' + suffix
        )
    }
    
    const hiddenElements = ['*.meta']
    .concat(hiddenElementsForType(PLAN_DEFINITION))
    .concat(hiddenElementsForType(ACTIVITY_DEFINITION))
    .concat(hiddenElementsForType(QUESTIONNAIRE));

    export {hiddenElements}
    