
import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { ElementType } from "react";
import { Button, Col, Form, InputGroup } from 'react-bootstrap';
import State, { SageNodeInitializedFreezerNode } from '../state';
import { simpleCardField } from './cardEditor';
import { FriendlyResourceFormElement, FriendlyResourceListEntry } from './nameHelpers';


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
}
export interface CardFormState {
    step: number;
}

export interface CardFormProps {
    sageNode: SageNodeInitializedFreezerNode,
    fieldHandlers: any[][],
    resourceType: FriendlyResourceListEntry
}
export abstract class CardForm extends React.Component<CardFormProps, CardFormState>{
    sageState = State.get();
    cardHeader: JSX.Element;
    placeHolderElem: JSX.Element =
        <Form.Group key='placeholder-formGroup' as={Col} >
        </Form.Group>;

    saveButton: JSX.Element =
        <button key="butSave" className="navigate col-lg-2 col-md-3"
            type="submit">
            Save Card&nbsp;
            <FontAwesomeIcon key="butSaveIcon" icon={faCaretRight} />
        </button>;

    deleteCardButton: JSX.Element =
        <button key="butDel" type='button' className="navigate col-lg-2 col-md-3"
            onClick={() => {
                State.emit("remove_from_bundle", this.sageState.bundle.pos + 1);
                State.emit("remove_from_bundle", this.sageState.bundle.pos);
                this.sageState.set("ui", { status: "cards" });
                this.resetForm();
            }}>
            Cancel
        </button>;

    abstract cardFieldLayout: cardLayout;
    abstract textBoxFields: Map<string, textBoxProps>;
    abstract allElements: JSX.Element[]
    abstract friendlyFields: FriendlyResourceFormElement[]

    constructor(props: CardFormProps) {
        super(props);
        this.state = {
            step: 1
        };  
        this.cardHeader = function (): JSX.Element {
            const createCardName = (): JSX.Element => {
                return <h3 key="cardName" style={{ marginTop: "20px", marginBottom: "10px" }}><b>
                    {props.resourceType ? props.resourceType?.FRIENDLY ?? "Unknown Resource Type" : ""}
                </b></h3>;
            }
            return (createCardName());
        }();
    }

    leftNavButton = () => {
        return (
            <button type='button' className={"navigate-reverse col-lg-2 col-md-3"}
                onClick={() => this.setState({ step: this.state.step - 1 }) }>
                {<> <FontAwesomeIcon icon={faCaretLeft} /> {" Previous"} </>}
            </button>);
    }

    rightNavButton = () => {
        return (
            <button type='button' className={"navigate col-lg-2 col-md-3"}
                onClick={() => this.setState({ step: this.state.step + 1 }) }>
                {<> {"Next "} <FontAwesomeIcon icon={faCaretRight} /></>}
            </button>);
    }

    pageTitles = new Map([
        [1, "Page 1: Filling in the basics"],
        [2, "Page 2: Adding Conditions"],
        [3, "Page 3: Card Preview"]
    ])

    resetForm = () => {  this.setState({ step: 1 }) }

    render() {
            return (
                <div>
                    <div>{this.pageTitles.get(this.state.step)}</div>
                    {this.state.step == 1 ? this.allElements : null}
                    {this.state.step == 2 ? <></> : null}
                    {this.state.step == 3 ? <></> : null}
                    <div><>
                        {this.state.step > 2 ? this.leftNavButton() : null}
                        {this.state.step < 2 ? this.rightNavButton(): null}
                        {this.saveButton}
                        {this.deleteCardButton}
                    </></div>
                </div>
            );
        }

    createTextBoxElement(fieldKey: string, friendlyFieldName: string, textProps: textBoxProps): JSX.Element {
        const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, this.props.sageNode);
        function returnVal() {
            if (textProps.isLink) {
                return <Button key={fieldName + "-button"} variant="link" onClick={() => window.open(fieldContents)}>{fieldContents}</Button>;
            } else {
                return <Form.Control key={fieldName + "-formControl"}
                    {...{
                        ...(textProps.isReadOnly) && { readOnly: textProps.isReadOnly },
                        ...(textProps.boxSize) > 1 && { as: "textarea" as ElementType<any>, rows: textProps.boxSize },
                        ...{
                            type: "text",
                            defaultValue: fieldContents,
                            onChange: (e: { currentTarget: { value: any; }; }) => setField(e.currentTarget.value)
                        }
                    }} />;
            }
        }

        this.props.fieldHandlers.push([fieldName, fieldContents, setField, fieldSaveHandler]);

        return (
            <Form.Group key={fieldName + "-formGroup"} as={Col} controlId={fieldName}>
                <Form.Label key={fieldName + "-formLabel"}>{friendlyFieldName}</Form.Label>
                <Form.Text key={fieldName + "-formText"}>{textProps.caption}</Form.Text>
                <Col key={fieldName + "-col"} sm={10}>
                    {returnVal()}
                </Col>
            </Form.Group>
        );
    }

    createDropdownElement(fieldKey: string, fieldFriendlyName: string, fieldElements: string[]): JSX.Element {
        const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, this.props.sageNode);
        this.props.fieldHandlers.push([fieldName, fieldContents, setField, fieldSaveHandler]);
        return (
            <Form.Group key={fieldName + "-fromGroup"} as={Col} controlId={fieldKey}>
                <Form.Label key={fieldName + "-label"}>{fieldFriendlyName}</Form.Label>
                <Col key={fieldName + "-col"} sm={10}>
                    <InputGroup key={fieldName + "-inputGroup"} className="mb-3">
                        <Form.Control
                            key={fieldName + "formControl"}
                            as="select"
                            defaultValue={fieldContents}
                            onChange={(e) => setField(e.currentTarget.value)}
                        >
                            {fieldElements.map(sType => {
                                return <option key={fieldKey + "-" + sType} value={sType}>{sType}</option>;
                            })}
                        </Form.Control>
                    </InputGroup>
                </Col>
            </Form.Group>
        );
    }

    createTextBoxElementList(): JSX.Element[] {
        const defaultBoxProps: textBoxProps = { boxSize: 1, isReadOnly: false, isLink: false, caption: "" }
        return this.friendlyFields
            .filter(ff => this.textBoxFields.has(ff.FHIR))
            .map(ff => {
                return this.createTextBoxElement(ff.FHIR, ff.FRIENDLY,
                    this.textBoxFields.get(ff.FHIR) ?? defaultBoxProps)
            });
    }
}
