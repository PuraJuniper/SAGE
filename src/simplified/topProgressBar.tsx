import React from "react";
import "react-step-progress-bar/styles.css";
import { ProgressBar, Step } from "react-step-progress-bar";


export type progressStep = {
  pageTitle: string,
  text: string
}

export type ProgressProps = {steps: progressStep[], pageTitle: string | undefined };

export class Progress extends React.Component<ProgressProps> {

  constructor(props: ProgressProps){
    super(props);
  }

  render() {
    let progression;
    for (let i = 0; i < this.props.steps.length; i++) {
      if(this.props.steps[i].pageTitle==this.props.pageTitle) {
        const temp = this.props.steps.length-1;
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
            {this.props.steps.map((step, index) => (
                        <Step
                          transitionDuration={1}
                          key={index}
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
                {this.props.steps.map((step, index) => (
                          <Step
                          transitionDuration={1}
                          key={index}
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