import React, { Dispatch, useEffect, useState } from "react";
import { CodeFilterType, CodingFilter, DateFilter, DateFilterType, RelativeDateUnit, WizardAction, WizardState } from './wizardLogic';
import { ToggleButtonGroup, ToggleButton, Card, Form, Container, InputGroup, FormControl, DropdownButton, Dropdown } from 'react-bootstrap';
import { ElementFilter } from './wizardLogic';
import 'react-dates/initialize';
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import moment, { Moment } from 'moment';

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

function initDatePickerStates(filters: ElementFilter[]): DatePickerStates {
    const newDatePickerStates: DatePickerStates = {};
    filters.forEach(v => {
        if (v.filter.type === "date") {
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

    function dispatchNewCodingFilter(elementName: string, filterType: CodeFilterType, selectedIndexes: number[]) {
        const newElementFilters: ElementFilter[] = props.wizState.filters.map<ElementFilter>(v => {
            if (v.elementName !== elementName) {
                return v;
            }
            else {
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
            }
        })
        props.wizDispatch(["setFilters", newElementFilters]);
    }

    function dispatchNewDateFilter(elementName: string, newFilterType: DateFilterType, newDate1?: Moment | null, newDate2?: Moment | null, newRelativeUnit?: RelativeDateUnit, newRelativeAmountInput?: number) {
        const newElementFilters: ElementFilter[] = props.wizState.filters.map<ElementFilter>(v => {
            if (v.elementName !== elementName) {
                return v;
            }
            else {
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
            }
        })
        props.wizDispatch(["setFilters", newElementFilters]);
    }

    return (
        <div className="cql-wizard-select-filters-grid">
            {props.wizState.filters.map(elementFilter => {
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
                                        <ToggleButtonGroup type="checkbox" value={codeFilter.filteredCoding.selectedIndexes} className="cql-wizard-element-filters-button-group"
                                            onChange={selectedIndexes => dispatchNewCodingFilter(elementFilter.elementName, CodeFilterType.Filtered, selectedIndexes)}
                                        >
                                            {codeBinding.codes.map((code, i) => {
                                                return <ToggleButton key={i} value={i} variant='outline-primary'
                                                    className={codeFilter.filteredCoding.filterType === CodeFilterType.None ? "cql-wizard-element-filters-button-ignored" : undefined}
                                                >
                                                    {code.display}
                                                </ToggleButton>
                                            })}
                                        </ToggleButtonGroup>
                                    </Card.Body>
                                </Card>
                            </div>
                        );
                    }
                    case "date": {
                        const dateFilter = elementFilter.filter;
                        return (
                            <div key={elementFilter.elementName}>
                                <Card>
                                    <Card.Body>
                                        <Card.Title className="cql-wizard-element-filters-header">
                                            {`${elementFilter.elementName[0].toUpperCase()}${elementFilter.elementName.slice(1)}`}
                                            
                                            <ToggleButtonGroup
                                                type="radio"
                                                name={`${elementFilter.elementName}-date-type`}
                                                value={getDateTypeFromFilterType(dateFilter.filteredDate.filterType)}
                                                onChange={newDateType => {
                                                    const newFilterType = newDateType === DateType.None ? DateFilterType.None : newDateType === DateType.Relative ? DateFilterType.OlderThan : DateFilterType.Before;
                                                    dispatchNewDateFilter(elementFilter.elementName, newFilterType)
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
                                                    switch(getDateTypeFromFilterType(dateFilter.filteredDate.filterType)) {
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
                                            switch(dateFilter.filteredDate.filterType) {
                                                case DateFilterType.Before:
                                                case DateFilterType.After:
                                                    return (
                                                        <SingleDatePicker
                                                            openDirection="down"
                                                            numberOfMonths={1}
                                                            showClearDate
                                                            reopenPickerOnClearDate
                                                            onClose={({date}) => dispatchNewDateFilter(elementFilter.elementName, dateFilter.filteredDate.filterType, date)}
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
                                                            })}
                                                        />
                                                    );
                                                case DateFilterType.Between:
                                                    return (
                                                        <DateRangePicker
                                                            openDirection="up"
                                                            showClearDates
                                                            reopenPickerOnClearDates
                                                            onClose={({startDate, endDate}) => dispatchNewDateFilter(elementFilter.elementName, dateFilter.filteredDate.filterType, startDate, endDate)}
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
                                                                defaultValue={dateFilter.filteredDate.relativeAmount}
                                                                min={0}
                                                                onChange={e => 
                                                                    dispatchNewDateFilter(
                                                                        elementFilter.elementName, dateFilter.filteredDate.filterType, undefined, undefined, 
                                                                        dateFilter.filteredDate.relativeUnit, convertFormInputToNumber(e.target.value, dateFilter.filteredDate.relativeAmount))
                                                                    }
                                                            />
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
                                                    )
                                            }
                                        })()}
                                    </Card.Body>
                                </Card>
                            </div>
                        );
                    }
                    case "unknown":
                        return (
                            <div key={elementFilter.elementName}>
                                Unknown Filter {elementFilter.elementName}
                            </div>
                        )
                }
            })}
        </div>
    )
}