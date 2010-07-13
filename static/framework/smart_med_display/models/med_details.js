/**
 * @tag models, home
 * Wraps backend med services.  Enables 
 * [SmartMedDisplay.Models.Med.static.findAll retrieving],
 */
SmartMedDisplay.Models.rdfObject.
extend('SmartMedDisplay.Models.MedDetails',
/* @Static */
{
	getDetails : function(med) {
	
	var s = "<"+med.cui._string+"> "
	var r = med.Class.rdf
	 .where(s+ " ?p ?o");
	
	var ret = {};
	for (var i = 0; i < r.length; i++)
		ret[r[i].p.value._string] = r[i].o.value._string || r[i].o.value;
	
	var r = med.Class.rdf
			.where("<"+med.rdf.med.value+"> ?p ?o")
			.where("?o ?f_field ?f_detail");

	for (var i = 0; i < r.length; i++)
	{
		var field = r[i].f_field.value._string;
		var value = r[i].f_detail.type=="bnode"? "" : r[i].f_detail.value._string || r[i].f_detail.value
		ret[field] = value;
	}
	
	return ret;	
	}
},
/* @Prototype */
{	


});