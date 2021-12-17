import {useState, useEffect} from "react";
import {BaseCard} from"./baseCard";
import { CSSTransition } from 'react-transition-group';
import { Container, Button } from 'react-bootstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faBracketsCurly, faBookMedical, faCode, faTurtle, faCaretRight} from  '@fortawesome/pro-solid-svg-icons';
import State from "../state";

const SelectView = () => {
    const resources = [
        "CPGAdministerMedicationActivityDefinition",
        "CPGCollectInformationActivityDefinition",
        "CPGCommunicationRequestActivityDefinition",
        "CPGComputableActivityDefinition",
        "CPGDispenseMedicationActivityDefinition",
        "CPGDocumentMedicationActivityDefinition",
        "CPGEnrollmentActivityDefinition",
        "CPGGenerateReportActivityDefinition",
        "CPGImmunizationRecommendationActivityDefinition",
        "CPGMedicationRequestActivityDefinition",
        "CPGProposeDiagnosisTaskActivityDefinition",
        "CPGRecordDetectedIssueTaskActivityDefinition",
        "CPGRecordInferenceTaskActivityDefinition",
        "CPGReportFlagTaskActivityDefinition",
        "CPGServiceRequestActivityDefinition",
        "Questionnaire"
    ];

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
    
    const baseUrl = "http://hl7.org/fhir/uv/cpg/STU1/ActivityDefinition-";

    return (
        <div style={{marginTop:"50px", paddingRight:"12px"}}>
            <div className="row">
            <h3 className="col-lg-10 col-md-9" style={{color:"#2a6b92"}}><b>Available Resources</b></h3>
            <button className="navigate col-lg-2 col-md-3" 
                onClick={() => State.get().set("ui", {status:"collection"})}>
                Saved Resources&nbsp;<FontAwesomeIcon icon={faCaretRight} />
                            
            </button>
            </div>
            <div className="row box">
                {
                resources.map(
                        (resource, i) => {
                        return (
                        <div className="col-lg-3 col-md-4 col-sm-6" key={i}>
                        <BaseCard 
                        header={resource.length > "ActivityDefinition".length ? "ActivityDefinition" : resource}
                        title={resource} 
                        content={
                        <div style={{fontSize:"20px"}}>
                            <a href={links[i]} target="_blank" className="c-tooltip">
                                <FontAwesomeIcon icon={faBookMedical} />
                                <span className="c-tooltiptext">FHIR Docs</span>
                            </a>
                            &nbsp;&nbsp;
                            <span style={{color:"black"}}>
                            |
                            </span>
                            &nbsp;
                            <a href={baseUrl + links[i]?.slice(46) + ".xml.html"} target="_blank" className="c-tooltip">
                                <FontAwesomeIcon icon={faCode} />
                                <span className="c-tooltiptext">XML Spec</span>
                            </a>
                            &nbsp;&nbsp;
                            <a href={baseUrl + links[i]?.slice(46) + ".json.html"} target="_blank" className="c-tooltip">
                                <FontAwesomeIcon icon={faBracketsCurly} />
                                <span className="c-tooltiptext">JSON Spec</span>
                            </a>
                            &nbsp;&nbsp;
                            <a href={baseUrl + links[i]?.slice(46) + ".ttl.html"} target="_blank" className="c-tooltip">
                                <FontAwesomeIcon icon={faTurtle} />
                                <span className="c-tooltiptext">TTL Spec</span>
                            </a>
                        </div>
                        }
                        wait={i*25}
                        clickable={true}
                        profile={profiles[i]}
                        />
                        </div>
                )})
        }
            </div>
        </div>
    );
}

export default SelectView