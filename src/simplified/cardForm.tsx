
import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ElementType } from 'react';
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

export abstract class CardForm {
    sageNode: SageNodeInitializedFreezerNode;
    fieldHandlers: any[][];
    state: any;
    resourceType: FriendlyResourceListEntry;
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
                State.emit("remove_from_bundle", this.state.bundle.pos + 1);
                State.emit("remove_from_bundle", this.state.bundle.pos);
                State.get().set("ui", { status: "cards" });
                this.resetForm();
            }}>
            Cancel
        </button>;

    abstract cardFieldLayout: cardLayout;
    abstract textBoxFields: Map<string, textBoxProps>;
    abstract allElements: JSX.Element[]
    abstract friendlyFields: FriendlyResourceFormElement[]

    constructor(state: any,  sageNode: SageNodeInitializedFreezerNode, fieldHandlers: any[][], resourceType: FriendlyResourceListEntry,) {
        this.state = state;
        this.resourceType = resourceType;
        this.sageNode = sageNode;
        this.fieldHandlers = fieldHandlers;
        this.cardHeader = function (): JSX.Element {
            const createCardName = (): JSX.Element => {
                return <h3 key="cardName" style={{ marginTop: "20px", marginBottom: "10px" }}><b>
                    {resourceType ? resourceType?.FRIENDLY ?? "Unknown Resource Type" : ""}
                </b></h3>;
            }
            return (createCardName());
        }();
    }


    insertNextButton = (step: number) => {
        return <button type='button' className="navigate col-lg-2 col-md-3"
            onClick={() => {
                this.nextStep(step);
            }}>
            Next&nbsp;
            <FontAwesomeIcon icon={faCaretRight} />
        </button>;
    }

    insertPreviousButton = (step: number) => {
        return <button type='button' className="navigate-reverse col-lg-2 col-md-3"
            onClick={() => {
                this.prevStep(step);
            }}>
            <FontAwesomeIcon icon={faCaretLeft} />
            &nbsp;Previous
        </button>;
    }

    prevStep = (step: number) => {
        if (step == 2) State.get().set('simplified', { step: 1, 'libraries': {} });
        if (step == 3) State.get().set('simplified', { step: 2, 'libraries': {} });
    }

    nextStep = (step: number) => {
        if (step == 1) State.get().set("simplified", { step: 2, 'libraries': {} });
        if (step == 2) State.get().set('simplified', { step: 3, 'libraries': {} });
    }

    resetForm = () => {
        State.get().set('simplified', { step: 1, 'libraries': {} });
    }

    InsertCardNav = (step: number) => {
        switch (step) {
            case 1: return (
                <>
                    {this.insertNextButton(step)}
                    {this.saveButton}
                    {this.deleteCardButton}
                </>
            );
            case 2: return (
                <>
                    {this.insertPreviousButton(step)}
                    {this.insertNextButton(step)}
                    {this.saveButton}
                    {this.deleteCardButton}
                </>
            );
            case 3: return (
                <>
                    {this.insertPreviousButton(step)}
                    {this.saveButton}
                    {this.deleteCardButton}
                </>
            );
        }
    }
    fillingInBasics = (step: number) => {
        return (
            <div>
                <div>Page 1: Filling in the basics</div>
                {this.allElements}
                <div>{this.InsertCardNav(step)}</div>
            </div>
        );
    }
    addingConditions = (step: number) => {
        return (
            <div>
                <div>Page 2: Adding Conditions</div>
                <div>{this.InsertCardNav(step)}</div>
            </div>
        );
    }
    cardPreview = (step: number) => {
        return (
            <div>
                <div>Page 3: Card Preview</div>
                <div>{this.InsertCardNav(step)}</div>
            </div>
        );
    }

    pageNavHandler = (step: number) => {
        switch (step) {
            case 1: return this.fillingInBasics(step);
            case 2: return this.addingConditions(step);
            case 3: return this.cardPreview(step);
            default: return this.fillingInBasics(step);
        }
    }

    createTextBoxElement(fieldKey: string, friendlyFieldName: string, textProps: textBoxProps): JSX.Element {
        const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, this.sageNode);
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

        this.fieldHandlers.push([fieldName, fieldContents, setField, fieldSaveHandler]);

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
        const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, this.sageNode);
        this.fieldHandlers.push([fieldName, fieldContents, setField, fieldSaveHandler]);
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
