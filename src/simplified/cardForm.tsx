
import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ElementType } from 'react';
import { Button, Col, Form, InputGroup } from 'react-bootstrap';
import State, { SageNodeInitializedFreezerNode } from '../state';
import { simpleCardField } from './cardEditor';
import { FriendlyResourceFormElement, FriendlyResourceListEntry } from './nameHelpers';


export enum ElemType {
    TextBox,
    Dropdown
}

export type textBoxProps = {
    boxSize: number;
    isReadOnly: boolean;
    isLink: boolean;
}

export abstract class CardForm {
    sageNode: SageNodeInitializedFreezerNode;
    fieldHandlers: any[][];
    state: any;
    abstract resourceType: FriendlyResourceListEntry;
    abstract textBoxFields: Map<string, textBoxProps>;
    abstract createAllElements() : JSX.Element[]
    abstract friendlyFields: FriendlyResourceFormElement[]

    constructor(state: any, sageNode: SageNodeInitializedFreezerNode, fieldHandlers: any[][]) {
        this.state = state;
        this.sageNode = sageNode;
        this.fieldHandlers = fieldHandlers;
    }

    createCardHeader() {
        const createDeleteCardButton = (): JSX.Element => {
            return <button key="butDel" className="navigate-reverse col-lg-2 col-md-3"
                onClick={() => {
                    State.emit("remove_from_bundle", this.state.bundle.pos + 1);
                    State.emit("remove_from_bundle", this.state.bundle.pos);
                    State.get().set("ui", { status: "cards" });
                }}
            >
                <FontAwesomeIcon key="butDelIcon" icon={faCaretLeft} />
                &nbsp;Delete Card
            </button>;
        }
    
        const createSaveButton: JSX.Element = <button key="butSave" className="navigate col-lg-2 col-md-3"
            type="submit">
            Save Card&nbsp;
            <FontAwesomeIcon key="butSaveIcon" icon={faCaretRight} />
        </button>;
        
        const createCardName = (): JSX.Element => {
            return <h3 style={{ marginTop: "20px", marginBottom: "10px" }}><b>
                {this.resourceType ? this.resourceType?.FRIENDLY ?? "Unknown Resource Type" : ""}
            </b></h3>;
        }
        return (
            <>
                {createDeleteCardButton()}
                {createSaveButton}
                {createCardName()}
            </>
        );
    }

    createTextBoxElement(fieldKey: string, friendlyFieldName: string, textProps: textBoxProps): JSX.Element {
        const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, this.sageNode);
        function returnVal() {
            if (textProps.isLink) {
                return <Button variant="link" onClick={() => window.open(fieldContents)}>{fieldContents}</Button>;
            } else {
                return <Form.Control
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
            <Form.Group key={fieldName} as={Col} controlId={fieldName}>
                <Form.Label>{friendlyFieldName}</Form.Label>
                <Col key={fieldName} sm={10}>
                    {returnVal()}
                </Col>
            </Form.Group>
        );
    }

    createDropdownElement(fieldKey: string, fieldFriendlyName: string, fieldElements: string[]): JSX.Element {
        const [fieldName, fieldContents, setField, fieldSaveHandler] = simpleCardField(fieldKey, this.sageNode);
        this.fieldHandlers.push([fieldName, fieldContents, setField, fieldSaveHandler]);
        return (
            <Form.Group key={fieldName} as={Col} controlId={fieldKey}>
                <Form.Label>{fieldFriendlyName}</Form.Label>
                <Col key={fieldName} sm={10}>
                    <InputGroup className="mb-3">
                        <Form.Control
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
        const defaultBoxProps: textBoxProps  ={ boxSize:1, isReadOnly:false, isLink: false}
        return this.friendlyFields
            .filter(ff => this.textBoxFields.has(ff.FHIR))
            .map(ff => {
                return this.createTextBoxElement(ff.FHIR, ff.FRIENDLY,
                    this.textBoxFields.get(ff.FHIR) ?? defaultBoxProps)
            });
    }
}