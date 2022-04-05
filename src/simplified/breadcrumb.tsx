import React from "react";
import "react-step-progress-bar/styles.css";
import { ProgressBar, Step } from "react-step-progress-bar";

export class Progress extends React.Component {
  render() {
    return (
      <ProgressBar
        percent={75}
        filledBackground="linear-gradient(to right, #fefb72, #f0bb31)"
      >
        <Step transition="scale"></Step>
        <Step transition="scale">  </Step>
        <Step transition="scale"></Step>
      </ProgressBar>
    );
  }
}