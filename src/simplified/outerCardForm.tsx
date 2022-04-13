import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from "react";
import State, { SageNodeInitializedFreezerNode } from '../state';

import { ICardForm } from './cardEditor';
import { FriendlyResourceProps } from './nameHelpers';
import { Card, Modal } from "react-bootstrap";
import { Progress } from './topProgressBar';
import Sidebar from './sidebar';


export type cardRow = string[];
export type cardLayout = {
    cardColumns: cardRow[];
}
export enum ElemType {
    TextBox,
    Dropdown
}
export type textBoxProps = {
    boxSize: number;
    isReadOnly: boolean;
    isLink: boolean;
    caption: string;
    className?: string;
    hideFieldTitle?: boolean;
}
export type displayBoxProps = {
    className: string;
    displayFieldTitle: boolean;
}
export interface CardFormState {
    step: number;
    isOpen: boolean;
}

export type CardFormProps = {
    sageNode: SageNodeInitializedFreezerNode,
    fieldHandlers: any[][],
    resourceType: FriendlyResourceProps,
    elementList: JSX.Element[],
    displayList: JSX.Element[],
    conditionEditor: JSX.Element,
    innerCardForm: ICardForm,
    handleSaveResource: ()=> void,
    handleDeleteResource: () => void,
}
export class OuterCardForm extends React.Component<CardFormProps, CardFormState>{
    cardHeader: JSX.Element;
    saveButton: JSX.Element;
    deleteCardButton: JSX.Element;
    pageTitles: Map<number, string>;

    constructor(props: CardFormProps) {
        super(props);
        this.cardHeader =
            <h3 key="cardName" style={{ marginTop: "20px", marginBottom: "10px" }}><b>
                {this.props.resourceType ? this.props.resourceType?.FRIENDLY ?? "Unknown Resource Type" : ""}
            </b></h3>;
            
        this.saveButton =
            <button className="navigate col-lg-2 col-md-3"
                type="button"
                onClick={() => {
                    this.setState({ isOpen: true })
                }}>
                Save Card&nbsp;
                <FontAwesomeIcon key="butSaveIcon" icon={faCaretRight} />
            </button>;

        this.deleteCardButton =
            <button key="butDel" type='button' className="navigate col-lg-2 col-md-3"
                onClick={() => {
                    this.setState({ step: 1 });
                    this.props.handleDeleteResource();
                }}>
                Cancel
            </button>;

        this.state = {
            step: 1,
            isOpen: false
        };

        this.pageTitles = new Map([
            [1, "What does the card do?"],
            [2, "When is the card played?"],
            [3, "Review card"]
        ])

    }

    leftNavButton = () => {
        return (
            <button type='button' className={"navigate-reverse col-lg-2 col-md-3"}
                onClick={() => this.setState({ step: this.state.step - 1 })}>
                {<> <FontAwesomeIcon icon={faCaretLeft} /> {" Previous"} </>}
            </button>);
    }

    rightNavButton = () => {
        return (
            <button type='button' className={"navigate col-lg-2 col-md-3"}
                onClick={() => this.setState({ step: this.state.step + 1 })}>
                {<> {"Next "} <FontAwesomeIcon icon={faCaretRight} /></>}
            </button>);
    }

    render() {
        const PageOne = this.props.innerCardForm.pageOne; // Variable name case matters (https://reactjs.org/docs/jsx-in-depth.html#choosing-the-type-at-runtime)
        const PageTwo = this.props.innerCardForm.pageTwo;
        const PageThree = this.props.innerCardForm.pageThree;
        return (
            <div style={{display: "flex"}} >
                <Sidebar pageType='create card' pageTitle={this.pageTitles.get(this.state.step)}></Sidebar>
                <div style={{flexGrow: 1, margin: "50px"}}>

                <h3 id='page-title' className="col-lg-10 col-md-9">{this.pageTitles.get(this.state.step)}</h3>
                <Progress pageTitle={this.pageTitles.get(this.state.step)} fhirType='activity'></Progress>
                <div>{this.state.step == 1 ? <PageOne fieldElements={this.props.elementList} /> : null}</div>
                {this.state.step == 2 ? <PageTwo conditionEditor={this.props.conditionEditor} /> : null}
                {this.state.step == 3 ? <Card style={{ padding: "20px", margin: "10px", borderWidth: "2px", borderColor:'#2D2E74', borderRadius: '40px'}}>
                                        <Card.Title>{this.props.resourceType.FRIENDLY}</Card.Title>
                                        <Card.Body><PageThree displayElements={this.props.displayList}/></Card.Body>
                                        </Card> : null}
                <div><>
                    {this.state.step > 1 ? this.leftNavButton() : null}
                    {this.state.step <= 2 ? this.rightNavButton() : this.saveButton}
                    {this.deleteCardButton}
                </></div>
                </div>
                <Modal show={this.state.isOpen} size="sm">
                    <Modal.Header className="justify-content-md-center">
                        Save Card?
                    </Modal.Header>
                    <Modal.Body>
                        <button key="butSave" className="btn btn-secondary" type="button" onClick={()=> this.props.handleSaveResource()}>
                        Save Card
                        </button>
                        <button key="butSave" className="btn btn-tertiary" style={{float: "right"}} type="button" onClick={()=> this.setState({ isOpen: false })}>
                        Cancel
                        </button>
                    </Modal.Body>
                </Modal>;
            </div>
        );
    }
}