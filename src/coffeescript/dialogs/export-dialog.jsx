/* eslint-disable react/no-string-refs */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import React from 'react';
import { Modal } from 'react-bootstrap';

import State from '../state';
import * as SchemaUtils from '../helpers/schema-utils';
import * as BundleUtils from '../helpers/bundle-utils';
import { saveAs } from 'file-saver';
class ExportDialog extends React.Component {
    shouldComponentUpdate(nextProps) {
        return nextProps.show !== this.props.show;
    }

    handleClose(e) {
        return State.trigger("set_ui", "ready");
    }

    buildJson() {
        let [resource, errCount] = Array.from(
            SchemaUtils.toFhir(this.props.resource, true)
        );
        if (this.props.bundle) {
            resource = BundleUtils.generateBundle(
                this.props.bundle.resources,
                this.props.bundle.pos,
                resource
            );
        }
        const jsonString = JSON.stringify(resource, null, 3);
        return {jsonString, errCount, resourceType: resource.resourceType};
    }

    handleDownload(e) {
        e.preventDefault();
        const {jsonString, resourceType} = this.buildJson();
        const fileName = resourceType.toLowerCase() + ".json";
        const blob = new Blob([jsonString], {type: "text/plain;charset=utf-8"});
        return saveAs(blob, fileName);
    }

    handleUpdate(e) {
        e.preventDefault();
        const resid = $("#resource_id").val();
        const posturl = `/fhir/fhir/${$("#resource_type").val()}/${resid}`;
        //postdata = JSON.stringify( { "resource-create-body": jsonString, "resource-create-id": resid } )
        const {jsonString, resourceType} = this.buildJson();
        return $.ajax(posturl, {
            type: "PUT",
            //dataType: 'json'
            contentType: "application/json+fhir",
            data: jsonString,
            error(jqXHR, textStatus, errorThrown) {
                return $("body").append(`AJAX Error: ${textStatus}`);
            },
            success(data, textStatus, jqXHR) {
                return $("body").append(`Successful AJAX call: ${data}`);
            }
        });
    }

    //help the user with a select all if they hit the
    //control key with nothing selected
    handleKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            const domNode = this.refs.jsonOutput;
            domNode.focus();
            if (
                domNode.selectionStart === domNode.selectionEnd &&
                domNode.setSelectionRange
            ) {
                domNode.setSelectionRange(0, domNode.value.length);
                return (this.copying = true);
            }
        }
    }

    handleKeyUp(e) {
        if (this.copying) {
            this.copying = false;
            return this.refs.jsonOutput.setSelectionRange(0, 0);
        }
    }

    render() {
        if (!this.props.show) {
            return null;
        }

        const {jsonString, errCount} = this.buildJson();

        const errNotice =
            errCount > 0 ? (
                <div className="alert alert-danger">
                    Note that the current resource has unresolved data entry errors
                </div>
            ) : (
                undefined
            );

        return (
            <Modal
                show={true}
                onHide={this.handleClose.bind(this)}
                onKeyDown={this.handleKeyDown.bind(this)}
                onKeyUp={this.handleKeyUp.bind(this)}
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title>Export JSON</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {errNotice}
                    <textarea
                        readOnly={true}
                        ref="jsonOutput"
                        className="form-control"
                        style={{height: "300px"}}
                        value={jsonString}
                    />
                    <br/>
                    <input id="resource_id" type="text"/>
                    <select id="resource_type">
                        <option value="Questionnaire">Questionnaire</option>
                        <option value="DataElement">DataElement</option>
                    </select>
                    <p className="small">
                        *Press Ctrl+C / Command+C to copy json text to system clipboard
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <button
                        className="btn btn-default"
                        onClick={this.handleDownload.bind(this)}
                    >{`\
\t\t\t\t\tDownload\
`}</button>
                    <button
                        className="btn btn-default"
                        onClick={this.handleUpdate.bind(this)}
                    >{`\
\t\t\t\t\tUpdate\
`}</button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default ExportDialog;
