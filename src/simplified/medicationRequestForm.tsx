import { SageNodeInitializedFreezerNode } from "../state";
import { CardForm, textBoxProps } from "./cardForm";
import { FriendlyResourceFormElement, FriendlyResourceListEntry, getFormElementListForResource } from "./nameHelpers";

export class MedicationRequestForm extends CardForm {
    resourceType: FriendlyResourceListEntry;
    friendlyFields: FriendlyResourceFormElement[];
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

    constructor(state: any, sageNode: SageNodeInitializedFreezerNode, fieldList: any[][], resourceType: FriendlyResourceListEntry) {
        super(state, sageNode, fieldList);
        this.resourceType = resourceType;
        this.friendlyFields = getFormElementListForResource(this.resourceType.FHIR);
    }


    createAllElements(): JSX.Element[] {
       const createDropdownElementList = (): JSX.Element[] => {
            return this.friendlyFields
                .filter(ff => this.dropdownFields.has(ff.FHIR))
                .map(ff => {
                    return this.createDropdownElement(ff.FHIR, ff.FRIENDLY, this.dropdownFields.get(ff.FHIR) ?? [])
                });
        }
    
        return (
            [
                ...this.createCardHeader(),
                ...this.createTextBoxElementList(),
                ...createDropdownElementList()
            ]);
    }
}