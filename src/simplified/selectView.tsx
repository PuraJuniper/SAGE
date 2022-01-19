import {BaseCard} from"./baseCard";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faInfoCircle} from  '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import friendlyNames from "../../friendly-names.json";

const SelectView = () => {
    
    // const resources = [
    //     "CPGAdministerMedicationActivityDefinition",
    //     "CPGCollectInformationActivityDefinition",
    //     "CPGCommunicationRequestActivityDefinition",
    //     "CPGComputableActivityDefinition",
    //     "CPGDispenseMedicationActivityDefinition",
    //     "CPGDocumentMedicationActivityDefinition",
    //     "CPGEnrollmentActivityDefinition",
    //     "CPGGenerateReportActivityDefinition",
    //     "CPGImmunizationRecommendationActivityDefinition",
    //     "CPGMedicationRequestActivityDefinition",
    //     "CPGProposeDiagnosisTaskActivityDefinition",
    //     "CPGRecordDetectedIssueTaskActivityDefinition",
    //     "CPGRecordInferenceTaskActivityDefinition",
    //     "CPGReportFlagTaskActivityDefinition",
    //     "CPGServiceRequestActivityDefinition",
    //     "Questionnaire"
    // ];
    const linkPrefixes = {
        "CPG": "http://hl7.org/fhir/uv/cpg/",
        "SDC": "http://hl7.org/fhir/uv/sdc/"
    } 
    const links = [
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-administermedication-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-collectinformation-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-communicationrequest-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-computableactivity",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-dispensemedication-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-documentmedication-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-enrollment-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-generatereport-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-immunizationrecommendation-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-medicationrequest-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-proposediagnosistask-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-recorddetectedissuetask-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-recordinferencetask-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-reportflagtask-activitydefinition",
        "http://hl7.org/fhir/uv/cpg/ActivityDefinition/cpg-servicerequest-activitydefinition",
        "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire"
    ];
    
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
    
    const makeCard = (resource: { FHIR: string; FRIENDLY: string; }, i: number): JSX.Element => {
        return (
            <div className="col-lg-3 col-md-4 col-sm-6" key={i}>
            <BaseCard
            header={resource.FHIR}
            title={resource.FRIENDLY}
            content={<div style={{ fontSize: "20px", textAlign: "right" }}>
            <a href={links[i]} target="_blank" rel="noreferrer" className="c-tooltip">
            <FontAwesomeIcon icon={faInfoCircle} />
            <span className="c-tooltiptext">FHIR Docs</span>
            </a>
            </div>}
            wait={i * 25}
            clickable={true}
            profile={profiles[i]} />
            </div>
            );
        };
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
                friendlyNames.FHIR_TO_FRIENDLY.ACTIVITY_DEFINITIONS_LIST.map(makeCard)
            }
            {
                friendlyNames.FHIR_TO_FRIENDLY.PLAN_DEFINITION_LIST.map(makeCard)
            }
            </div>
            </div>
            );
        }
        
        export default SelectView