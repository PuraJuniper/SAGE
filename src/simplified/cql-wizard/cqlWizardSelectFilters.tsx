import React, { Dispatch, useEffect, useState } from "react";
import { BooleanFilter, CodeFilterType, CodingFilter, DateFilter, DateFilterType, RelativeDateUnit, WizardAction, WizardState } from './wizardLogic';
import { ToggleButtonGroup, ToggleButton, Card, Form, Container, InputGroup, FormControl, DropdownButton, Dropdown } from 'react-bootstrap';
import { ElementFilter } from './wizardLogic';
import 'react-dates/initialize';
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import moment, { Moment } from 'moment';
import Select, { ActionMeta, InputActionMeta, SingleValue } from "react-select";

interface CqlWizardSelectFiltersProps {
    wizDispatch: Dispatch<WizardAction>,
    wizState: WizardState,
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

interface DatePickerStates {
    [elementName: string]: { dateOne: Moment | null, focusDateOne: boolean, dateTwo: Moment | null, focusDateTwo: boolean }
}

// HTML <select> element only accepts strings or numbers as values
enum BooleanSelectOptions {
    Any = "any",
    True = "true",
    False = "false",
}

function initDatePickerStates(filters: ElementFilter[]): DatePickerStates {
    const newDatePickerStates: DatePickerStates = {};
    filters.forEach(v => {
        if (v.filter.type === "date" || v.filter.type === "age") {
            newDatePickerStates[v.elementName] = {
                dateOne: v.filter.filteredDate.absoluteDate1?.clone() || null,
                focusDateOne: false,
                dateTwo: v.filter.filteredDate.absoluteDate2?.clone() || null,
                focusDateTwo: false,
            }
        }
    });
    return newDatePickerStates;
}

// Dealing with HTML Form input
export function convertFormInputToNumber(input: string | undefined, lastValue: number): number {
    return typeof(input) === 'undefined' ? lastValue : (typeof(input) === 'string' ? (isNaN(parseInt(input, 10)) ? 0 : parseInt(input, 10)) : input)
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

export const CqlWizardSelectFilters = (props: CqlWizardSelectFiltersProps) => {
    const [datePickerStates, setDatePickerStates] = useState<DatePickerStates>(() => initDatePickerStates(props.wizState.filters));

    useEffect(() => {
        setDatePickerStates(initDatePickerStates(props.wizState.filters));
    }, [props.wizState.filters])

    /**
     * Helper for dispatching a "setFilters" event with a new element filters array
     * @param elementToReplace Name of the element being replaced
     * @param replaceFunc Function called to generate the replacement element
     */
    function dispatchNewFilters(elementToReplace: string, replaceFunc: (v: ElementFilter) => ElementFilter) {
        const newElementFilters: ElementFilter[] = props.wizState.filters.map<ElementFilter>(v => {
            return v.elementName !== elementToReplace ? v : replaceFunc(v)
        });
        props.wizDispatch(["setFilters", newElementFilters]);
    }

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

    function dispatchNewDateFilter(elementName: string, newFilterType: DateFilterType, newDate1?: Moment | null, newDate2?: Moment | null, newRelativeUnit?: RelativeDateUnit, newRelativeAmountInput?: number) {
        dispatchNewFilters(elementName, v => {
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

    function getFilterUI(elemFilter: ElementFilter) {
        switch (elemFilter.filter.type) {
            case "coding": {
                return (
                    codingFilterUI(elemFilter)
                );
            }
            case "date": {
                return (
                    dateFilterUI(elemFilter)
                );
            }
            case "age": {
                return (
                    ageFilterUI(elemFilter)
                );
            }
            case "boolean": {
                return (
                    booleanFilterUI(elemFilter)
                );
            }
            case "unknown":
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

    function booleanFilterUI(elementFilter: ElementFilter): JSX.Element {
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
                                dispatchNewBooleanFilter(elementFilter.elementName, newBool);
                            }}
                        >
                            <ToggleButton variant="outline-secondary" value={BooleanSelectOptions.Any}>Any</ToggleButton>
                            <ToggleButton variant="outline-secondary" value={BooleanSelectOptions.True}>True</ToggleButton>
                            <ToggleButton variant="outline-secondary" value={BooleanSelectOptions.False}>False</ToggleButton>
                        </ToggleButtonGroup>
                    </Card.Title>
                </Card.Body>
            </Card>
        </div>;
    }

    function ageFilterUI(elementFilter: ElementFilter): JSX.Element {
        const ageFilter = elementFilter.filter as DateFilter
        return <div key={elementFilter.elementName}>
            <Card>
                <Card.Body>
                    <Card.Title className="cql-wizard-element-filters-header">
                        {`${elementFilter.elementName[0].toUpperCase()}${elementFilter.elementName.slice(1)}`}
                        <ToggleButtonGroup
                            type="radio"
                            name={`${elementFilter.elementName}-age-type`}
                            value={getDateTypeFromFilterType(ageFilter.filteredDate.filterType)}
                            onChange={newDateType => {
                                const newFilterType = newDateType === DateType.None ? DateFilterType.None : newDateType === DateType.Relative ? DateFilterType.OlderThan : DateFilterType.Before;
                                dispatchNewDateFilter(elementFilter.elementName, newFilterType);
                            }}
                        >
                            <ToggleButton variant="outline-secondary" value={DateType.None}>Any</ToggleButton>
                            <ToggleButton variant="outline-secondary" value={DateType.Absolute}>Date</ToggleButton>
                            <ToggleButton variant="outline-secondary" value={DateType.Relative}>Age</ToggleButton>
                        </ToggleButtonGroup>
                        <ToggleButtonGroup
                            type="radio"
                            name={`${elementFilter.elementName}-age-filter-type`}
                            value={ageFilter.filteredDate.filterType}
                            onChange={newFilterType => dispatchNewDateFilter(elementFilter.elementName, newFilterType)}
                        >
                            {(() => {
                                switch (getDateTypeFromFilterType(ageFilter.filteredDate.filterType)) {
                                    case DateType.Absolute:
                                        return [
                                            <ToggleButton key={DateFilterType.Before} variant="outline-secondary" value={DateFilterType.Before}>Before</ToggleButton>,
                                            <ToggleButton key={DateFilterType.After} variant="outline-secondary" value={DateFilterType.After}>After</ToggleButton>,
                                            <ToggleButton key={DateFilterType.Between} variant="outline-secondary" value={DateFilterType.Between}>Between</ToggleButton>
                                        ];
                                    case DateType.Relative:
                                        return [
                                            <ToggleButton key={DateFilterType.OlderThan} variant="outline-secondary" value={DateFilterType.OlderThan}>Older than</ToggleButton>,
                                            <ToggleButton key={DateFilterType.NewerThan} variant="outline-secondary" value={DateFilterType.NewerThan}>Younger than</ToggleButton>
                                        ];
                                    case DateType.None:
                                        return undefined;
                                }
                            })()}
                        </ToggleButtonGroup>
                    </Card.Title>

                    {(() => {
                        switch (ageFilter.filteredDate.filterType) {
                            case DateFilterType.Before:
                            case DateFilterType.After:
                                return (
                                    <SingleDatePicker
                                        openDirection="down"
                                        numberOfMonths={1}
                                        showClearDate
                                        reopenPickerOnClearDate
                                        onClose={({ date }) => dispatchNewDateFilter(elementFilter.elementName, ageFilter.filteredDate.filterType, date)}
                                        isOutsideRange={() => false}
                                        id={`${elementFilter.elementName}-date-1`}
                                        date={datePickerStates[elementFilter.elementName].dateOne}
                                        onDateChange={date => setDatePickerStates((oldState) => {
                                            return {
                                                ...oldState,
                                                [elementFilter.elementName]: {
                                                    ...oldState[elementFilter.elementName],
                                                    dateOne: date,
                                                }
                                            };
                                        })}
                                        focused={datePickerStates[elementFilter.elementName].focusDateOne}
                                        onFocusChange={({ focused }) => setDatePickerStates((oldState) => {
                                            return {
                                                ...oldState,
                                                [elementFilter.elementName]: {
                                                    ...oldState[elementFilter.elementName],
                                                    focusDateOne: focused,
                                                }
                                            };
                                        })} />
                                );
                            case DateFilterType.Between:
                                return (
                                    <DateRangePicker
                                        openDirection="down"
                                        showClearDates
                                        reopenPickerOnClearDates
                                        onClose={({ startDate, endDate }) => dispatchNewDateFilter(elementFilter.elementName, ageFilter.filteredDate.filterType, startDate, endDate)}
                                        isOutsideRange={() => false}
                                        startDate={datePickerStates[elementFilter.elementName].dateOne}
                                        startDateId={`${elementFilter.elementName}-date-between-start`}
                                        endDate={datePickerStates[elementFilter.elementName].dateTwo}
                                        endDateId={`${elementFilter.elementName}-date-between-end`}
                                        onDatesChange={({ startDate, endDate }) => setDatePickerStates((oldState) => {
                                            return {
                                                ...oldState,
                                                [elementFilter.elementName]: {
                                                    ...oldState[elementFilter.elementName],
                                                    dateOne: startDate,
                                                    dateTwo: endDate,
                                                }
                                            };
                                        })}
                                        focusedInput={datePickerStates[elementFilter.elementName].focusDateOne ? 'startDate' : datePickerStates[elementFilter.elementName].focusDateTwo ? 'endDate' : null}
                                        onFocusChange={focusedInput => setDatePickerStates((oldState) => {
                                            return {
                                                ...oldState,
                                                [elementFilter.elementName]: {
                                                    ...oldState[elementFilter.elementName],
                                                    focusDateOne: focusedInput === 'startDate',
                                                    focusDateTwo: focusedInput === 'endDate',
                                                }
                                            };
                                        })} />
                                );
                            case DateFilterType.NewerThan:
                            case DateFilterType.OlderThan:
                                return (
                                    <div className="cql-wizard-element-filters-relative-date-controls">
                                        <Form.Control
                                            placeholder="Amount of time"
                                            type="number"
                                            defaultValue={ageFilter.filteredDate.relativeAmount}
                                            min={0}
                                            onChange={e => dispatchNewDateFilter(
                                                elementFilter.elementName, ageFilter.filteredDate.filterType, undefined, undefined,
                                                ageFilter.filteredDate.relativeUnit, convertFormInputToNumber(e.target.value, ageFilter.filteredDate.relativeAmount))} />
                                        <ToggleButtonGroup
                                            type="radio"
                                            name={`${elementFilter.elementName}-date-relative-unit`}
                                            value={ageFilter.filteredDate.relativeUnit}
                                            onChange={newUnit => dispatchNewDateFilter(elementFilter.elementName, ageFilter.filteredDate.filterType, undefined, undefined, newUnit, ageFilter.filteredDate.relativeAmount)}
                                        >
                                            <ToggleButton variant="outline-primary" value={RelativeDateUnit.Weeks}>Week(s)</ToggleButton>
                                            <ToggleButton variant="outline-primary" value={RelativeDateUnit.Months}>Month(s)</ToggleButton>
                                            <ToggleButton variant="outline-primary" value={RelativeDateUnit.Years}>Year(s)</ToggleButton>
                                        </ToggleButtonGroup>
                                    </div>
                                );
                        }
                    })()}
                </Card.Body>
            </Card>
        </div>;
    }

    function dateFilterUI(elementFilter: ElementFilter): JSX.Element {
        const dateFilter = elementFilter.filter as DateFilter
        return <div key={elementFilter.elementName}>
            <Card>
                <Card.Body>
                    <Card.Title className="cql-wizard-element-filters-header">
                        {cardTitleCapitalizing(elementFilter)}

                        <ToggleButtonGroup
                            type="radio"
                            name={`${elementFilter.elementName}-date-type`}
                            value={getDateTypeFromFilterType(dateFilter.filteredDate.filterType)}
                            onChange={newDateType => {
                                const newFilterType = newDateType === DateType.None ? DateFilterType.None : newDateType === DateType.Relative ? DateFilterType.OlderThan : DateFilterType.Before;
                                dispatchNewDateFilter(elementFilter.elementName, newFilterType);
                            }}
                        >
                            <ToggleButton variant="outline-secondary" value={DateType.None}>Any Date</ToggleButton>
                            <ToggleButton variant="outline-secondary" value={DateType.Relative}>Relative</ToggleButton>
                            <ToggleButton variant="outline-secondary" value={DateType.Absolute}>Absolute</ToggleButton>
                        </ToggleButtonGroup>

                        <ToggleButtonGroup
                            type="radio"
                            name={`${elementFilter.elementName}-date-filter-type`}
                            value={dateFilter.filteredDate.filterType}
                            onChange={newFilterType => dispatchNewDateFilter(elementFilter.elementName, newFilterType)}
                        >
                            {(() => {
                                switch (getDateTypeFromFilterType(dateFilter.filteredDate.filterType)) {
                                    case DateType.Absolute:
                                        return [
                                            <ToggleButton key={DateFilterType.Before} variant="outline-secondary" value={DateFilterType.Before}>Before</ToggleButton>,
                                            <ToggleButton key={DateFilterType.After} variant="outline-secondary" value={DateFilterType.After}>After</ToggleButton>,
                                            <ToggleButton key={DateFilterType.Between} variant="outline-secondary" value={DateFilterType.Between}>Between</ToggleButton>
                                        ];
                                    case DateType.Relative:
                                        return [
                                            <ToggleButton key={DateFilterType.OlderThan} variant="outline-secondary" value={DateFilterType.OlderThan}>Older than</ToggleButton>,
                                            <ToggleButton key={DateFilterType.NewerThan} variant="outline-secondary" value={DateFilterType.NewerThan}>Within last</ToggleButton>
                                        ];
                                    case DateType.None:
                                        return undefined;
                                }
                            })()}
                        </ToggleButtonGroup>
                    </Card.Title>
                    {(() => {
                        switch (dateFilter.filteredDate.filterType) {
                            case DateFilterType.Before:
                            case DateFilterType.After:
                                return (
                                    <SingleDatePicker
                                        openDirection="down"
                                        numberOfMonths={1}
                                        showClearDate
                                        reopenPickerOnClearDate
                                        onClose={({ date }) => dispatchNewDateFilter(elementFilter.elementName, dateFilter.filteredDate.filterType, date)}
                                        isOutsideRange={() => false}
                                        id={`${elementFilter.elementName}-date-1`}
                                        date={datePickerStates[elementFilter.elementName].dateOne}
                                        onDateChange={date => setDatePickerStates((oldState) => {
                                            return {
                                                ...oldState,
                                                [elementFilter.elementName]: {
                                                    ...oldState[elementFilter.elementName],
                                                    dateOne: date,
                                                }
                                            };
                                        })}
                                        focused={datePickerStates[elementFilter.elementName].focusDateOne}
                                        onFocusChange={({ focused }) => setDatePickerStates((oldState) => {
                                            return {
                                                ...oldState,
                                                [elementFilter.elementName]: {
                                                    ...oldState[elementFilter.elementName],
                                                    focusDateOne: focused,
                                                }
                                            };
                                        })} />
                                );
                            case DateFilterType.Between:
                                return (
                                    <DateRangePicker
                                        openDirection="down"
                                        showClearDates
                                        reopenPickerOnClearDates
                                        onClose={({ startDate, endDate }) => dispatchNewDateFilter(elementFilter.elementName, dateFilter.filteredDate.filterType, startDate, endDate)}
                                        isOutsideRange={() => false}
                                        startDate={datePickerStates[elementFilter.elementName].dateOne}
                                        startDateId={`${elementFilter.elementName}-date-between-start`}
                                        endDate={datePickerStates[elementFilter.elementName].dateTwo}
                                        endDateId={`${elementFilter.elementName}-date-between-end`}
                                        onDatesChange={({ startDate, endDate }) => setDatePickerStates((oldState) => {
                                            return {
                                                ...oldState,
                                                [elementFilter.elementName]: {
                                                    ...oldState[elementFilter.elementName],
                                                    dateOne: startDate,
                                                    dateTwo: endDate,
                                                }
                                            };
                                        })}
                                        focusedInput={datePickerStates[elementFilter.elementName].focusDateOne ? 'startDate' : datePickerStates[elementFilter.elementName].focusDateTwo ? 'endDate' : null}
                                        onFocusChange={focusedInput => setDatePickerStates((oldState) => {
                                            return {
                                                ...oldState,
                                                [elementFilter.elementName]: {
                                                    ...oldState[elementFilter.elementName],
                                                    focusDateOne: focusedInput === 'startDate',
                                                    focusDateTwo: focusedInput === 'endDate',
                                                }
                                            };
                                        })} />
                                );
                            case DateFilterType.NewerThan:
                            case DateFilterType.OlderThan:
                                return (
                                    <div className="cql-wizard-element-filters-relative-date-controls">
                                        <Form.Control
                                            placeholder="Amount of time"
                                            type="number"
                                            defaultValue={dateFilter.filteredDate.relativeAmount}
                                            min={0}
                                            onChange={e => dispatchNewDateFilter(
                                                elementFilter.elementName, dateFilter.filteredDate.filterType, undefined, undefined,
                                                dateFilter.filteredDate.relativeUnit, convertFormInputToNumber(e.target.value, dateFilter.filteredDate.relativeAmount))} />
                                        <ToggleButtonGroup
                                            type="radio"
                                            name={`${elementFilter.elementName}-date-relative-unit`}
                                            value={dateFilter.filteredDate.relativeUnit}
                                            onChange={newUnit => dispatchNewDateFilter(elementFilter.elementName, dateFilter.filteredDate.filterType, undefined, undefined, newUnit, dateFilter.filteredDate.relativeAmount)}
                                        >
                                            <ToggleButton variant="outline-primary" value={RelativeDateUnit.Minutes}>Minute(s)</ToggleButton>
                                            <ToggleButton variant="outline-primary" value={RelativeDateUnit.Hours}>Hour(s)</ToggleButton>
                                            <ToggleButton variant="outline-primary" value={RelativeDateUnit.Days}>Day(s)</ToggleButton>
                                            <ToggleButton variant="outline-primary" value={RelativeDateUnit.Weeks}>Week(s)</ToggleButton>
                                            <ToggleButton variant="outline-primary" value={RelativeDateUnit.Months}>Month(s)</ToggleButton>
                                            <ToggleButton variant="outline-primary" value={RelativeDateUnit.Years}>Year(s)</ToggleButton>
                                        </ToggleButtonGroup>
                                    </div>
                                );
                        }
                    })()}
                </Card.Body>
            </Card>
        </div>;
    }

    function cardTitleCapitalizing(ef: ElementFilter) {
        const elemSplit = ef.elementName.split(".").pop() ?? "";
        return ef.elementName.split(".").pop()?.charAt(0).toUpperCase().concat(elemSplit.slice(1));
    }

    function codingFilterUI(elementFilter: ElementFilter): JSX.Element {
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
                                        <ToggleButton type="radio" variant="outline-secondary" value="Any">
                                            Any Value
                                        </ToggleButton>
                                        <ToggleButton type="radio" variant="outline-secondary" value="Specific">
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
        <div className="cql-wizard-select-filters-grid">
            {noParents.map((elementFilter): JSX.Element => {
                return getFilterUI(elementFilter);
            })}

            {onlyParents.map((parent): JSX.Element => {
                return (
                    <Card key={parent}>
                        <Card.Body>
                            <Card.Title>
                                {`${parent[0].toUpperCase()}${parent.slice(1)}`}
                            </Card.Title>
                            {getChildren(parent).map(getFilterUI)}
                        </Card.Body>
                    </Card>
                );
            })}
            <div className="cql-wizard-filters-overscroll-excess" />
        </div>
    )
}