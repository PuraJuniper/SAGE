import friendlyNames from "../../friendly-names.json";

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
        var result =
        friendlyNames.RESOURCES.find(
            (resource) => {
                return resource.SELF.FRIENDLY === friendlyWord;
            }
            );
            if (typeof(result) != "undefined") {
                return result.SELF.FHIR;
            } else {
                return "Undefined"
            }
        }