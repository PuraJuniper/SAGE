import React from "react";
import "react-step-progress-bar/styles.css";
import { ProgressBar, Step } from "react-step-progress-bar";

const activityPlanSteps =
[
	{id: 1, pageTitle: "Authoring Information",	    text: "Enter Authoring Information"},
	{id: 2, pageTitle: "What Is The Card Type?",	  text: "Select Card Type"},
	{id: 3, pageTitle: "What does the card do?",	  text: "Enter What the card does"},
	{id: 4, pageTitle: "When is the card played?",	text: "Enter When the card is played"},
	{id: 5, pageTitle: "Review card",	              text: "Review and Save"},
]
const questionaireSteps =
[
	{ id: 1, pageTitle:"Authoring Information",	           text: "Enter Authoring Information"},
	{ id: 2, pageTitle:"Page 1: Creating a Questionnaire", text: "Enter What the card does"},
	{ id: 3, pageTitle:"Page 2: Adding Conditions",	       text: "Enter When the card is played"},
	{ id: 4, pageTitle:"Page 3: Card Preview",	           text: "Review and Save"},
];
export type ProgressProps = {fhirType: string, pageTitle: any };

export class Progress extends React.Component<ProgressProps> {

  constructor(props: ProgressProps){
    super(props);
  }

  render() {
    let steps;
    let progression;
    (this.props.fhirType == 'questionaire')? steps = questionaireSteps : steps = activityPlanSteps;
    for (let i = 0; i < steps.length; i++) {
      if(steps[i].pageTitle==this.props.pageTitle) {
        const temp = steps.length-1;
        const temp2 = 100/temp;
        progression = temp2 * i - 0.1;
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
                          transitionDuration={1}
                          key={step.id}
                        >
                          {(props) => (
                              (props !== undefined)?
                                <div  className={`step-numbers ${props.accomplished ? "accomplished" : ""}`}></div>
                              : <div></div>
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
                          transitionDuration={1}
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