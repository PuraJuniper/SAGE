import friendlyNames from "../../friendly-names.json";

export type FriendlyResource = typeof friendlyNames.RESOURCES extends Array<infer T> ? T : never;
export type FriendlyResourceSelf = FriendlyResource["SELF"];
export type FriendlyResourceListEntry = FriendlyResource["LIST"] extends Array<infer T> ? T : never;

const defaultUndefinedString = "undefined";

const getType = (type: string) => {
    const result = friendlyNames.RESOURCES.find(
        (resourceTypes) => resourceTypes.SELF.FHIR === type);
    if (typeof(result) === 'undefined') {
        return "Undefined";
    } else {
        return result.SELF.FHIR;
    }
}
    
export const PLAN_DEFINITION = getType("PlanDefinition");
export const ACTIVITY_DEFINITION = getType("ActivityDefinition");
export const LIBRARY = getType("Library");
export const QUESTIONNAIRE = getType("Questionnaire");
export const DATA_ELEMENT = getType("DataElement");
export const VALUE_SET = getType("ValueSet");
export const STRUCTURE_DEFINITION = getType("StructureDefinition");

export function getFhirSelf(resourceParent: FriendlyResource[], resourceType: string) {
    return resourceParent.find(
        (resource) => {
            return resource.SELF.FHIR === resourceType;
        }
    );
}

function elseIfUndefined<T>(maybeUndefinedObject: T, ifDefinedFunction: (input: Exclude<T, undefined>) => string): string | undefined
function elseIfUndefined<T>(maybeUndefinedObject: T, ifDefinedFunction: (input: Exclude<T, undefined>) => string, replacementText: string): string
function elseIfUndefined<T>(maybeUndefinedObject: T, ifDefinedFunction: (input: Exclude<T, undefined>) => string, replacementText?: string): string | undefined {
    if (typeof(maybeUndefinedObject) === 'undefined') {
        return replacementText ?? undefined;
    } else {
        return ifDefinedFunction(maybeUndefinedObject as Exclude<T, undefined>); // This cast is necessary for some reason. todo: figure out how to remove it
    }
}

export const fhirToFriendly = (fhirWord: string) => {
    return elseIfUndefined(getFhirSelf(friendlyNames.RESOURCES, fhirWord)
        ,((o) => (o.SELF.FRIENDLY))
        , defaultUndefinedString);
}

export const friendlyToFhir = (friendlyWord: string) => {
    return elseIfUndefined(friendlyNames.RESOURCES.find(resource => resource.SELF.FRIENDLY == friendlyWord)
        ,((object) => object.SELF.FHIR)
        , defaultUndefinedString);
}

export function profileToFriendlyResourceListEntry(profile?: string) {
    if (!profile) {
        return undefined;
    }
    for (const resource of friendlyNames.RESOURCES) {
        const out = resource.LIST.find(res => res.PROFILE_URI == profile);
        if (out) {
            return out;
        }
    }
} 

export const defaultProfileUriOfResourceType = (resourceType: string) => {
    return elseIfUndefined(getFhirSelf(friendlyNames.RESOURCES, resourceType)
        ,((object) => object.SELF.DEFAULT_PROFILE_URI));
}
