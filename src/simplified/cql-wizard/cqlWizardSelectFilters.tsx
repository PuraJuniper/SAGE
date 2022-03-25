import React, { Dispatch, useEffect, useState } from "react";
import { BooleanFilter, CodeFilterType, CodingFilter, DateFilter, DateFilterType, PeriodFilter, PeriodFilterType, RelativeDateUnit, WizardAction, WizardState } from './wizardLogic';
import { ToggleButtonGroup, ToggleButton, Card, Form, Container, InputGroup, FormControl, DropdownButton, Dropdown } from 'react-bootstrap';
import { ElementFilter } from './wizardLogic';
import 'react-dates/initialize';
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';
// import { START_DATE, END_DATE } from 'react-dates/constants';
import 'react-dates/lib/css/_datepicker.css';
import moment, { Moment } from 'moment';
import Select, { ActionMeta, InputActionMeta, SingleValue } from "react-select";

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

// Dealing with HTML Form input
export function convertFormInputToNumber(input: string | undefined, lastValue: number): number {
    return typeof(input) === 'undefined' ? lastValue : (typeof(input) === 'string' ? (isNaN(parseInt(input, 10)) ? 0 : parseInt(input, 10)) : input)
}

export const CqlWizardSelectFilters = (props: CqlWizardSelectFiltersProps) => {
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

    return (
        <div className="cql-wizard-select-filters-grid">
            {props.wizState.filters.map((elementFilter): JSX.Element => {
                switch (elementFilter.filter.type) {
                    case "coding": {
                        const codeBinding = elementFilter.filter.codeBinding;
                        const codeFilter = elementFilter.filter;
                        if (!codeBinding) {
                            return (
                                <div key={`${elementFilter.elementName}-no-binding`}>No binding found for {elementFilter.elementName}</div>
                            );
                        }
                        return (
                            <div key={elementFilter.elementName}>
                                <Card>
                                    <Card.Body>
                                        <Card.Title className="cql-wizard-element-filters-header">
                                            {`${elementFilter.elementName[0].toUpperCase()}${elementFilter.elementName.slice(1)}`}
                                            
                                            {/* Need to nest ToggleButton in ToggleButtonGroup to prevent a checkbox appearing inside the ToggleButton (bug in react-bootstrap?) */}
                                            <ToggleButtonGroup
                                                type="radio"
                                                name={`${elementFilter.elementName}-code-filter-type`}
                                                value={codeFilter.filteredCoding.filterType === CodeFilterType.None ? "Any" : "Specific"}
                                                onChange={selected => 
                                                    dispatchNewCodingFilter(elementFilter.elementName, selected === "Any" ? CodeFilterType.None : CodeFilterType.Filtered, codeFilter.filteredCoding.selectedIndexes)
                                                }
                                            >
                                                <ToggleButton type="radio" variant="outline-secondary" value="Any">
                                                    Any Value
                                                </ToggleButton>
                                                <ToggleButton type="radio" variant="outline-secondary" value="Specific">
                                                    Specific Value
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                        </Card.Title>
                                        <Select<{ idx: number }, true> // This { idx: number } business is just so that this component can be interchangeable with the ToggleButtonGroup below
                                            options={codeBinding.codes.map((code, i) => {
                                                return { idx: i };
                                            })}
                                            isMulti={true}
                                            getOptionValue={codeIdx => `${codeIdx.idx}`}
                                            getOptionLabel={codeIdx => codeBinding.codes[codeIdx.idx].display ?? codeBinding.codes[codeIdx.idx].code}
                                            onChange={newValue => dispatchNewCodingFilter(elementFilter.elementName, CodeFilterType.Filtered, newValue.map(v => v.idx))}
                                            value={codeFilter.filteredCoding.selectedIndexes.map(v => {
                                                return { idx: v }
                                            })}
                                            styles={{ menu: provided => ({ ...provided, zIndex: 9999 }) }} // https://stackoverflow.com/a/55831990
                                            isSearchable={true}
                                            closeMenuOnSelect={false}
                                            isDisabled={codeFilter.filteredCoding.filterType === CodeFilterType.None}
                                        />
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
                    case "date":
                    case "age": {
                        const dateFilter = elementFilter.filter;
                        return (
                            <div key={elementFilter.elementName}>
                                <DateFilterCard elementFilter={elementFilter} dateFilter={dateFilter} dispatchNewFilters={dispatchNewFilters} />
                            </div>
                        );
                    }
                    case "period": {
                        const periodFilter = elementFilter.filter;
                        return (
                            <div key={elementFilter.elementName}>
                                <PeriodFilterCard elementFilter={elementFilter} periodFilter={periodFilter} dispatchNewFilters={dispatchNewFilters} />
                            </div>
                        );
                    }
                    case "boolean": {
                        const booleanFilter = elementFilter.filter;
                        return (
                            <div key={elementFilter.elementName}>
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
                                                <ToggleButton variant="outline-secondary" value={BooleanSelectOptions.Any}>Any</ToggleButton>
                                                <ToggleButton variant="outline-secondary" value={BooleanSelectOptions.True}>True</ToggleButton>
                                                <ToggleButton variant="outline-secondary" value={BooleanSelectOptions.False}>False</ToggleButton>
                                            </ToggleButtonGroup>
                                        </Card.Title>
                                    </Card.Body>
                                </Card>
                            </div>
                        )
                    }
                    case "unknown":
                        return (
                            <div key={elementFilter.elementName}>
                                Unknown Filter {elementFilter.elementName}
                            </div>
                        )
                }
            })}
            <div className="cql-wizard-filters-overscroll-excess" />
        </div>
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

    const isAge = props.dateFilter.type === "age";

    return (
        <Card>
            <Card.Body>
                <Card.Title className="cql-wizard-element-filters-header">
                    {`${props.elementFilter.elementName[0].toUpperCase()}${props.elementFilter.elementName.slice(1)}`}
                    
                    <ToggleButtonGroup
                        type="radio"
                        name={`${props.elementFilter.elementName}-date-type`}
                        value={getDateTypeFromFilterType(props.dateFilter.filteredDate.filterType)}
                        onChange={newDateType => {
                            const newFilterType = newDateType === DateType.None ? DateFilterType.None : newDateType === DateType.Relative ? DateFilterType.OlderThan : DateFilterType.Before;
                            dispatchNewDateFilter(props.elementFilter.elementName, newFilterType)
                        }}
                    >
                        <ToggleButton variant="outline-secondary" value={DateType.None}>{isAge ? "Any" : "Any Date"}</ToggleButton>
                        <ToggleButton variant="outline-secondary" value={DateType.Relative}>{isAge ? "Age" : "Relative"}</ToggleButton>
                        <ToggleButton variant="outline-secondary" value={DateType.Absolute}>{isAge ? "Date" : "Absolute"}</ToggleButton>
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
                                        <ToggleButton key={DateFilterType.Before} variant="outline-secondary" value={DateFilterType.Before}>Before</ToggleButton>,
                                        <ToggleButton key={DateFilterType.After} variant="outline-secondary" value={DateFilterType.After}>After</ToggleButton>,
                                        <ToggleButton key={DateFilterType.Between} variant="outline-secondary" value={DateFilterType.Between}>Between</ToggleButton>
                                    ];
                                case DateType.Relative: 
                                    return [
                                        <ToggleButton key={DateFilterType.OlderThan} variant="outline-secondary" value={DateFilterType.OlderThan}>Older than</ToggleButton>,
                                        <ToggleButton key={DateFilterType.NewerThan} variant="outline-secondary" value={DateFilterType.NewerThan}>{isAge ? "Younger Than" : "Within last"}</ToggleButton>
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
                                                <ToggleButton key="mins" variant="outline-primary" value={RelativeDateUnit.Minutes}>Minute(s)</ToggleButton>,
                                                <ToggleButton key="hours" variant="outline-primary" value={RelativeDateUnit.Hours}>Hour(s)</ToggleButton>,
                                                <ToggleButton key="days" variant="outline-primary" value={RelativeDateUnit.Days}>Day(s)</ToggleButton>,
                                            ] :
                                            null
                                        }
                                        <ToggleButton variant="outline-primary" value={RelativeDateUnit.Weeks}>Week(s)</ToggleButton>
                                        <ToggleButton variant="outline-primary" value={RelativeDateUnit.Months}>Month(s)</ToggleButton>
                                        <ToggleButton variant="outline-primary" value={RelativeDateUnit.Years}>Year(s)</ToggleButton>
                                    </ToggleButtonGroup>
                                </div>
                            )
                    }
                })()}
            </Card.Body>
        </Card>
    )
}

function checkPeriodFilterErrors(filter: PeriodFilter, filterType: PeriodFilterType): boolean {
    switch(filterType) {
        case PeriodFilterType.Ongoing:
            return filter.filteredDate.startDate === null;
        case PeriodFilterType.Until:
            return filter.filteredDate.endDate === null;
        case PeriodFilterType.Between:
            return filter.filteredDate.startDate === null || filter.filteredDate.endDate === null || filter.filteredDate.endDate <= filter.filteredDate.startDate;
        case PeriodFilterType.None:
            return false;
    }
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
            dateOne: props.periodFilter.filteredDate.startDate?.clone() || null,
            focusDateOne: false,
            dateTwo: props.periodFilter.filteredDate.endDate?.clone() || null,
            focusDateTwo: false,
        }
    });

    /**
     * Reset mutable dates used by react-date components to match any upstream changes to the date
     */
    useEffect(() => {
        setDatePickerState({
            dateOne: props.periodFilter.filteredDate.startDate?.clone() || null,
            focusDateOne: false,
            dateTwo: props.periodFilter.filteredDate.endDate?.clone() || null,
            focusDateTwo: false,
        });
    }, [props.periodFilter])

    function dispatchNewPeriodFilter(elementName: string, newPeriodType: PeriodFilterType, newStartDate?: Moment | null, newEndDate?: Moment | null) {
        props.dispatchNewFilters(elementName, v => {
            const oldFilter = v.filter as PeriodFilter;
            const newElementFilter: ElementFilter = {
                ...v,
                filter: {
                    ...oldFilter,
                    filteredDate: {
                        ...oldFilter.filteredDate,
                        periodType: newPeriodType,
                        startDate: newStartDate === undefined ? oldFilter.filteredDate.startDate : (newStartDate?.clone() || null),
                        endDate: newEndDate === undefined ? oldFilter.filteredDate.endDate : (newEndDate?.clone() || null),
                    }
                }
            }

            const newFilter = newElementFilter.filter as PeriodFilter;
            newFilter.error = checkPeriodFilterErrors(newFilter, newPeriodType);

            return newElementFilter;
        });
    }

    return (
        <Card>
            <Card.Body>
                <Card.Title className="cql-wizard-element-filters-header">
                    {`${props.elementFilter.elementName[0].toUpperCase()}${props.elementFilter.elementName.slice(1)}`}
                    
                    <ToggleButtonGroup
                        type="radio"
                        name={`${props.elementFilter.elementName}-date-type`}
                        value={props.periodFilter.filteredDate.periodType}
                        onChange={newPeriodType => {
                            dispatchNewPeriodFilter(props.elementFilter.elementName, newPeriodType)
                        }}
                    >
                        <ToggleButton variant="outline-secondary" value={PeriodFilterType.None}>Any Period</ToggleButton>
                        <ToggleButton variant="outline-secondary" value={PeriodFilterType.Between}>Between</ToggleButton>
                        <ToggleButton variant="outline-secondary" value={PeriodFilterType.Ongoing}>Ongoing From</ToggleButton>
                        <ToggleButton variant="outline-secondary" value={PeriodFilterType.Until}>Ends On</ToggleButton>
                    </ToggleButtonGroup>
                </Card.Title>
                {(() => {
                    const periodType = props.periodFilter.filteredDate.periodType;
                    switch(periodType) {
                        case PeriodFilterType.None:
                            return null;
                        case PeriodFilterType.Until:
                        case PeriodFilterType.Ongoing:
                            return (
                                <SingleDatePicker
                                    openDirection="down"
                                    numberOfMonths={1}
                                    showClearDate
                                    reopenPickerOnClearDate
                                    onClose={({date}) => dispatchNewPeriodFilter(props.elementFilter.elementName, periodType, periodType === PeriodFilterType.Ongoing ? date : undefined, periodType === PeriodFilterType.Until ? date : undefined)}
                                    isOutsideRange={() => false}
                                    id={`${props.elementFilter.elementName}-date-1`}
                                    date={periodType === PeriodFilterType.Ongoing ? datePickerState.dateOne : datePickerState.dateTwo}
                                    onDateChange={date => setDatePickerState((oldState) => {
                                        return {
                                            ...oldState,
                                            dateOne: periodType === PeriodFilterType.Ongoing ? date : null,
                                            dateTwo: periodType === PeriodFilterType.Until ? date : null,
                                        }
                                    })}
                                    focused={periodType === PeriodFilterType.Ongoing ? datePickerState.focusDateOne : datePickerState.focusDateTwo}
                                    onFocusChange={({ focused }) => setDatePickerState((oldState) => {
                                        return {
                                            ...oldState,
                                            focusDateOne: periodType === PeriodFilterType.Ongoing ? focused : false,
                                            focusDateTwo: periodType === PeriodFilterType.Until ? focused : false,
                                        };
                                    })}
                                />
                            );
                        case PeriodFilterType.Between:
                            return (
                                <DateRangePicker
                                    openDirection="down"
                                    showClearDates
                                    reopenPickerOnClearDates
                                    onClose={({startDate, endDate}) => dispatchNewPeriodFilter(props.elementFilter.elementName, periodType, startDate, endDate)}
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
                    }
                })()}
            </Card.Body>
        </Card>
    )
}