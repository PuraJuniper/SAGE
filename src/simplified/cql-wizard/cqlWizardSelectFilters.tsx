import React, { Dispatch, useEffect, useState } from "react";
import { BooleanFilter, CodeFilterType, CodingFilter, DateFilter, DateFilterType, PeriodFilter, PeriodDateFilterType, RelativeDateUnit, WizardAction, WizardState, PeriodDateType, PeriodDateFilter, FilterType, MultitypeFilter } from './wizardLogic';
import { ToggleButtonGroup, ToggleButton, Card, Form, Container, InputGroup, FormControl, DropdownButton, Dropdown } from 'react-bootstrap';
import { ElementFilter } from './wizardLogic';
import 'react-dates/initialize';
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';
// import { START_DATE, END_DATE } from 'react-dates/constants';
import 'react-dates/lib/css/_datepicker.css';
import './react-dates-overrides.css';
import moment, { Moment } from 'moment';
import Select, { ActionMeta, InputActionMeta, SingleValue } from "react-select";
import { CqlWizardSelectCodes } from "./cqlWizardSelectCodes";

interface CqlWizardSelectFiltersProps {
    wizDispatch: Dispatch<WizardAction>,
    wizState: WizardState,
}

// HTML <select> element only accepts strings or numbers as values
enum BooleanSelectOptions {
    Any = "any",
    True = "true",
    False = "false",
}

function cardTitleCapitalizing(ef: ElementFilter) {
    const elemSplit = ef.elementName.split(".").pop() ?? "";
    return ef.elementName.split(".").pop()?.charAt(0).toUpperCase().concat(elemSplit.slice(1));
}

// Dealing with HTML Form input
export function convertFormInputToNumber(input: string | undefined, lastValue?: number): number {
    return typeof(input) === 'undefined' ? (lastValue ?? 0) : (typeof(input) === 'string' ? (isNaN(parseInt(input, 10)) ? 0 : parseInt(input, 10)) : input)
}

export const CqlWizardSelectFilters = (props: CqlWizardSelectFiltersProps) => {
    /**
     * Helper for dispatching a "setFilters" event with a new element filters array
     * @param elementToReplace Name of the element being replaced
     * @param replaceFunc Function called to generate the replacement element
     */
    function dispatchNewFilters(elementToReplace: string, replaceFunc: (v: ElementFilter) => ElementFilter) {
        const newElementFilters = props.wizState.filters.map(v => v.elementName !== elementToReplace ? v : replaceFunc(v));
        props.wizDispatch(["setFilters", newElementFilters]);
    }

    function getFilterUI(elemFilter: ElementFilter, dispatchNewFilters: (elementToReplace: string, replaceFunc: (v: ElementFilter) => ElementFilter) => void) {
        switch (elemFilter.filter.type) {
            case FilterType.Coding: {
                return (
                    codingFilterUI(elemFilter, dispatchNewFilters)
                );
            }
            case FilterType.Date:
            case FilterType.Age: {
                return (
                    dateFilterUI(elemFilter, dispatchNewFilters)
                );
            }
            case FilterType.Boolean: {
                return (
                    booleanFilterUI(elemFilter, dispatchNewFilters)
                );
            }
            case FilterType.Period: {
                return (
                    periodFilterUI(elemFilter, dispatchNewFilters)
                );
            }
            case FilterType.Multitype: {
                return multitypeFilterUI(elemFilter as ElementFilter<MultitypeFilter>, dispatchNewFilters);
            }
            case FilterType.Unknown:
                return (
                    <div key={elemFilter.elementName}>
                        Unknown Filter {elemFilter.elementName}
                    </div>
                );

            default:
                return (
                    <div key={elemFilter.elementName}>
                        Unhandled {elemFilter.elementName}
                    </div>
                );
        }
    }

    function multitypeFilterUI(elementFilter: ElementFilter<MultitypeFilter>, dispatchNewFilters: (elementToReplace: string, replaceFunc: (v: ElementFilter) => ElementFilter) => void): JSX.Element {
        function dispatchNewMultitypeFilter(elementName: string, replaceFunc: (v: ElementFilter) => ElementFilter) {
            dispatchNewFilters(elementFilter.elementName, oldElementFilter => {
                const oldFilter = oldElementFilter.filter as MultitypeFilter;
                let error = false;
                return {
                    ...oldElementFilter,
                    filter: {
                        ...oldFilter,
                        possibleFilters: oldFilter.possibleFilters.map(v => {
                            if (v.elementName !== elementName) {
                                return v;
                            }
                            else {
                                const newV = replaceFunc(v);
                                error = newV.filter.error;
                                return newV;
                            }
                        }),
                        error: error
                    },
                }
            })
        }

        return (
            <Card key={elementFilter.elementName}>
                <Card.Body>
                    <Card.Title className="cql-wizard-element-filters-header">
                        {`${elementFilter.elementName[0].toUpperCase()}${elementFilter.elementName.slice(1)}`}

                        <ToggleButtonGroup
                            type="radio"
                            name={`${elementFilter.elementName}-filter-select`}
                            value={elementFilter.filter.selectedFilter}
                            onChange={newSelectedIdx => {
                                const selectedIdx = newSelectedIdx === -1 ? undefined : newSelectedIdx;
                                dispatchNewFilters(elementFilter.elementName, (v) => {
                                    const multitypeFilter = v.filter as MultitypeFilter;
                                    return { ...v, filter: { ...multitypeFilter, selectedFilter: selectedIdx, error: selectedIdx === undefined ? false : multitypeFilter.possibleFilters[selectedIdx].filter.error } }
                                });
                            }}
                        >
                            <ToggleButton key={`Any`} id={`Any-${elementFilter.elementName}`} variant="outline-secondary" value={-1}>Any Value</ToggleButton>
                            {elementFilter.filter.possibleFilters.flatMap((possibleFilter, i) =>
                                possibleFilter.filter.type === FilterType.Unknown ?
                                    [] :
                                    [<ToggleButton key={`${i}-${elementFilter.elementName}`} id={`${i}-${elementFilter.elementName}`} variant="outline-secondary" value={i}>{possibleFilter.filter.type}</ToggleButton>]
                            )}
                        </ToggleButtonGroup>
                    </Card.Title>
                </Card.Body>
                <div className={"m-2"}>
                    {elementFilter.filter.selectedFilter !== undefined ?
                        getFilterUI(elementFilter.filter.possibleFilters[elementFilter.filter.selectedFilter], dispatchNewMultitypeFilter) :
                        null}
                </div>
            </Card>
        )
    }

    function booleanFilterUI(elementFilter: ElementFilter, dispatchNewFilters: (elementToReplace: string, replaceFunc: (v: ElementFilter) => ElementFilter) => void): JSX.Element {
        function dispatchNewBooleanFilter(elementName: string, newBool: boolean | null) {
            dispatchNewFilters(elementName, v => {
                const oldFilter = v.filter as BooleanFilter;
                return {
                    ...v,
                    filter: {
                        ...oldFilter,
                        filteredBoolean: newBool,
                    }
                }
            });
        }

        const booleanFilter = elementFilter.filter as BooleanFilter
        return <div key={elementFilter.elementName}>
        <Card>
            <Card.Body>
                <Card.Title className="cql-wizard-element-filters-header">
                    {`${elementFilter.elementName[0].toUpperCase()}${elementFilter.elementName.slice(1)}`}
                    
                    <ToggleButtonGroup
                        type="radio"
                        name={`${elementFilter.elementName}-boolean`}
                        value={booleanFilter.filteredBoolean === null ? BooleanSelectOptions.Any : booleanFilter.filteredBoolean ? BooleanSelectOptions.True : BooleanSelectOptions.False}
                        onChange={newBoolOption => {
                            const newBool = newBoolOption === BooleanSelectOptions.Any ? null : newBoolOption === BooleanSelectOptions.True ? true : false;
                            dispatchNewBooleanFilter(elementFilter.elementName, newBool)
                        }}
                    >
                        <ToggleButton id={`${BooleanSelectOptions.Any}-${elementFilter.elementName}`} variant="outline-secondary" value={BooleanSelectOptions.Any}>Any</ToggleButton>
                        <ToggleButton id={`${BooleanSelectOptions.True}-${elementFilter.elementName}`} variant="outline-secondary" value={BooleanSelectOptions.True}>True</ToggleButton>
                        <ToggleButton id={`${BooleanSelectOptions.False}-${elementFilter.elementName}`} variant="outline-secondary" value={BooleanSelectOptions.False}>False</ToggleButton>
                    </ToggleButtonGroup>
                </Card.Title>
            </Card.Body>
        </Card>
    </div>
    }

    function periodFilterUI(elementFilter: ElementFilter, dispatchNewFilters: (elementToReplace: string, replaceFunc: (v: ElementFilter) => ElementFilter) => void): JSX.Element {
        const periodFilter = elementFilter.filter as PeriodFilter;
        return (
            <div key={elementFilter.elementName}>
                <PeriodFilterCard elementFilter={elementFilter} periodFilter={periodFilter} dispatchNewFilters={dispatchNewFilters} />
            </div>
        );
    }

    function dateFilterUI(elementFilter: ElementFilter, dispatchNewFilters: (elementToReplace: string, replaceFunc: (v: ElementFilter) => ElementFilter) => void): JSX.Element {
        const dateFilter = elementFilter.filter as DateFilter
        return (
            <div key={elementFilter.elementName}>
                <DateFilterCard elementFilter={elementFilter} dateFilter={dateFilter} dispatchNewFilters={dispatchNewFilters} />
            </div>
        );
    }

    function codingFilterUI(elementFilter: ElementFilter, dispatchNewFilters: (elementToReplace: string, replaceFunc: (v: ElementFilter) => ElementFilter) => void): JSX.Element {
        function dispatchNewCodingFilter(elementName: string, filterType: CodeFilterType, selectedIndexes: number[]) {
            dispatchNewFilters(elementName, v => {
                const oldFilter = v.filter as CodingFilter; // Ok to cast because this current function should only be called when editing CodingFilters
                return {
                    ...v,
                    filter: {
                        ...oldFilter,
                        filteredCoding: {
                            filterType,
                            selectedIndexes: selectedIndexes,
                        },
                        error: filterType === CodeFilterType.Filtered && selectedIndexes.length === 0,
                    }
                }
            });
        }

        const codeFilter = elementFilter.filter as CodingFilter;
        return <>
            {(() => {
                const codeBinding = codeFilter.codeBinding;
                if (!codeBinding) {
                    return (
                        <div key={`${elementFilter.elementName}-no-binding`}>No binding found for {elementFilter.elementName}</div>
                    );
                } else {
                    return (<div key={elementFilter.elementName}>
                        <Card>
                            <Card.Body>
                                <Card.Title className={`cql-wizard-element-filters-header-${elementFilter.elementName}`}>
                                    {cardTitleCapitalizing(elementFilter)}

                                    {/* Need to nest ToggleButton in ToggleButtonGroup to prevent a checkbox appearing inside the ToggleButton (bug in react-bootstrap?) */}
                                    <ToggleButtonGroup
                                        type="radio"
                                        name={`${elementFilter.elementName}-code-filter-type`}
                                        value={codeFilter.filteredCoding.filterType === CodeFilterType.None ? "Any" : "Specific"}
                                        onChange={selected => dispatchNewCodingFilter(elementFilter.elementName, selected === "Any" ? CodeFilterType.None : CodeFilterType.Filtered, codeFilter.filteredCoding.selectedIndexes)}
                                    >
                                        <ToggleButton id={`Any-${elementFilter.elementName}`} type="checkbox" variant="outline-secondary" value="Any">
                                            Any Value
                                        </ToggleButton>
                                        <ToggleButton id={`Specific-${elementFilter.elementName}`} type="checkbox" variant="outline-secondary" value="Specific">
                                            Specific Value
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Card.Title>
                                <Select<{ idx: number; }, true>
                                    options={codeBinding.codes.map((code, i) => {
                                        return { idx: i };
                                    })}
                                    isMulti={true}
                                    getOptionValue={codeIdx => `${codeIdx.idx}`}
                                    getOptionLabel={codeIdx => codeBinding.codes[codeIdx.idx].display ?? codeBinding.codes[codeIdx.idx].code}
                                    onChange={newValue => dispatchNewCodingFilter(elementFilter.elementName, CodeFilterType.Filtered, newValue.map(v => v.idx))}
                                    value={codeFilter.filteredCoding.selectedIndexes.map(v => {
                                        return { idx: v };
                                    })}
                                    styles={{ menu: provided => ({ ...provided, zIndex: 9999 }) }} // https://stackoverflow.com/a/55831990
                                    isSearchable={true}
                                    closeMenuOnSelect={false}
                                    isDisabled={codeFilter.filteredCoding.filterType === CodeFilterType.None} />
                                {/* <ToggleButtonGroup type="checkbox" value={codeFilter.filteredCoding.selectedIndexes} className="cql-wizard-element-filters-button-group"
        onChange={selectedIndexes => dispatchNewCodingFilter(elementFilter.elementName, CodeFilterType.Filtered, selectedIndexes)}
    >
        {codeBinding.codes.map((code, i) => {
            return <ToggleButton key={i} value={i} variant='outline-primary'
                className={codeFilter.filteredCoding.filterType === CodeFilterType.None ? "cql-wizard-element-filters-button-ignored" : undefined}
            >
                {code.display}
            </ToggleButton>
        })}
    </ToggleButtonGroup> */}
                            </Card.Body>
                        </Card>
                    </div>
                    );
                }
            })()}
        </>;
    }


    function containsSubResource(elemFilt: ElementFilter): boolean {
        return elemFilt.elementName.split(".").length > 1
    }
    function getParent(elemFilt: ElementFilter) {
        return elemFilt.elementName.split(".")[0]
    }
    function getChildren(parentString: string) {
        function childHasThisParent(parent: string, child: ElementFilter): boolean {
            return getParent(child) === parent;
        }
        return allParentsAndChildren.filter(child => childHasThisParent(parentString, child))
    }
    function onlyUnique(value: any, index: any, self: string | any[]) {
        return self.indexOf(value) === index;
    }

    const allParentsAndChildren = props.wizState.filters.filter(containsSubResource);
    const onlyParents = allParentsAndChildren.map(getParent).filter(onlyUnique)
    const noParents = props.wizState.filters.filter(filter => !allParentsAndChildren.includes(filter))
    return (
        <>
            <Card>
                <Card.Body>
                    <Card.Title>
                        Selected Codes
                    </Card.Title>
                    <CqlWizardSelectCodes wizState={props.wizState} wizDispatch={props.wizDispatch} />
                </Card.Body>
            </Card>
            
            <div className="cql-wizard-select-filters-grid mt-2">
                {noParents.map((elementFilter): JSX.Element => {
                    return getFilterUI(elementFilter, dispatchNewFilters);
                })}

                {onlyParents.map((parent): JSX.Element => {
                    return (
                        <Card key={parent}>
                            <Card.Body>
                                <Card.Title>
                                    {`${parent[0].toUpperCase()}${parent.slice(1)}`}
                                </Card.Title>
                                {getChildren(parent).map(child => getFilterUI(child, dispatchNewFilters))}
                            </Card.Body>
                        </Card>
                    );
                })}
                <div className="cql-wizard-filters-overscroll-excess" />
            </div>
        </>
    )
}

function checkDateFilterErrors(filter: DateFilter, filterType: DateFilterType): boolean {
    switch(filterType) {
        case DateFilterType.After:
        case DateFilterType.Before:
            return filter.filteredDate.absoluteDate1 === null;
        case DateFilterType.Between:
            return filter.filteredDate.absoluteDate1 === null || filter.filteredDate.absoluteDate2 === null || filter.filteredDate.absoluteDate2 <= filter.filteredDate.absoluteDate1;
        case DateFilterType.OlderThan:
        case DateFilterType.NewerThan:
            return filter.filteredDate.relativeAmount < 1 || filter.filteredDate.relativeUnit === undefined;
        case DateFilterType.None:
            return false;
    }
}

function getDateTypeFromFilterType(filter: DateFilterType): DateType {
    switch(filter) {
        case DateFilterType.After:
        case DateFilterType.Before:
        case DateFilterType.Between:
            return DateType.Absolute;
        case DateFilterType.NewerThan:
        case DateFilterType.OlderThan:
            return DateType.Relative;
        case DateFilterType.None:
            return DateType.None;
    }
}

enum DateType {
    Relative = "relative",
    Absolute = "absolute",
    None = "none",
}

interface DateFilterCardProps {
    elementFilter: ElementFilter,
    dateFilter: DateFilter,
    dispatchNewFilters: (elementToReplace: string, replaceFunc: (v: ElementFilter) => ElementFilter) => void,
}

const DateFilterCard: React.FC<DateFilterCardProps> = (props) => {
    // Mutable dates used by react-date components
    const [datePickerState, setDatePickerState] = useState<{ dateOne: Moment | null, focusDateOne: boolean, dateTwo: Moment | null, focusDateTwo: boolean }>(() => {
        return {
            dateOne: props.dateFilter.filteredDate.absoluteDate1?.clone() || null,
            focusDateOne: false,
            dateTwo: props.dateFilter.filteredDate.absoluteDate2?.clone() || null,
            focusDateTwo: false,
        }
    });

    /**
     * Reset mutable dates used by react-date components to match any upstream changes to the date
     */
    useEffect(() => {
        setDatePickerState({
            dateOne: props.dateFilter.filteredDate.absoluteDate1?.clone() || null,
            focusDateOne: false,
            dateTwo: props.dateFilter.filteredDate.absoluteDate2?.clone() || null,
            focusDateTwo: false,
        });
    }, [props.dateFilter])

    function dispatchNewDateFilter(elementName: string, newFilterType: DateFilterType, newDate1?: Moment | null, newDate2?: Moment | null, newRelativeUnit?: RelativeDateUnit, newRelativeAmountInput?: number) {
        props.dispatchNewFilters(elementName, v => {
            const oldFilter = v.filter as DateFilter;
            const newRelativeAmount = typeof(newRelativeAmountInput) === 'undefined' ? oldFilter.filteredDate.relativeAmount : newRelativeAmountInput;
            const newElementFilter: ElementFilter = {
                ...v,
                filter: {
                    ...oldFilter,
                    filteredDate: {
                        ...oldFilter.filteredDate,
                        filterType: newFilterType,
                        absoluteDate1: newDate1 === undefined ? oldFilter.filteredDate.absoluteDate1 : (newDate1?.clone() || null),
                        absoluteDate2: newDate2 === undefined ? oldFilter.filteredDate.absoluteDate2 : (newDate2?.clone() || null),
                        relativeUnit: newRelativeUnit ?? oldFilter.filteredDate.relativeUnit,
                        relativeAmount: newRelativeAmount,
                    }
                }
            }

            const newFilter = newElementFilter.filter as DateFilter;
            newFilter.error = checkDateFilterErrors(newFilter, newFilterType);

            return newElementFilter;
        });
    }

    const isAge = props.dateFilter.type === FilterType.Age;

    return (
        <Card>
            <Card.Body>
                <Card.Title className="cql-wizard-element-filters-header">
                    {cardTitleCapitalizing(props.elementFilter)}
                    
                    <ToggleButtonGroup
                        type="radio"
                        name={`${props.elementFilter.elementName}-date-type`}
                        value={getDateTypeFromFilterType(props.dateFilter.filteredDate.filterType)}
                        onChange={newDateType => {
                            const newFilterType = newDateType === DateType.None ? DateFilterType.None : newDateType === DateType.Relative ? DateFilterType.OlderThan : DateFilterType.Before;
                            dispatchNewDateFilter(props.elementFilter.elementName, newFilterType)
                        }}
                    >
                        <ToggleButton id={`${DateType.None}-${props.elementFilter.elementName}`} variant="outline-secondary" value={DateType.None}>{isAge ? "Any" : "Any Date"}</ToggleButton>
                        <ToggleButton id={`${DateType.Relative}-${props.elementFilter.elementName}`} variant="outline-secondary" value={DateType.Relative}>{isAge ? "Age" : "Relative"}</ToggleButton>
                        <ToggleButton id={`${DateType.Absolute}-${props.elementFilter.elementName}`} variant="outline-secondary" value={DateType.Absolute}>{isAge ? "Date" : "Absolute"}</ToggleButton>
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        type="radio"
                        name={`${props.elementFilter.elementName}-date-filter-type`}
                        value={props.dateFilter.filteredDate.filterType}
                        onChange={newFilterType => dispatchNewDateFilter(props.elementFilter.elementName, newFilterType)}
                    >
                        {(() => {
                            switch(getDateTypeFromFilterType(props.dateFilter.filteredDate.filterType)) {
                                case DateType.Absolute:
                                    return [
                                        <ToggleButton id={`${DateFilterType.Before}-${props.elementFilter.elementName}`} key={DateFilterType.Before} variant="outline-secondary" value={DateFilterType.Before}>Before</ToggleButton>,
                                        <ToggleButton id={`${DateFilterType.After}-${props.elementFilter.elementName}`} key={DateFilterType.After} variant="outline-secondary" value={DateFilterType.After}>After</ToggleButton>,
                                        <ToggleButton id={`${DateFilterType.Between}-${props.elementFilter.elementName}`} key={DateFilterType.Between} variant="outline-secondary" value={DateFilterType.Between}>Between</ToggleButton>
                                    ];
                                case DateType.Relative: 
                                    return [
                                        <ToggleButton id={`${DateFilterType.OlderThan}-${props.elementFilter.elementName}`} key={DateFilterType.OlderThan} variant="outline-secondary" value={DateFilterType.OlderThan}>Older than</ToggleButton>,
                                        <ToggleButton id={`${DateFilterType.NewerThan}-${props.elementFilter.elementName}`}  key={DateFilterType.NewerThan} variant="outline-secondary" value={DateFilterType.NewerThan}>{isAge ? "Younger Than" : "Within last"}</ToggleButton>
                                    ];
                                case DateType.None:
                                    return undefined;
                            }
                        })()}
                    </ToggleButtonGroup>
                </Card.Title>
                {(() => {
                    switch(props.dateFilter.filteredDate.filterType) {
                        case DateFilterType.Before:
                        case DateFilterType.After:
                            return (
                                <SingleDatePicker
                                    openDirection="down"
                                    numberOfMonths={1}
                                    showClearDate
                                    reopenPickerOnClearDate
                                    onClose={({date}) => dispatchNewDateFilter(props.elementFilter.elementName, props.dateFilter.filteredDate.filterType, date)}
                                    isOutsideRange={() => false}
                                    id={`${props.elementFilter.elementName}-date-1`}
                                    date={datePickerState.dateOne}
                                    onDateChange={date => setDatePickerState((oldState) => {
                                        return {
                                            ...oldState,
                                            dateOne: date,
                                        }
                                    })}
                                    focused={datePickerState.focusDateOne}
                                    onFocusChange={({ focused }) => setDatePickerState((oldState) => {
                                        return {
                                            ...oldState,
                                            focusDateOne: focused,
                                        };
                                    })}
                                />
                            );
                        case DateFilterType.Between:
                            return (
                                <DateRangePicker
                                    openDirection="down"
                                    showClearDates
                                    reopenPickerOnClearDates
                                    onClose={({startDate, endDate}) => dispatchNewDateFilter(props.elementFilter.elementName, props.dateFilter.filteredDate.filterType, startDate, endDate)}
                                    isOutsideRange={() => false}
                                    startDate={datePickerState.dateOne}
                                    startDateId={`${props.elementFilter.elementName}-date-between-start`}
                                    endDate={datePickerState.dateTwo}
                                    endDateId={`${props.elementFilter.elementName}-date-between-end`}
                                    onDatesChange={({ startDate, endDate }) => setDatePickerState((oldState) => {
                                        return {
                                            ...oldState,
                                            dateOne: startDate,
                                            dateTwo: endDate,
                                        };
                                    })}
                                    focusedInput={datePickerState.focusDateOne ? 'startDate' : datePickerState.focusDateTwo ? 'endDate' : null}
                                    onFocusChange={focusedInput => setDatePickerState((oldState) => {
                                        return {
                                            ...oldState,
                                            focusDateOne: focusedInput === 'startDate',
                                            focusDateTwo: focusedInput === 'endDate',
                                        };
                                    })}
                                />
                            );
                        case DateFilterType.NewerThan:
                        case DateFilterType.OlderThan:
                            return (
                                <div className="cql-wizard-element-filters-relative-date-controls">
                                    <Form.Control
                                        placeholder="Amount of time"
                                        type="number"
                                        defaultValue={props.dateFilter.filteredDate.relativeAmount}
                                        min={0}
                                        onChange={e => 
                                            dispatchNewDateFilter(
                                                props.elementFilter.elementName, props.dateFilter.filteredDate.filterType, undefined, undefined, 
                                                props.dateFilter.filteredDate.relativeUnit, convertFormInputToNumber(e.target.value, props.dateFilter.filteredDate.relativeAmount))
                                            }
                                    />
                                    <ToggleButtonGroup
                                        type="radio"
                                        name={`${props.elementFilter.elementName}-date-relative-unit`}
                                        value={props.dateFilter.filteredDate.relativeUnit}
                                        onChange={newUnit => dispatchNewDateFilter(props.elementFilter.elementName, props.dateFilter.filteredDate.filterType, undefined, undefined, newUnit, props.dateFilter.filteredDate.relativeAmount)}
                                    >
                                        {props.dateFilter.type === "date" ?
                                            [
                                                <ToggleButton id={`${RelativeDateUnit.Minutes}-${props.elementFilter.elementName}`}  key="mins" variant="outline-primary" value={RelativeDateUnit.Minutes}>Minute(s)</ToggleButton>,
                                                <ToggleButton id={`${RelativeDateUnit.Hours}-${props.elementFilter.elementName}`} key="hours" variant="outline-primary" value={RelativeDateUnit.Hours}>Hour(s)</ToggleButton>,
                                                <ToggleButton id={`${RelativeDateUnit.Days}-${props.elementFilter.elementName}`} key="days" variant="outline-primary" value={RelativeDateUnit.Days}>Day(s)</ToggleButton>,
                                            ] :
                                            null
                                        }
                                        <ToggleButton id={`${RelativeDateUnit.Weeks}-${props.elementFilter.elementName}`} variant="outline-primary" value={RelativeDateUnit.Weeks}>Week(s)</ToggleButton>
                                        <ToggleButton id={`${RelativeDateUnit.Months}-${props.elementFilter.elementName}`} variant="outline-primary" value={RelativeDateUnit.Months}>Month(s)</ToggleButton>
                                        <ToggleButton id={`${RelativeDateUnit.Years}-${props.elementFilter.elementName}`} variant="outline-primary" value={RelativeDateUnit.Years}>Year(s)</ToggleButton>
                                    </ToggleButtonGroup>
                                </div>
                            )
                    }
                })()}
            </Card.Body>
        </Card>
    )
}

function checkPeriodFilterErrors(filter: PeriodDateFilter<PeriodDateType>): boolean {
    if (filter.endDateType !== PeriodDateFilterType.None && filter.startDateType !== PeriodDateFilterType.None) {
        // Check that the range is valid (startDate < endDate)
        if (filter.dateType === PeriodDateType.Absolute) {
            return filter.endDate !== null && filter.startDate !== null && filter.endDate <= filter.startDate;
        }
        else {
            return false; // Todo: figure out how to compare this
        }
    }
    return false;
}

enum PeriodDatePart {
    Start = "start",
    End = "end",
}
interface PeriodFilterCardProps {
    elementFilter: ElementFilter,
    periodFilter: PeriodFilter,
    dispatchNewFilters: (elementToReplace: string, replaceFunc: (v: ElementFilter) => ElementFilter) => void,
}

const PeriodFilterCard: React.FC<PeriodFilterCardProps> = (props) => {
    // Mutable dates used by react-date components
    const [datePickerState, setDatePickerState] = useState<{ dateOne: Moment | null, focusDateOne: boolean, dateTwo: Moment | null, focusDateTwo: boolean }>(() => {
        return {
            dateOne: null,
            focusDateOne: false,
            dateTwo: null,
            focusDateTwo: false,
        }
    });

    /**
     * Reset mutable dates used by react-date components to match any upstream changes to the date
     */
    useEffect(() => {
        if (props.periodFilter.filteredDate.dateType === PeriodDateType.Absolute) {
            setDatePickerState({
                dateOne: props.periodFilter.filteredDate.startDate?.clone() || null,
                focusDateOne: false,
                dateTwo: props.periodFilter.filteredDate.endDate?.clone() || null,
                focusDateTwo: false,
            });
        }
        else {
            setDatePickerState({
                dateOne: null,
                focusDateOne: false,
                dateTwo: null,
                focusDateTwo: false,
            });
        }
    }, [props.periodFilter])

    function dispatchNewPeriodFilter(elementName: string, newPeriodFilter: PeriodDateFilter<PeriodDateType>) {
        props.dispatchNewFilters(elementName, v => {
            const newFilter: PeriodFilter = {
                ...v.filter as PeriodFilter,
                filteredDate: newPeriodFilter,
                error: checkPeriodFilterErrors(newPeriodFilter),
            }

            const newElementFilter: ElementFilter = {
                ...v,
                filter: newFilter,
            }

            return newElementFilter;
        });
    }

    return (
        <Card>
            <Card.Body>
                <Card.Title className="cql-wizard-element-filters-header">
                    {cardTitleCapitalizing(props.elementFilter)}
                    
                    <ToggleButtonGroup
                        type="radio"
                        name={`${props.elementFilter.elementName}-date-type`}
                        value={props.periodFilter.filteredDate.dateType}
                        onChange={newDateType => {
                            if (newDateType === props.periodFilter.filteredDate.dateType) {
                                return;
                            }
                            dispatchNewPeriodFilter(props.elementFilter.elementName, {
                                ...props.periodFilter.filteredDate,
                                startDate: null,
                                endDate: null,
                                dateType: newDateType,
                            })
                        }}
                    >
                        <ToggleButton id={`${PeriodDateType.Relative}-${props.elementFilter.elementName}`} variant="outline-secondary" value={PeriodDateType.Relative}>Relative</ToggleButton>
                        <ToggleButton id={`${PeriodDateType.Absolute}-${props.elementFilter.elementName}`} variant="outline-secondary" value={PeriodDateType.Absolute}>Absolute</ToggleButton>
                    </ToggleButtonGroup>
                </Card.Title>
                {[PeriodDatePart.Start, PeriodDatePart.End].map(v => {
                    const filteredDate = props.periodFilter.filteredDate;
                    const displayText = v === PeriodDatePart.Start ? "Starts": "Ends";
                    const dateTypeKey: keyof typeof filteredDate = v === PeriodDatePart.Start ? "startDateType" : "endDateType";
                    const dateKey: keyof typeof filteredDate = v === PeriodDatePart.Start ? "startDate" : "endDate";
                    const dateStateKey: keyof typeof datePickerState = v === PeriodDatePart.Start ? "dateOne" : "dateTwo";
                    const dateStateFocusKey: keyof typeof datePickerState = v === PeriodDatePart.Start ? "focusDateOne" : "focusDateTwo";
                    return (
                        <Card key={v} body>
                            <InputGroup className="mb-3">
                                    <InputGroup.Text id="basic-addon1">{displayText}</InputGroup.Text>
                                <ToggleButtonGroup
                                    type="radio"
                                    name={`${props.elementFilter.elementName}-${v}-date-type`}
                                    value={filteredDate[dateTypeKey]}
                                    onChange={newDateType => {
                                        dispatchNewPeriodFilter(props.elementFilter.elementName, {
                                            ...filteredDate,
                                            [dateTypeKey]: newDateType,
                                        })
                                    }}
                                >
                                    <ToggleButton id={`${PeriodDateFilterType.None}-${props.elementFilter.elementName}`} variant="outline-secondary" value={PeriodDateFilterType.None}>At Any Time</ToggleButton>
                                    <ToggleButton id={`${PeriodDateFilterType.Before}-${props.elementFilter.elementName}`} variant="outline-secondary" value={PeriodDateFilterType.Before}>Before</ToggleButton>
                                    <ToggleButton id={`${PeriodDateFilterType.After}-${props.elementFilter.elementName}`} variant="outline-secondary" value={PeriodDateFilterType.After}>After</ToggleButton>
                                </ToggleButtonGroup>
                            </InputGroup>
                            {filteredDate.dateType === PeriodDateType.Relative ?
                                <div className="cql-wizard-element-filters-relative-date-controls">
                                    <Form.Control
                                        placeholder="Amount of time"
                                        type="number"
                                        defaultValue={filteredDate[dateKey]?.amount ?? 0}
                                        min={0}
                                        disabled={filteredDate[dateTypeKey] === PeriodDateFilterType.None}
                                        onChange={e => 
                                            dispatchNewPeriodFilter(props.elementFilter.elementName, {
                                                ...filteredDate,
                                                [dateKey]: {
                                                    ...filteredDate[dateKey],
                                                    amount: convertFormInputToNumber(e.target.value, filteredDate[dateKey]?.amount)
                                                },
                                            } as PeriodDateFilter<PeriodDateType.Relative>)
                                        }
                                    />
                                    <ToggleButtonGroup
                                        type="radio"
                                        name={`${props.elementFilter.elementName}-date-relative-unit`}
                                        value={filteredDate[dateKey]?.unit}
                                        onChange={newUnit => 
                                            dispatchNewPeriodFilter(props.elementFilter.elementName, {
                                                ...filteredDate,
                                                [dateKey]: {
                                                    ...filteredDate[dateKey],
                                                    unit: newUnit
                                                }
                                            } as PeriodDateFilter<PeriodDateType.Relative>)
                                        }
                                    >
                                        <ToggleButton id={`${RelativeDateUnit.Minutes}-${props.elementFilter.elementName}`} key="mins" variant="outline-primary" value={RelativeDateUnit.Minutes}>Minute(s)</ToggleButton>
                                        <ToggleButton id={`${RelativeDateUnit.Hours}-${props.elementFilter.elementName}`} key="hours" variant="outline-primary" value={RelativeDateUnit.Hours}>Hour(s)</ToggleButton>
                                        <ToggleButton id={`${RelativeDateUnit.Days}-${props.elementFilter.elementName}`} key="days" variant="outline-primary" value={RelativeDateUnit.Days}>Day(s)</ToggleButton>
                                        <ToggleButton id={`${RelativeDateUnit.Weeks}-${props.elementFilter.elementName}`} variant="outline-primary" value={RelativeDateUnit.Weeks}>Week(s)</ToggleButton>
                                        <ToggleButton id={`${RelativeDateUnit.Months}-${props.elementFilter.elementName}`} variant="outline-primary" value={RelativeDateUnit.Months}>Month(s)</ToggleButton>
                                        <ToggleButton id={`${RelativeDateUnit.Years}-${props.elementFilter.elementName}`} variant="outline-primary" value={RelativeDateUnit.Years}>Year(s)</ToggleButton>
                                    </ToggleButtonGroup>
                                </div> :
                                <SingleDatePicker
                                    openDirection="down"
                                    numberOfMonths={1}
                                    showClearDate
                                    reopenPickerOnClearDate
                                    disabled={filteredDate[dateTypeKey] === PeriodDateFilterType.None}
                                    onClose={({date}) => dispatchNewPeriodFilter(
                                        props.elementFilter.elementName, {
                                            ...filteredDate,
                                            [dateKey]: date
                                        } as PeriodDateFilter<PeriodDateType.Absolute>)
                                    }
                                    isOutsideRange={() => false}
                                    id={`${props.elementFilter.elementName}-date-${v}`}
                                    date={datePickerState[dateStateKey]}
                                    onDateChange={date => setDatePickerState((oldState) => {
                                        return {
                                            ...oldState,
                                            [dateStateKey]: date,
                                        }
                                    })}
                                    focused={datePickerState[dateStateFocusKey]}
                                    onFocusChange={({ focused }) => setDatePickerState((oldState) => {
                                        return {
                                            ...oldState,
                                            [dateStateFocusKey]: focused,
                                        };
                                    })}
                                />
                            }
                        </Card>
                    );
                })}
                
            </Card.Body>
        </Card>
    )
}