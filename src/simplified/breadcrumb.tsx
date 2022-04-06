import React from "react";
import "react-step-progress-bar/styles.css";
import { ProgressBar, Step } from "react-step-progress-bar";

const activityPlanSteps =
[
	{ id: 1, accomplished: true,	text: "Enter Authoring Information", scale: 2 },
	{ id: 2, accomplished: true,	text: "Select Card Type", scale: 0.5 },
	{ id: 3, accomplished: true,	text: "Enter What the card does", scale: 0.3 },
	{ id: 4, accomplished: true,	text: "Enter When the card is played", scale: 1 },
	{ id: 5, accomplished: true,	text: "Review and Save", scale: 1 },
];
const questionaireSteps =
[
	{ id: 1, accomplished: true,	text: "Enter Authoring Information", scale: 2 },
	{ id: 3, accomplished: true,	text: "Enter What the card does", scale: 0.3 },
	{ id: 4, accomplished: true,	text: "Enter When the card is played", scale: 1 },
	{ id: 5, accomplished: true,	text: "Review and Save", scale: 1 },
];
export type ProgressProps = {progress?:number, fhirType: string };

export class Progress extends React.Component<ProgressProps> {

  render() {
    let steps;
    const {progress = 0} = this.props;
    const {fhirType} = this.props;
    (fhirType == 'questionaire')? steps = questionaireSteps : steps = activityPlanSteps;
    return (
      <div style={{margin: '20px 50px'}}>
            <ProgressBar 
            percent={progress}
            filledBackground="#65BE67"
            height={5}
            >
            {steps.map(step => (
                        <Step
                          key={step.id}
                          transition="scale"
                        >
                          {({ accomplished, index }) => (
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
                            {({ accomplished, index }) => (
                                <div style={{fontSize: 'small', whiteSpace: 'nowrap'}}>{step.text}</div>
                            )}
                          </Step>))
          }
              
          </ProgressBar>
    </div>
    )}
}