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
import * as SchemaUtils from "../helpers/schema-utils";

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
			if (vs) {
				for (let [display, code] of Array.from(vs.items)) {
					if (code === value) {
						invalid = false;
						value = display;
						break;
					}
				}
			}
			else {
				// TODO: mark these elements as potentially invalid
				invalid = false;
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

	buildShortcutButton(pos) {
		let shortcutButtonClassName = "btn btn-default btn-sm";
		return <button type="button" 
			className={shortcutButtonClassName} 
			onClick={() => {return State.emit("set_bundle_pos", pos)}}
		>
			<span className="fas fa-arrow-right"></span>
		</button>;
	}

	formatCanonical(value) {
		if (!value) {
			return undefined
		}
		let linkedResourceDisplay = ""; // Human-friendly name for linked Resource
		let shortcutButton = "";
		const {
			node: linkedResourceNode,
			pos: linkedResourcePos
		} = SchemaUtils.findFirstSageNodeByUri(State.get().bundle.resources, value);
		if (linkedResourceNode && linkedResourcePos) {
			const nameNode = SchemaUtils.getChildOfNode(linkedResourceNode, "name");
			if (nameNode) {
				linkedResourceDisplay = nameNode.value;
			}
			shortcutButton = this.buildShortcutButton(linkedResourcePos);
		}
		if (!linkedResourceDisplay) {
			// Could occur if no Resource with that URI exists, or if the resource has no "name" element
			linkedResourceDisplay = value;
		}
		return <span>
			<span onClick={this.props.onEditStart}>
				<b>{linkedResourceDisplay}</b>
			</span>
			{shortcutButton}
		</span>
	}

	render() {
		const formatters = { 
			date: this.formatDate, time: this.formatTime, instant: this.formatInstant, dateTime: this.formatDateTime,
			integer: this.formatInt, unsignedInt: this.formatInt, positiveInt: this.formatInt, decimal: this.formatDecimal,
			boolean: this.formatBoolean, string: this.formatString, uri: this.formatString, oid: this.formatString, code: this.formatString,
			id: this.formatString, markdown: this.formatString, xhtml: this.formatXhtml, code: this.formatCode,
			"http://hl7.org/fhirpath/System.String": this.formatString, canonical: this.formatCanonical,
		};

		const formatter = formatters[this.props.node.fhirType || "string"] || this.formatString;
		let {
            value
        } = this.props.node;
		if (this.props.node.fhirType === null) {
			value = value.toString();
		}
		const displayValue = this.props.node.fhirType === "base64Binary" ?
			this.formatBlob(value, this.props.parent.contentType)
		: ![null, undefined, ""].includes(value) ?
			formatter.call(this, value)
		:
			this.formatBlank();

		if (this.props.node.fhirType != "canonical") {
			return <span className="fhir-element-value" onClick={this.props.onEditStart}>{displayValue}</span>;
		}
		return <span className="fhir-element-value">{displayValue}</span>;
	}
}
ValueDisplay.initClass();

export default ValueDisplay;
