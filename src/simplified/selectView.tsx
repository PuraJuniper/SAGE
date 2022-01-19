import {BaseCard} from"./baseCard";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faInfoCircle} from  '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import friendlyNames from "../../friendly-names.json";

const SelectView = () => {
    const linkProperties = {
        "prefix": "http://hl7.org/fhir/uv/"
    } 
    function makeLink (prefix: string, code: string, resource: { FHIR: any; FRIENDLY?: string; }, type: { FHIR?: string; FRIENDLY?: string; ""?: any; }) {
        return prefix + code + "/" + type.FHIR + "/" + code + "-" + (resource.FHIR + "-" + type.FHIR).toLowerCase()
    }
    
    const profiles = [
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-administermedication",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-collectinformationactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-communicationactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-computableactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-dispensemedicationactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-documentmedicationactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-enrollmentactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-generatereportactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-immunizationactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-medicationrequestactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-proposediagnosisactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recorddetectedissueactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recordinferenceactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-reportflagactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-servicerequestactivity",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-shareableactivitydefinition",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-publishableactivity",
        "http://hl7.org/fhir/StructureDefinition/ActivityDefinition"
    ]
    return (
        <div style={{marginTop:"50px", paddingRight:"12px"}}>
        <div className="row">
        <h3 className="col-lg-10 col-md-9" style={{color:"#2a6b92"}}><b>Make a Card</b></h3>
        <button className="navigate col-lg-2 col-md-3" 
        onClick={() => State.get().set("ui", {status:"collection"})}>
        Saved Resources&nbsp;<FontAwesomeIcon icon={faCaretRight} />
        
        </button>
        </div>
        <div className="row box">
        {
            friendlyNames.RESOURCES.map(
                (resourceType) => (
                    resourceType.LIST.map((resource, i) => (
                        <div className="col-lg-3 col-md-4 col-sm-6" key={i}>
                        <BaseCard
                        header={resourceType.SELF.FRIENDLY}
                        title={resource.FRIENDLY}
                        content={<div style={{ fontSize: "20px", textAlign: "right" }}>
                        <a href={makeLink("http://hl7.org/fhir/uv/", "cpg", resource, resourceType.SELF)} target="_blank" rel="noreferrer" className="c-tooltip">
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <span className="c-tooltiptext">FHIR Docs</span>
                        </a>
                        </div>}
                        wait={i * 25}
                        clickable={true}
                        profile={profiles[i]} />
                        </div>
                        )
                        )
                        )
                        )
                    }
                    </div>
                    </div>
                    );
                }
                
                export default SelectView