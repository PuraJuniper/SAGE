import React, { ElementType } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { simpleCardField } from "./cardEditor";
import { CardFormProps, CardFormState, cardLayout, textBoxProps } from "./cardForm";
import { FriendlyResourceFormElement, getFormElementListForResource } from "./nameHelpers";

export class MedicationRequestForm extends React.Component<CardFormProps, CardFormState> {
    textBoxFields: Map<string, textBoxProps>;
    dropdownFields: Map<string, string[]>;
    cardFieldLayout: cardLayout;
    friendlyFields: FriendlyResourceFormElement[];
    placeHolderElem: JSX.Element;

    constructor(props: CardFormProps) {
        super(props);
        this.placeHolderElem =
        <Form.Group key='placeholder-formGroup' as={Col} >
        </Form.Group>;
        this.friendlyFields = getFormElementListForResource(this.props.resourceType.FHIR);
        this.textBoxFields = new Map<string, textBoxProps>([
            ['title', {
                boxSize: 1,
                isReadOnly: false,
                isLink: false,
                caption: ""
            }],
            ['description', {
                boxSize: 3,
                isReadOnly: false,
                isLink: false,
                caption: ""
            }],
            ['relatedArtifact', {
                boxSize: 1,
                isReadOnly: true,
                isLink: false,
                caption: ""
            }],
            ['text', {
                boxSize: 4,
                isReadOnly: false,
                isLink: false,
                caption: "NOTE: For advanced timing instructions, leave basic dosage sentence blank."

            }]
        ]);

        this.dropdownFields = new Map<string, string[]>([
            ['status',
                ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown']],
            ['intent',
                ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']],
            ['productReference',
                ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']]
        ]);

        this.cardFieldLayout =
        {
            cardColumns: [
                ['placeholder', 'productReference'],
                ['title', 'placeholder'],
                ['description', 'placeholder'],
                ['status', 'placeholder'],
                ['intent', 'placeholder'],
                ['relatedArtifact', 'placeholder'],
                ['placeholder'],
                ['placeholder', 'text']
            ]
        };

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

    render() {
        return (
            [
                // this.cardHeader,
                ...this.cardFieldLayout.cardColumns.map((cr, i: number) => {
                    return (
                        <Row key={"row-" + i} className="mb-3">
                            {cr.map(field =>
                                [
                                    this.placeHolderElem,
                                    ...this.createTextBoxElementList(),
                                    ...this.friendlyFields
                                        .filter(ff => this.dropdownFields.has(ff.FHIR))
                                        .map(ff => {
                                            return this.createDropdownElement(ff.FHIR, ff.FRIENDLY, this.dropdownFields.get(ff.FHIR) ?? [])
                                        })
                                ].find(elem =>
                                    elem.key?.toString().startsWith(field + "-")))}
                        </Row>
                    )
                }),
            ]
        );
    }
}