declare module "*.jpg";
declare module "*.png";
declare module "*.jpeg";
declare module "*.gif";

declare module "questionnaire-to-survey" {
    import { SurveyModel } from "survey-react";
    import { Questionnaire } from 'fhir/r4';

    export default function converter(arg0: any, arg1: any, arg2: any, arg3: any): (fhirJson: Questionnaire, evaluateExpression?: (expression: string[], context?: any) => void, styleTheme?: string) => SurveyModel;
}
