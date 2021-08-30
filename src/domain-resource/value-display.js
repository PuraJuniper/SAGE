/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import Moment from "moment";
import Sanitize from "sanitize-caja";
import State from "../state";

class ValueDisplay extends React.Component {
	static initClass() {
	
		this.prototype.displayName = "ValueDisplay";
		this.prototype.maxTextLength = 40;
	}

	shouldComponentUpdate(nextProps) {
		return nextProps.node !== this.props.node;
	}

	formatInstant(value) {
		return Moment(value).parseZone(value).format("YYYY-MM-DD h:m:ss A ([GMT]Z)");
	}

	formatTime(value) {
		return Moment(value, "HH:mm:ss.SSSS").format("h:m:ss A");
	}

	formatDate(value) {
		const dashCount = value.match(/\-/g)?.length;
		if (dashCount === 1) {
			return Moment(value, "YYYY-MM").format("MMM YYYY");
		} else if (dashCount === 2) {
			return Moment(value, "YYYY-MM-DD").format("MMM Do, YYYY");
		} else {
			return value;
		}
	}

	formatDateTime(value) {
		const dashCount = value.match(/\-/g)?.length;
		const hasTime = value.indexOf(":") > -1;
		if ((dashCount === 2) && hasTime) {
			return this.formatInstant(value);
		} else {
			return this.formatDate(value);
		}
	}

	formatString(value) {
		//truncate very long values
		return value.toString().substr(0, 400);
	}

	formatBoolean(value) {
		if ((value === true) || (value === "true")) {
			return "Yes";
		} else {
			return "No";
		}
	}

	formatCode(value) {
		let invalid;
		if (this.props.node?.binding?.strength) {
			if (this.props.node.binding.strength === "required") {
				invalid = true;
			}
			const {
                reference
            } = this.props.node.binding;
			const vs = State.get().valuesets[reference];
			for (let [display, code] of Array.from(vs.items)) {
				if (code === value) {
					invalid = false;
					value = display;
					break;
				}
			}
		}

		value = this.formatString(value);
		if (invalid) {
			return <span className="fhir-invalid-code">{value} [invalid code]</span>;
		} else {
			return value;
		}
	}

	formatXhtml(value) {
		return <div>
			<div className="fhir-xhtml" dangerouslySetInnerHTML={{__html: Sanitize(value)}} />
			<div className="small text-right" onClick={this.handleXhtmlPopup.bind(this)}><a href="#">view in new window</a></div>
		</div>;
	}

	handleXhtmlPopup(e) {
		e.preventDefault();
		e.stopPropagation();
		const win = window.open("", "XHTML Preview");
		return win.document.body.innerHTML = `\
<html><head>
<link href='narrative.css' rel='stylesheet'>
<link href='normalize.css' rel='stylesheet'>
</head><body> 
${this.props.node.value}
</body></html>\
`;
	}

	formatInt(value) {
		return parseInt(value).toString();
	}

	formatBlob(value, contentType) {
		if (["image/jpeg", "image/png", "image/gif"].includes(contentType)) {
			const dataUri = `data:${contentType};base64,${value}`;
			return <img src={dataUri} />;
		} else {
			return this.formatString(value);
		}
	}

	formatDecimal(value) {
		return value;
	}

	formatInt(value) {
		return value.toString();
	}


	formatBlank() {
		return <span className="empty-value">...</span>;
	}

	render() {
		const formatters = { 
			date: this.formatDate, time: this.formatTime, instant: this.formatInstant, dateTime: this.formatDateTime,
			integer: this.formatInt, unsignedInt: this.formatInt, positiveInt: this.formatInt, decimal: this.formatDecimal,
			boolean: this.formatBoolean, string: this.formatString, uri: this.formatString, oid: this.formatString, code: this.formatString,
			id: this.formatString, markdown: this.formatString, xhtml: this.formatXhtml, code: this.formatCode,
			"http://hl7.org/fhirpath/System.String": this.formatString
		};

		const formatter = formatters[this.props.node.fhirType || "string"];
		let {
            value
        } = this.props.node;
		console.log(this.props.node.fhirType);
		console.log(this.formatString);
		console.log(formatters);
		console.log(formatter);
		if (this.props.node.fhirType === null) {
			value = value.toString();
		}
		const displayValue = this.props.node.fhirType === "base64Binary" ?
			this.formatBlob(value, this.props.parent.contentType)
		: ![null, undefined, ""].includes(value) ?
			formatter.call(this, value)
		:
			this.formatBlank();

		return <span className="fhir-element-value">{displayValue}</span>;
	}
}
ValueDisplay.initClass();

export default ValueDisplay;
