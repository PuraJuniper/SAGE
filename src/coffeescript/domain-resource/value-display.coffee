import React from "react"
import Moment from "moment"
import Sanitize from "sanitize-caja"
import State from "../state"

class ValueDisplay extends React.Component

	displayName: "ValueDisplay"
	maxTextLength: 40

	shouldComponentUpdate: (nextProps) ->
		nextProps.node isnt @props.node

	formatInstant: (value) ->
		Moment(value).parseZone(value).format("YYYY-MM-DD h:m:ss A ([GMT]Z)")

	formatTime: (value) ->
		Moment(value, "HH:mm:ss.SSSS").format("h:m:ss A")

	formatDate: (value) ->
		dashCount = value.match(/\-/g)?.length
		if dashCount is 1
			Moment(value, "YYYY-MM").format("MMM YYYY")
		else if dashCount is 2
			Moment(value, "YYYY-MM-DD").format("MMM Do, YYYY")
		else
			value

	formatDateTime: (value) ->
		dashCount = value.match(/\-/g)?.length
		hasTime = value.indexOf(":") > -1
		if dashCount is 2 and hasTime
			@formatInstant(value)
		else
			@formatDate(value)

	formatString: (value) ->
		#truncate very long values
		value.toString().substr(0, 400)

	formatBoolean: (value) ->
		if value is true or value is "true"
			"Yes"
		else
			"No"

	formatCode: (value) ->
		if @props.node?.binding?.strength
			if @props.node.binding.strength is "required"
				invalid = true
			reference = @props.node.binding.reference
			vs = State.get().valuesets[reference]
			for [display, code] in vs.items
				if code is value
					invalid = false
					value = display
					break

		value = @formatString(value)
		if invalid
			<span className="fhir-invalid-code">{value} [invalid code]</span>
		else
			value

	formatXhtml: (value) ->
		<div>
			<div className="fhir-xhtml" dangerouslySetInnerHTML={{__html: Sanitize(value)}} />
			<div className="small text-right" onClick={@handleXhtmlPopup.bind(@)}><a href="#">view in new window</a></div>
		</div>

	handleXhtmlPopup: (e) ->
		e.preventDefault()
		e.stopPropagation()
		win = window.open("", "XHTML Preview")
		win.document.body.innerHTML = """
			<html><head>
			<link href='narrative.css' rel='stylesheet'>
			<link href='normalize.css' rel='stylesheet'>
			</head><body> 
			#{@props.node.value}
			</body></html>
		"""

	formatInt: (value) ->
		parseInt(value).toString()

	formatBlob: (value, contentType) ->
		if contentType in ["image/jpeg", "image/png", "image/gif"]
			dataUri = "data:#{contentType};base64,#{value}"
			<img src={dataUri} />
		else
			@formatString(value)

	formatDecimal: (value) ->
		return value

	formatInt: (value) ->
		value.toString()


	formatBlank: ->
		<span className="empty-value">...</span>

	render: ->
		formatters = 
			date: @formatDate, time: @formatTime, instant: @formatInstant, dateTime: @formatDateTime
			integer: @formatInt, unsignedInt: @formatInt, positiveInt: @formatInt, decimal: @formatDecimal
			boolean: @formatBoolean, string: @formatString, uri: @formatString, oid: @formatString, code: @formatString
			id: @formatString, markdown: @formatString, xhtml: @formatXhtml, code: @formatCode,
			"http://hl7.org/fhirpath/System.String": @formatString

		formatter = formatters[@props.node.fhirType || "string"]
		value = @props.node.value
		console.log @props.node.fhirType
		console.log @formatString
		console.log formatters
		console.log formatter
		if @props.node.fhirType is null
			value = value.toString()
		displayValue = if @props.node.fhirType is "base64Binary"
			@formatBlob(value, @props.parent.contentType)
		else if value not in [null, undefined, ""]
			formatter.call(@, value)
		else
			@formatBlank()

		<span className="fhir-element-value">{displayValue}</span>

export default ValueDisplay
