/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { FreezerNode } from 'freezer-js';
import { Bundle, BundleEntry, BundleEntryRequest } from 'fhir/r4';
import { v4 as uuidv4 } from 'uuid';
import State, { SageFreezerNode } from '../state'
import { SageSupportedFhirResource } from './schema-utils';

type Substitution = {
	from?: string,
	to?: string,
}

export const fixAllRefs = function(resources: (SageSupportedFhirResource | SageFreezerNode<SageSupportedFhirResource>)[] , subs: Substitution[]) {
	const fixed = [];
	for (let i = 0; i < resources.length; i++) {
		let resource = resources[i];
		if ("toJS" in resource) { resource = resource.toJS(); }
		fixRefs(resource, subs);
		fixed.push(resource);
	}
	return fixed;
};


export const fixRefs = function(resource: SageSupportedFhirResource, subs: Substitution[]) {
	let count = 0;
	const _notDate = (value: any) => !(value instanceof Date);

	const _walkNode = function(node: any) {
		if (node instanceof Array) {
			return ((): any => {
				const result = [];
				for (const v of node) { 					result.push(_walkNode(v));
				}
				return result;
			})();

		} else if ((typeof node === "object") && _notDate(node)) {
			return ((): any => {
				const result1 = [];
				for (const k in node) {
					const v = node[k];
					if (k !== "reference") {
						result1.push(_walkNode(v));
					} else if (v) {
						result1.push((() => {
							const result2 = [];
							for (const sub of subs) {
								if (v && sub.from && 
							(v.toUpperCase() === sub.from.toUpperCase())) {
									if (sub.to) { node[k] = sub.to; }
									result2.push(count += 1);
								}
							}
							return result2;
						})());
					} else {
						result1.push(undefined);
					}
				}
				return result1;
			})();
		}
	};

	_walkNode(resource);
	return count;
};


export const countRefs = function(resources: SageSupportedFhirResource[], ref: string): number {
	let count = 0;
	for (const resource of resources) {
		const hasRefs = fixRefs(resource, [{from: ref}]);
		if (hasRefs !== 0) { count += 1; }
	}
	return count;
};


export const buildFredId = () => uuidv4();


export const findNextId = function(entries: (Bundle | BundleEntry)[]): number {
	let maxId = 1;
	for (const entry of entries) {
		const id = "resource" in entry ? entry.resource?.id : entry.id;
		if (id) {
			let matches;
			if ((matches = id.match(/^sage-(\d+)/i))) {
				maxId = Math.max(maxId, parseInt(matches[1])+1);
			}
		}
	}
	return maxId;
};


export const parseBundle = function(bundle: Bundle, clearInternalIds?: boolean): SageSupportedFhirResource[] {
	const idSubs = [];
	const resourceURIs = [];
	const state = State.get();
	if (!bundle.entry) {
		console.log("parseBundle called on empty bundle");
		return [];
	}
	let entryPos = findNextId(bundle.entry);
	for (const entry of bundle.entry) {
		if (entry.resource) {
			const resource = (entry.resource as SageSupportedFhirResource);
			if (((entry.fullUrl && /^urn:uuid:/.test(entry.fullUrl)) ||
				!entry.resource.id || clearInternalIds)) {
					const {
						resourceType
					} = resource;
					const fromId = resource.id || entry.fullUrl;
					const toId = buildFredId();
					resource.id = toId;
					idSubs.push({from: fromId, to: `${resourceType}/${toId}`});
					entryPos++;
				}
			// if a resource has a url, keep track of the url and type so that we may reference it in other resources
			if (resource.url) {
				resourceURIs.push({
					uri: resource.url,
					resourceType: resource.resourceType
				});
			}
		}
	}
	
	State.get().canonicalUris.append(resourceURIs);
	const resources = [];
	for (const entry of bundle.entry) {
		fixRefs(entry.resource as SageSupportedFhirResource, idSubs);
		resources.push(entry.resource as SageSupportedFhirResource);
	}
	return resources;
};


export const generateBundle = function(resources: (SageSupportedFhirResource | SageFreezerNode<SageSupportedFhirResource>)[], splicePos?: number | null, spliceData?: SageSupportedFhirResource | null): Bundle {
	if (resources == null) { resources = []; }
	if (splicePos && splicePos != null && spliceData && spliceData != null) {
		resources = resources.splice(splicePos, 1, spliceData);
	}

	const idSubs = [];
	const entries: BundleEntry[] = [];
	for (const resourceObj of resources) {
		let fullUrl: string;
		let request: BundleEntryRequest;
		let resource = resourceObj;
		if ("toJS" in resourceObj) { resource = resourceObj.toJS(); }
		if (resource.id && !/^[Ff][Rr][Ee][Dd]-\d+/.test(resource.id)) {
			fullUrl = `${resource.resourceType}/${resource.id}`;
			request = {method: "PUT", url: fullUrl};
		} else {
			fullUrl = `urn:uuid:${uuidv4()}`;
			request = {method: "POST", url: resource.resourceType};

			if (resource.id) {
				const fromId = `${resource.resourceType}/${resource.id}`;
				const toId = fullUrl;
				idSubs.push({from: fromId, to: toId});
				delete resource.id;
			}
		}

		entries.push({
			fullUrl,
			request,
			resource
		});
	}
	
	for (const entry of entries) {
		if (entry.resource) {
			fixRefs(entry.resource as SageSupportedFhirResource, idSubs);
		}
	} 
	
	const retBundle: Bundle = {
		resourceType: "Bundle",
		type: "transaction",
		meta: {
			lastUpdated: (new Date(Date.now())).toISOString(),
			source: "https://fred-ca431.web.app/"
		},
		entry: entries
	}
	return retBundle;
};



















