import friendlyNames from "../../friendly-names.json";



const getType = (type: string) => {
    return friendlyNames.RESOURCES.find(
        (resourceTypes) => resourceTypes.SELF.FHIR === type)?.SELF;
    }
    
    export const PLAN_DEFINITION = getType("PlanDefinition");
    export const ACTIVITY_DEFINITION = getType("ActivityDefinition");
    export const LIBRARY = getType("Library");
    export const QUESTIONNAIRE = getType("Questionnaire");
    
    
    export const fhirToFriendly = (fhirWord: string) => {
        var result =
        friendlyNames.RESOURCES.find(
            (resource) => {
                return resource.SELF.FHIR === fhirWord;
            }
            );
            if (typeof(result) != "undefined") {
                return result.SELF.FRIENDLY;
            } else {
                return "Undefined"
            }
        }
        
        export  const friendlyToFhir = (friendlyWord: string) => {
            let result = friendlyNames.RESOURCES.find(resource => resource.SELF.FRIENDLY == friendlyWord);
                if (typeof(result) === 'undefined') {
                    return "Undefined"
                } else {
                    return result.SELF.FHIR;
                }
            }