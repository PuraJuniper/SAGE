import React from "react";
import "react-step-progress-bar/styles.css";
import { ProgressBar, Step } from "react-step-progress-bar";

const activityPlanSteps =
[
	{ id: 1, accomplished: true, pageTitle: "Authoring Information",	text: "Enter Authoring Information", scale: 2 },
	{ id: 2, accomplished: true, pageTitle: "What Is The Card Type?",	text: "Select Card Type", scale: 0.5 },
	{ id: 3, accomplished: true, pageTitle: "What does the card do?",	text: "Enter What the card does", scale: 0.3 },
	{ id: 4, accomplished: true, pageTitle: "When is the card played?",	text: "Enter When the card is played", scale: 1 },
	{ id: 5, accomplished: true, pageTitle: "Review card",	text: "Review and Save", scale: 1 },
];
const questionaireSteps =
[
	{ id: 1, accomplished: true, pageTitle:"Authoring Information",	text: "Enter Authoring Information", scale: 2 },
	{ id: 2, accomplished: true, pageTitle:"Page 1: Creating a Questionnaire",	text: "Enter What the card does", scale: 0.3 },
	{ id: 3, accomplished: true, pageTitle:"Page 2: Adding Conditions",	text: "Enter When the card is played", scale: 1 },
	{ id: 4, accomplished: true, pageTitle:"Page 3: Card Preview",	text: "Review and Save", scale: 1 },
];
export type ProgressProps = {progress?:number, fhirType: string, pageTitle: any };

export class Progress extends React.Component<ProgressProps> {

  render() {
    let steps;
    let progression;
    const {progress = 0} = this.props;
    const {fhirType} = this.props;
    const {pageTitle} = this.props;
    console.log(pageTitle);
    (fhirType == 'questionaire')? steps = questionaireSteps : steps = activityPlanSteps;
    for (let i = 0; i < steps.length; i++) {
      if(steps[i].pageTitle==pageTitle) {
        const temp = steps.length-1;
        const temp2 = 100/temp;
        progression = temp2 * i;
        console.log(progression)
      }
    }
    return (
      <div style={{margin: '20px 50px'}}>
            <ProgressBar 
            percent={progression}
            filledBackground="#65BE67"
            height={5}
            >
            {steps.map(step => (
                        <Step
                          key={step.id}
                          transition="scale"
                        >
                          {({ accomplished }) => (
                              <div  className={`step-numbers ${accomplished ? "accomplished" : ""}`}></div>
                          )}
                        </Step>))
            }             
          </ProgressBar>
          <div style={{marginBottom: '15px', marginTop: '15px'}}></div>
          <ProgressBar
          unfilledBackground = '#fff'
          >
                {steps.map(step => (
                          <Step
                          key={step.id}
                          >
                            {() => (
                                <div style={{fontSize: 'small', whiteSpace: 'nowrap'}}>{step.text}</div>
                            )}
                          </Step>))
          }
              
          </ProgressBar>
    </div>
    )}
}