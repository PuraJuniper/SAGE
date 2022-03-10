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
import { DATA_ELEMENT, fhirToFriendly, QUESTIONNAIRE } from '../simplified/nameHelpers';
class ExportDialog extends React.Component {
    shouldComponentUpdate(nextProps) {
        return nextProps.show !== this.props.show;
    }

    handleClose(errFields, e) {
        if (errFields.length > 0) State.emit("highlight_errors", errFields);
        return State.emit("set_ui", "closedialog");
    }

    buildJson() {
        let [resource, errCount, errFields] = Array.from(
            SchemaUtils.toFhir(this.props.bundle.resources[this.props.bundle.pos], true)
        );  

        function removeEmptyFields(obj) {
            return function remove(current) {
              _.forOwn(current, function (value, key) {
                if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) ||
                  (_.isString(value) && _.isEmpty(value)) ||
                  (_.isObject(value) && _.isEmpty(remove(value)))) {
                  delete current[key];
                }
              });
              // remove any leftover undefined values from the delete 
              // operation on an array
              if (_.isArray(current)) _.pull(current, undefined);
          
              return current;
          
            }(_.cloneDeep(obj));  // Do not modify the original object, create a clone instead
          }



        // Convert all resources to FHIR JSON
        const resourcesJson = [];
        const urlsInBundle = []; // All URLs being exported
        const referencedLibraries = {}; // All Library URLs that are referenced
        for (const resource of this.props.bundle.resources) {
            const resourceAsFhirJson = SchemaUtils.toFhir(resource, false);
            if (resourceAsFhirJson.url) {
                urlsInBundle.push(resourceAsFhirJson.url);
            }
            if (resourceAsFhirJson.library) {
                for (const libUrl of resourceAsFhirJson.library) {
                    referencedLibraries[libUrl] = true;
                }
            }
            resourcesJson.push(resourceAsFhirJson);
        }

        // Add in any Libraries that are referenced but aren't currently part of the Bundle
        const libraryStore = State.get().simplified.libraries.toJS();
        for (const libUrl of Object.keys(referencedLibraries)) {
            if (!urlsInBundle.find((v) => v == libUrl)) {
                // Must add Library with url `libUrl` to exported Bundle
                let found = false;
                for (const libId of Object.keys(libraryStore)) {
                    if (libraryStore[libId].url == libUrl) {
                        resourcesJson.push(libraryStore[libId].fhirLibrary);
                        found = true;
                    }
                }
                if (!found) {
                    console.log(`Could not find referenced FHIR Library for ${libUrl}.\nLibrary will be missing from exported Bundle`);
                }
            }
        }
        var bundleJson;
        if (this.props.bundle) {
            bundleJson = BundleUtils.generateBundle(
                resourcesJson
            );
        }

        const jsonString = JSON.stringify(removeEmptyFields(bundleJson), null, 3);
        return {jsonString, errCount, errFields, resourceType: resource.resourceType};
    }

    handleDownload(e) {
        e.preventDefault();
        const {jsonString, resourceType} = this.buildJson();
        const fileName = resourceType.toLowerCase() + ".json";
        const blob = new Blob([jsonString], {type: "text/plain;charset=utf-8"});
        return saveAs(blob, fileName);
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

        const {jsonString, errCount, errFields} = this.buildJson();
        const errNotice =
            errCount > 0 ? (
                <div className="alert alert-danger">
                    Note that this most recent resource has unresolved data entry errors:
                    {errFields.map(function(f, idx) {return (<li key={idx}>{f}</li>)})}
                </div>
            ) : (
                undefined
            );

        return (
            <Modal
                show={true}
                onHide={() => { this.handleClose(errFields)}}
                onKeyDown={this.handleKeyDown.bind(this)}
                onKeyUp={this.handleKeyUp.bind(this)}
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title>Exported FHIR JSON</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {errNotice}
                    <textarea
                        readOnly={true}
                        title="exportedJson"
                        ref="jsonOutput"
                        className="form-control"
                        style={{height: "300px"}}
                        value={jsonString}
                    />
                    <br/>
                    <input id="resource_id" type="text"/>
                    <select id="resource_type">
                        <option value={QUESTIONNAIRE}>{fhirToFriendly(QUESTIONNAIRE)}</option>
                        <option value={DATA_ELEMENT}>{fhirToFriendly(DATA_ELEMENT)}</option>
                    </select>
                    <p className="small">
                        <i>Warning: The FHIR Bundle may not contain all Resources necessary for execution unless they were explicitly added within SAGE. Please verify that all dependencies of each Library are present before attempting to execute it.</i>
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <button
                        className="btn btn-default"
                        onClick={this.handleDownload.bind(this)}
                    >Download</button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default ExportDialog;
