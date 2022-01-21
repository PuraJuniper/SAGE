import {BaseCard} from"./baseCard";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faInfoCircle} from  '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import { Container, Row, Col } from "react-bootstrap";

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
            <h3 className="col-lg-10 col-md-9" style={{color:"#2a6b92"}}><b>Make a Card</b></h3>
            <button className="navigate col-lg-2 col-md-3" 
                onClick={() => State.get().set("ui", {status:"collection"})}>
                Saved Resources&nbsp;<FontAwesomeIcon icon={faCaretRight} />
                            
            </button>
            </div>
            <div className="box">
            <Container fluid="lg">
                <Row lg="4" md="3" sm="2" noGutters> 
                {
                resources.map(
                        (resource, i) => {
                            const isActivity = resource != 'Questionnaire';
                        return (
                        <div style={{padding: "10px"}} key={i}><Col>
                            <BaseCard 
                                bsBg="sage-white"
                                bsText="sage-blue"
                                bsBorder={isActivity ? "activitydefinition" : "questionnaire"}
                                header={isActivity ? "ActivityDefinition" : "Questionnaire"}
                                title={resource} 
                                content={
                                <div style={{fontSize:"20px", textAlign:"right"}}>
                                    <a href={links[i]} target="_blank" rel="noreferrer" className="c-tooltip">
                                        <FontAwesomeIcon icon={faInfoCircle} />
                                        <span className="c-tooltiptext">FHIR Docs</span>
                                    </a>
                                </div>
                                }
                                wait={i*25}
                                clickable={true}
                                profile={profiles[i]}
                            />
                        </Col></div>
                )})
        }
                </Row>
            </Container>
            </div>
        </div>
    );
}

export default SelectView