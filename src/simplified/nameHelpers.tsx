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
    
    export function getFhirProps(resourceType: string) {
        return friendlyNames.RESOURCES.find(
            (resource) => {
                return resource.SELF.FHIR === resourceType;
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
            return elseIfUndefined(getFhirProps(fhirWord)
            ,((o:string) => (o))
            , defaultUndefinedString);
        }
        
        export  const friendlyToFhir = (friendlyWord: string) => {
            return elseIfUndefined(friendlyNames.RESOURCES.find(resource => resource.SELF.FRIENDLY == friendlyWord)
            ,((object: { SELF: { FHIR: any; }; }) => object.SELF.FHIR)
            , defaultUndefinedString);
        }
        
        export const defaultProfileUriOfResourceType = (resourceType: string) => {
            return elseIfUndefined(getFhirProps(resourceType)
            ,((object: { SELF: { DEFAULT_PROFILE_URI: any; }; }) => object.SELF.DEFAULT_PROFILE_URI)
            , defaultUndefinedString);
        }
        
        
        