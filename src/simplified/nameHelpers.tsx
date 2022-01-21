import friendlyNames from "../../friendly-names.json";

const defaultUndefinedString = "undefined";

const getType = (type: string) => {
    let result = friendlyNames.RESOURCES.find(
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

    
    
     export function getFhirSelf(resourceParent: any[], resourceType: string) {
        return resourceParent.find(
            (resource) => {
                return resource.SELF.FHIR === resourceType|| resource.FHIR === resourceType;
            }
            );
        }
        
        function elseIfUndefined(maybeUndefinedObject: any, ifDefinedFunction: any, replacementText: string): string {
            if (typeof(maybeUndefinedObject) === 'undefined') {
                return replacementText
            } else {
                return ifDefinedFunction(maybeUndefinedObject);
            }
        }
        
        export const fhirToFriendly = (fhirWord: string) => {
            return elseIfUndefined(getFhirSelf(friendlyNames.RESOURCES, fhirWord)
            ,((o:string) => (o))
            , defaultUndefinedString);
        }
        
        export  const friendlyToFhir = (friendlyWord: string) => {
            return elseIfUndefined(friendlyNames.RESOURCES.find(resource => resource.SELF.FRIENDLY == friendlyWord)
            ,((object: { SELF: { FHIR: any; }; }) => object.SELF.FHIR)
            , defaultUndefinedString);
        }
        
        export const defaultProfileUriOfResourceType = (resourceType: string) => {
            return elseIfUndefined(getFhirSelf(friendlyNames.RESOURCES, resourceType)
            ,((object: { SELF: { DEFAULT_PROFILE_URI: any; }; }) => object.SELF.DEFAULT_PROFILE_URI)
            , defaultUndefinedString);
        }
        
        
        