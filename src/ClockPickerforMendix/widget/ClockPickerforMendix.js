/*global logger*/
/*
    ClockPickerforMendix
    ========================

    @file      : ClockPickerforMendix.js
    @version   : 1.0.4
    @author    : Iain Lindsay
    @date      : 2017-02-08
    @copyright : AuraQ Limited 2017
    @license   : Apache V2

    Documentation
    ========================
    Clockpicker widget built using http://weareoutman.github.io/clockpicker/.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define( [
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "ClockPickerforMendix/lib/jquery-1.11.2",
    "ClockPickerforMendix/lib/bootstrap",
    "ClockPickerforMendix/lib/bootstrap-clockpicker",
    "dojo/text!ClockPickerforMendix/widget/template/ClockPickerforMendix.html"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoEvent, 
    _jQuery, _bootstrap, _bootstrapClockpicker, widgetTemplate) {
    "use strict";

    var $ = _jQuery.noConflict(true);
    $ = _bootstrap.createInstance($);
    $ = _bootstrapClockpicker.createInstance($);

    // Declare widget's prototype.
    return declare("ClockPickerforMendix.widget.ClockPickerforMendix", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Parameters configured in the Modeler.
        _$inputGroup: null, 
        _$input: null,  
        _dateAttribute:"",   
        _isTwelveHour : false,

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _$alertDiv: null,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function() {
            // Uncomment the following line to enable debug messages
            //logger.level(logger.DEBUG);
            logger.debug(this.id + ".constructor");
            this._handles = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            
            this._dateAttribute = this.dateAttribute;
            this._isTwelveHour = this.timeformat === 'twelve' ? true : false;
            
            // make sure we only select the control for the current id or we'll overwrite previous instances
            var groupSelector = '#' + this.id + ' .clockpicker';
            this._$inputGroup = $(groupSelector); 
            
            var inputSelector = '#' + this.id + ' input.mxClockPicker';
            this._$input = $(inputSelector); 
            
            
            // adjust the template based on the display settings.
            if( this.showLabel ) {
                if(this.formOrientation === "horizontal"){
                    // width needs to be between 1 and 11
                    var comboLabelWidth = this.labelWidth < 1 ? 1 : this.labelWidth;
                    comboLabelWidth = this.labelWidth > 11 ? 11 : this.labelWidth;
                    
                    var comboControlWidth = 12 - comboLabelWidth,                    
                        comboLabelClass = 'col-sm-' + comboLabelWidth,
                        comboControlClass = 'col-sm-' + comboControlWidth;
                    
                    dojoClass.add(this.mxClockPickerLabel, comboLabelClass);
                    dojoClass.add(this.mxClockPickerInputGroupContainer, comboControlClass);
                }

                this.mxClockPickerLabel.innerHTML = this.fieldCaption;
            }
            else {
                dojoClass.remove(this.mxClockPickerMainContainer, "form-group");
                dojoConstruct.destroy(this.mxClockPickerLabel);
            } 
            
            this._updateRendering();
            this._setupEvents();
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            var self = this;
            
            if (obj === null) {
                if (!dojoClass.contains(this.domNode, 'hidden')) {
                    dojoClass.add(this.domNode, 'hidden');
                }
            } else {
                if (dojoClass.contains(this.domNode, 'hidden')) {
                    dojoClass.remove(this.domNode, 'hidden');
                }
                                                              
                

                this._$inputGroup.clockpicker({
                    autoclose: this.autoClose,
                    donetext: this.doneText,
                    twelvehour : this._isTwelveHour,
                    readonly: true, // make the input element readonly to prevent garbage being manually entered (must use the picker!)
                    onChange : function(element){
                        self._clearValidations();
                        
                        if( element ){
                            var timestamp = self._getTimestampFromSelectedValue( element.hours, element.minutes, element.amOrPm);
                            self._contextObj.set(self.dateAttribute, timestamp);    
                        }
                                                                                                               
                        // run the OC microflow if one has been configured.
                        if( self.onChangeMicroflow ) {
                            self._execMf(self._contextObj.getGuid(), self.onChangeMicroflow);
                        }
                    }
                });
                                
                this._contextObj = obj;
                this._resetSubscriptions();
                this._updateRendering();
            }

            callback();
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function() {
          logger.debug(this.id + ".enable");
        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function() {
          logger.debug(this.id + ".disable");
        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function(box) {
          logger.debug(this.id + ".resize");
        },
 
        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function() {
          logger.debug(this.id + ".uninitialize");
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

        // We want to stop events on a mobile device
        _stopBubblingEventOnMobile: function(e) {
            logger.debug(this.id + "._stopBubblingEventOnMobile");
            if (typeof document.ontouchstart !== "undefined") {
                dojoEvent.stop(e);
            }
        },

        // Attach events to HTML dom elements
        _setupEvents: function() {
            logger.debug(this.id + "._setupEvents");            
        },

        // Rerender the interface.
        _updateRendering: function() {
            logger.debug(this.id + "._updateRendering");
            
            if( this._contextObj ){
                var currentDate = this._contextObj.get(this._dateAttribute);
                var currentValue = '';
                if(currentDate){
                    currentValue = this._getTimeFromTimestamp(currentDate);                                        
                }
                
                this._$input.val(currentValue);
            }
            
            // Important to clear all validations!
            this._clearValidations();
        },

        // Handle validations.
        _handleValidation: function(validations) {
            logger.debug(this.id + "._handleValidation");
            this._clearValidations();

            var validation = validations[0],
                message = validation.getReasonByAttribute(this._dateAttribute);

            if (this.readOnly) {
                validation.removeAttribute(this._dateAttribute);
            } else if (message) {
                this._addValidation(message);
                validation.removeAttribute(this._dateAttribute);
            }
        },

        // Clear validations.
        _clearValidations: function() {
            logger.debug(this.id + "._clearValidations");
            if( this._$alertdiv ) {
                this._$inputGroup.parent().removeClass('has-error');
                this._$alertdiv.remove();
            }
        },

        // Show an error message.
        _showError: function(message) {
            logger.debug(this.id + "._showError");
            if (this._alertDiv !== null) {
                dojoHtml.set(this._alertDiv, message);
                return true;
            }
            this._alertDiv = dojoConstruct.create("div", {
                "class": "alert alert-danger",
                "innerHTML": message
            });
            dojoConstruct.place(this.domNode, this._alertDiv);
        },

        // Add a validation.
        _addValidation: function(message) {
            logger.debug(this.id + "._addValidation");
            this._$alertdiv = $("<div></div>").addClass('alert alert-danger mx-validation-message').html(message);
            this._$inputGroup.parent().addClass('has-error').append( this._$alertdiv );  
        },

        // Reset subscriptions.
        _resetSubscriptions: function() {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            if (this._handles) {
                dojoArray.forEach(this._handles, function (handle) {
                    mx.data.unsubscribe(handle);
                });
                this._handles = [];
            }

            // When a mendix object exists create subscriptions.
            if (this._contextObj) {
                var objectHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: dojoLang.hitch(this, function(guid) {
                        this._updateRendering();
                    })
                });

                var attrHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this._dateAttribute,
                    callback: dojoLang.hitch(this, function(guid, attr, attrValue) {
                        this._updateRendering();
                    })
                });

                var validationHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: dojoLang.hitch(this, this._handleValidation)
                });

                this._handles = [ objectHandle, attrHandle, validationHandle ];
            }
        },                
        
        /* CUSTOM FUNCTIONS START HERE */
        // we only have a limited amount of datetime parsing so avoiding libraries like momentjs to keep the widget size down
        _getTimeFromTimestamp : function(timestamp){
            if( !timestamp){
                return '';
            }
            
            var d = new Date(timestamp); 
            var hours = d.getHours();
            var minutes = d.getMinutes();
            var ampm = '';
            
            if( this._isTwelveHour ){
                ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12;
            }
            
            var datestring = ( this._isTwelveHour ? hours: ("0" + hours).slice(-2) ) + ":" + ("0" + minutes).slice(-2) + ampm;
            
            return datestring;
        },
        
        // we only have a limited amount of datetime parsing so avoiding libraries like momentjs to keep the widget size down
        _getTimestampFromSelectedValue : function( hours, mins, amOrPm ){
            var self = this;
            var timestamp = '';
            var d;
            
            var currentTimestamp = self._contextObj.get(self.dateAttribute);
            
            if( currentTimestamp ){
                d = new Date(currentTimestamp);
            }
            else{
                d = new Date(); // get current date if no existing value
            }
            
            try{ 
                if( amOrPm && amOrPm.toLowerCase() === 'pm' && hours < 12){
                    hours = hours + 12;
                }

                if( amOrPm && amOrPm.toLowerCase() === 'am' && hours == 12){
                    hours = hours - 12;
                }              
                
                d.setHours(parseInt(hours));
                d.setMinutes(parseInt(mins));
                d.setSeconds(0);
                
                timestamp = d.getTime().toString();                
            }
            catch(ex){
                logger.error("Failed to parse selected time : " + ex.message);
            }
            
            
            return timestamp;
        },
        
        _execMf: function (guid, mf, cb) {
            if (guid && mf) {
                mx.data.action({
                    params: {
                        applyto: 'selection',
                        actionname: mf,
                        guids: [guid]
                    },
                    callback: function () {
                        if (cb) {
                            cb();
                        }
                    },
                    error: function (e) {
                        console.error('Error running Microflow: ' + e);
                    }
                }, this);
            }

        }
        /* CUSTOM FUNCTIONS END HERE */
    });
});
    
require(["ClockPickerforMendix/widget/ClockPickerforMendix"], function() {
    "use strict";
});
