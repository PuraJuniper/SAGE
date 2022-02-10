import { Row } from "react-bootstrap";
import { SageNodeInitializedFreezerNode } from "../state";
import { CardForm, cardLayout, textBoxProps } from "./cardForm";
import { FriendlyResourceFormElement, FriendlyResourceListEntry, getFormElementListForResource } from "./nameHelpers";

export class MedicationRequestForm extends CardForm {
    friendlyFields: FriendlyResourceFormElement[];
    allElements: JSX.Element[];
    textBoxFields: Map<string, textBoxProps> = new Map<string, textBoxProps>([
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
    dropdownFields: Map<string, string[]> = new Map<string, string[]>([
        ['status',
            ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown']],
        ['intent',
            ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']],
        ['productReference',
            ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']]
    ]);

    cardFieldLayout: cardLayout =
        {
            cardColumns: [
                ['placeholder', 'productReference'],
                ['title', 'placeholder'],
                ['description', 'placeholder'],
                ['status', 'placeholder'],
                ['intent', 'placeholder'],
                ['relatedArtifact', 'placeholder'],
                ['placeholder'],
                ['placeholder','text']
            ]

        };

    constructor(state: any, sageNode: SageNodeInitializedFreezerNode, fieldList: any[][], resourceType: FriendlyResourceListEntry) {
        super(state, sageNode, fieldList, resourceType);
        this.friendlyFields = getFormElementListForResource(this.resourceType.FHIR);
        this.allElements = this.createAllElements();
    }

    createAllElements(): JSX.Element[] {
        const createDropdownElementList = (): JSX.Element[] => {
            return this.friendlyFields
                .filter(ff => this.dropdownFields.has(ff.FHIR))
                .map(ff => {
                    return this.createDropdownElement(ff.FHIR, ff.FRIENDLY, this.dropdownFields.get(ff.FHIR) ?? [])
                });
        }

        const allMedicationRequestFields = [
            this.placeHolderElem,
            ...this.createTextBoxElementList(),
            ...createDropdownElementList()
        ];

        const sortedFieldElems = this.cardFieldLayout.cardColumns.map((cr, i: number) => {
            return (
                <Row key={"row-" + i} className="mb-3">
                    {cr.map(field =>
                        allMedicationRequestFields.find(elem =>
                            elem.key?.toString().startsWith(field + "-")))}
                </Row>
            )
        })

        return (
            [
                this.cardHeader,
                ...sortedFieldElems,
            ]);
    }   
}