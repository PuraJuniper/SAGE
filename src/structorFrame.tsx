import { useEffect, useState } from "react";
import { Questionnaire } from "fhir/r4";
import * as SageUtils from "./helpers/sage-utils";
import State from "./reactions";

// All properties should be optional to force us to verify the output
interface StructorOutput {
    questionnaireJSON?: string,
}

const StructorFrame = () => {
	useEffect(() => {
		const handler = ((event: CustomEvent<StructorOutput>) => {
			console.log(event);
            if (!(event.detail?.questionnaireJSON)) {
                console.log("Error - Invalid data received from AHRQ CQL Authoring Tool");
                return;
            }
            const questionnaire = JSON.parse(event.detail.questionnaireJSON) as Questionnaire; // trusting this is a valid Questionnaire
            console.log(questionnaire);
		}) as EventListener;

		window.document.addEventListener('StructorSendToSAGE', handler, false)
	
		return () => window.document.removeEventListener("StructorSendToSAGE", handler)
	}, [])
	
	return (
		<div>
            <iframe width="100%" height="600vh"
                src={"http://localhost:8081/structor"}
            />
		</div>
		);
}

export default StructorFrame;