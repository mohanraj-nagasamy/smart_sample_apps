/*
 * SMART API client
 * Josh Mandel
 * Ben Adida
 */

var SMART_CLIENT = function(smart_server_origin, frame) {
    var debug = false;
    var _this = this;
    var sc = this;
    
    this.message_receivers = {};

    var procureChannel = function(event){
	var app_instance_uuid = event.data.match(/^"app_instance_uuid=(.*)"$/);
	if (!app_instance_uuid) return;

	if (window.removeEventListener) window.removeEventListener('message', procureChannel, false);
	else if(window.detachEvent) window.detachEvent('onmessage', procureChannel);

	app_instance_uuid = app_instance_uuid[1];
	sc.bind_channel(app_instance_uuid);
    };

    if (window.addEventListener) window.addEventListener('message', procureChannel, false);
    else if(window.attachEvent) window.attachEvent('onmessage', procureChannel);
    window.parent.postMessage('"procure_channel"', "*");

    this.is_ready = false;
    this.ready = function(callback) {
	this.ready_callback = callback;
	if (this.is_ready) this.ready_callback();
    };

    this.callback = function(f) {
	var _this = this;
	return function() {return f.apply(_this, arguments);};
    },

    this.bind_channel = function(scope) {
	this.channel = Channel.build({window: frame, origin: "*", scope: scope, debugOutput: debug});
	
	this.channel.bind("foreground", this.callback(function() {
	    if (this.message_receivers.foreground !== undefined)
		this.message_receivers.foreground();
	}));
	
	this.channel.bind("background", this.callback(function() {
	    if (this.message_receivers.background !== undefined)
		this.message_receivers.background();
	}));
	
	this.channel.bind("destroy", this.callback(function() {
	    if (this.message_receivers.destroy !== undefined)
		this.message_receivers.destroy();
	}));

	this.channel.bind("ready", function(trans, message) {
	    sc.received_setup(message);
	});

    };

    this.received_setup = function(message) {
	
	this.context = message.context;
	this.uuid = message.uuid;
	
	this.user = message.context.user;
	this.record = message.context.record;
	
	this.credentials = message.credentials;
	this.ready_data = message.ready_data;
	
 	this.is_ready = true;
	if (this.ready_callback) this.ready_callback();
	
    };

	this.api_call = function(options, callback) {
	    this.channel.call({method: "api_call",
			       params: 
			{
			'func' : options.url,
			'method' : options.method,
			'params' : options.data,
			'contentType' : options.contentType || "application/x-www-form-urlencoded"
			},
			success: function(r) { callback(r.contentType, r.data); }
		});
	};

	this.start_activity = function(activity_name, app_id, ready_data, callback) {
		if (arguments.length < 4) {
			return this.start_activity(activity_name, null,  app_id, ready_data);
		}

		this.channel.call({method: "start_activity",
			       params: {
			'name' : activity_name,
			'app' : app_id,
			'ready_data': ready_data
			},
				   success: function(r){callback(r.contentType, r.data)}
		});
	};

	
	this.end_activity = function(response, callback) {
	    this.channel.call({method: "end_activity",
			       params: {
			'response': response
		    },
			       success: callback||function(){}
		});
	};

	this.restart_activity = function(callback) {
	    this.channel.call({method: "restart_activity", params: {}, success: callback||function(){}});
	};
}

SMART_CLIENT.prototype.ONTOLOGY_get = function(callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/ontology",
		data : {}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};

SMART_CLIENT.prototype.FULFILLMENTS_get = function(callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/records/" + _this.record.id + "/fulfillments/",
		data : {}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});

};

SMART_CLIENT.prototype.LAB_RESULTS_get = function(callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/records/" + _this.record.id + "/lab_results/",
		data : {}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});

};

SMART_CLIENT.prototype.VITAL_SIGNS_get = function(callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/records/" + _this.record.id + "/vital_signs/",
		data : {}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};

SMART_CLIENT.prototype.DEMOGRAPHICS_get = function(callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/records/" + _this.record.id + "/demographics",
		data : {}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});

};

	

SMART_CLIENT.prototype.MEDS_get = function(callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/records/" + _this.record.id + "/medications/",
		data : {}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});

};

SMART_CLIENT.prototype.MEDS_get_all = SMART_CLIENT.prototype.MEDS_get;

SMART_CLIENT.prototype.MEDS_post = function(data, callback) {
	var _this = this;
	this.api_call( {
		method : 'POST',
		url : "/records/" + _this.record.id + "/medications/",
		contentType : 'application/rdf+xml',
		data : data
	}, function(contentType, data) {
		callback(data);
	});
};

SMART_CLIENT.prototype.MEDS_delete = function(callback) {
	var _this = this;
	this.api_call( {
		method : 'DELETE',
		url : "/records/" + _this.record.id + "/medications/",
		data : {}
	}, function(contentType, data) {
		callback(data);
	});
};

SMART_CLIENT.prototype.MED_delete = function(uri, callback) {
	var _this = this;
	this.api_call( {
		method : 'DELETE',
		url : uri,
		data : {}
	}, function(contentType, data) {
		callback(data);
	});
};

SMART_CLIENT.prototype.MED_put = function(data, external_id, callback) {
	var _this = this;
	this.api_call( {
		method : 'PUT',
		url : "/records/" + _this.record.id + "/medications/external_id/"
				+ external_id,
		contentType : 'application/rdf+xml',
		data : data
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});

};

SMART_CLIENT.prototype.PROBLEMS_get = function(callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/records/" + _this.record.id + "/problems/",
		data : {}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};

SMART_CLIENT.prototype.PROBLEMS_post = function(data, callback) {
	var _this = this;
	this.api_call( {
		method : 'POST',
		url : "/records/" + _this.record.id + "/problems/",
		contentType : 'application/rdf+xml',
		data : data
	}, function(contentType, data) {
		callback(data);
	});
};

SMART_CLIENT.prototype.PROBLEMS_delete = function(problem_uri, callback) {
	var _this = this;

	this.api_call( {
		method : 'DELETE',
		url : problem_uri,
		data : {}
	}, function(contentType, data) {
		callback(data);
	});
};

SMART_CLIENT.prototype.PROBLEM_put = function(data, external_id, callback) {
	var _this = this;
	this.api_call( {
		method : 'PUT',
		url : "/records/" + _this.record.id + "/problems/external_id/"
				+ external_id,
		contentType : 'application/rdf+xml',
		data : data
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};

SMART_CLIENT.prototype.NOTES_get = function(callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/records/" + _this.record.id + "/notes/",
		data : {}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};

SMART_CLIENT.prototype.NOTES_post = function(data, callback) {
	var _this = this;
	this.api_call( {
		method : 'POST',
		url : "/records/" + _this.record.id + "/notes/",
		contentType : 'application/rdf+xml',
		data : data
	}, function(contentType, data) {
		callback(data);
	});
};

SMART_CLIENT.prototype.NOTES_delete = function(note_uri, callback) {
	var _this = this;

	this.api_call( {
		method : 'DELETE',
		url : note_uri,
		data : {}
	}, function(contentType, data) {
		callback(data);
	});
};

SMART_CLIENT.prototype.NOTE_put = function(data, external_id, callback) {
	var _this = this;
	this.api_call( {
		method : 'PUT',
		url : "/records/" + _this.record.id + "/notes/external_id/"
				+ external_id,
		contentType : 'application/rdf+xml',
		data : data
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};


SMART_CLIENT.prototype.ALLERGIES_get = function(callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/records/" + _this.record.id + "/allergies/",
		data : {}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};

SMART_CLIENT.prototype.ALLERGIES_post = function(data, callback) {
	var _this = this;
	this.api_call( {
		method : 'POST',
		url : "/records/" + _this.record.id + "/allergies/",
		contentType : 'application/rdf+xml',
		data : data
	}, function(contentType, data) {
		callback(data);
	});
};

SMART_CLIENT.prototype.ALLERGIES_delete = function(allergy_uri, callback) {
	var _this = this;

	this.api_call( {
		method : 'DELETE',
		url : allergy_uri,
		data : {}
	}, function(contentType, data) {
		callback(data);
	});
};

SMART_CLIENT.prototype.ALLERGY_put = function(data, external_id, callback) {
	var _this = this;
	this.api_call( {
		method : 'PUT',
		url : "/records/" + _this.record.id + "/allergies/external_id/"
				+ external_id,
		contentType : 'application/rdf+xml',
		data : data
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};



SMART_CLIENT.prototype.CODING_SYSTEM_get = function(system, query, callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/codes/systems/" + system + "/query",
		data : {
			q : query
		}
	}, function(contentType, data) {
		var js = JSON.parse(data);
		callback(js);
	});
}

SMART_CLIENT.prototype.SPL_get = function(query, callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/spl/for_rxnorm/" + query,
		data : {}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};


SMART_CLIENT.prototype.webhook_post = function(webhook_name, data, callback) {
	var _this = this;
	this.api_call( {
		method : 'POST',
		contentType : 'application/rdf+xml',
		url : "/webhook/"+webhook_name,
		data : data
		}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};


SMART_CLIENT.prototype.webhook_get = function(webhook_name, data, callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/webhook/"+webhook_name,
		data : data
		}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};

SMART_CLIENT.prototype.webhook = SMART_CLIENT.prototype.webhook_get;

SMART_CLIENT.prototype.CAPABILITIES_get = function(callback) {
	var _this = this;
	this
			.api_call(
					{
						method : 'GET',
						url : "/capabilities/",
						data : {}
					},
					function(contentType, data) {
						var rdf = _this.process_rdf(contentType, data);
						cs = rdf
								.where(
										"?platform  rdf:type  sp:Container")
								.where(
										"?platform   sp:capability ?cap");

						_this.capabilities = {}
						for ( var i = 0; i < cs.length; i++) {
							_this.capabilities[cs[i].cap.value._string] = true;
						}

						callback(rdf);
					});
}

SMART_CLIENT.prototype.AUTOCOMPLETE_RESOLVER = function(system) {
	var _this = this;
	var source = function(request, response) {
		_this.CODING_SYSTEM_get(system, request.term, function(json) {
			response(jQuery.map(json, function(item) {
				return {
					label : item.full_value,
					value : item.code
				};
			}));
		})
	};

	return source;
}

SMART_CLIENT.prototype.SPARQL = function(query, callback) {
	var _this = this;
	this.api_call( {
		method : 'GET',
		url : "/records/" + _this.record.id + "/sparql",
		data : {
			q : query
		}
	}, function(contentType, data) {
		var rdf = _this.process_rdf(contentType, data);
		callback(rdf);
	});
};

SMART_CLIENT.prototype.createXMLDocument = function(string) {
    var parser, xmlDoc;
    if (window.DOMParser)
	{
	    parser = new DOMParser();
	    xmlDoc = parser.parseFromString(string, 'text/xml');
	}
    else
	{
	    xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
	    xmlDoc.async = 'false';
	    xmlDoc.loadXML(string);
	}
    return xmlDoc;
};

SMART_CLIENT.prototype.node_name = function(node) {
	node = node.value;
    if (node._string !== undefined)
    { node = "<"+node._string+">";}
    return node;
};


SMART_CLIENT.prototype.process_rdf = function(contentType, data) {

	// Get the triples into jquery.rdf
	var d = this.createXMLDocument(data);

	var rdf = jQuery.rdf();
	rdf.base("");

		rdf.load(d, {});
		// Load all the namespaces from the xml+rdf into jquery.rdf
	var r = d.childNodes[0];
	if (r.nodeName !== "RDF" && r.nodeName !== "rdf:RDF")
	    r = d.childNodes[1];
        if (r.attributes === null)
            r = d.childNodes[1];

	
	for ( var i = 0; i < r.attributes.length; i++) {
	    a = r.attributes[i];
	    try {
		var match = /xmlns:(.*)/i.exec(a.nodeName);
		if (match.length == 2) {
		    rdf.prefix(match[1], a.nodeValue);
		}
	    } catch (err) {}
	}

	rdf.prefix("sp", "http://smartplatforms.org/terms#");
	rdf.prefix("dc","http://purl.org/dc/elements/1.1/");
	rdf.prefix("dcterms", "http://purl.org/dc/terms/");

	// abstract method to instantiate a list of objects from the rdf store.
	rdf.source_xml = data;
	return rdf;
}


SMART = new SMART_CLIENT(null, window.parent);
SMART.message_receivers = {};