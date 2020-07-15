	// file for jQuery functions

$(document).ready(function() {

	console.log("JS SCRIPT RUNNING");

	var socket = io();

	var emailDupe = false;
	var usernameDupe = false;
	var instagramDupe = false;

	var currentTab = 0;
	showTab(currentTab);

	function showTab(n) {
		$(".tab").hide();

		$(".tab:eq("+ n +")").show();
		$(".tab:eq("+ n +")").css("display", "block");

		if (n === 0) {
			$("#prevBtn").hide();
			$("#nextBtn").html("I Agree")
		} else {
			$("#prevBtn").show();
		}

		if (n === ($(".tab").length - 1)) {
			$("#nextBtn").html("Submit");
		} else {
			$("#nextBtn").html("Next");
		}

		fixStepIndicator(n);
	}

	function nextPrev(n) {
		$('#duplicateInstagram').remove();
		$('#duplicateEmail').remove();
		$('#duplicateUsername').remove();

		if (n===1 && !validateForm()) return false;

		console.log(emailDupe);
		console.log(usernameDupe);
		console.log(instagramDupe);

		if (emailDupe || usernameDupe) {
			$(".tab:eq("+currentTab+")").hide();
			currentTab = 0;
			showTab(currentTab);
			return false;
		} else if (instagramDupe) {
			$(".tab:eq("+currentTab+")").hide();
			currentTab = 1;
			showTab(currentTab);
			return false;
		}

		$(".tab:eq("+currentTab+")").hide();
		currentTab += n;
		if (currentTab >= $(".tab").length) {
			$('.custom:checked').each(function() {
				$(this).val($(this).siblings('.custom_text').val());
			});
			$("#main").submit();
			return false;
		}

		showTab(currentTab);
	}

	function validateForm() {
		var valid = true;
		//var reqInputs = $(".tab:eq("+currentTab+")").find(".required");

		$('#pwd-notMatched').remove();
		$('#notRead').remove();

		$(".tab:eq("+currentTab+")").find(".required").each(function(idx) {
			if ($(this).is(':checkbox')) {
				if (!($(this).is(':checked'))){
					valid = false;
					$(".tab:eq("+currentTab+")").append('<p id="notRead">Please agree to terms and conditions!</p>');
					$('#notRead').css('color', 'red');
				}

			} else if ($(this).val() === "") {
				valid = false;
				$(this).css('border-color', 'red');
			} else {
				$(this).css('border-color', 'inherit');
			}
		});

		// validate password equality on second tab
		if (currentTab === 1) {
			if ($('#pwd').val() !== $('#confirm').val()) {
				valid = false;
				$('#pwd').css('border-color', 'red');
				$('#confirm').css('border-color','red');
				$(".tab:eq("+currentTab+")").append('<p id="pwd-notMatched">Passwords do not match!</p>');
				$('#pwd-notMatched').css('color', 'red');
			}

			// check if username and email already exist
			socket.emit('checkDuplicates', {'email': $('#email').val(), 'username': $('#username').val()});
		}

		// check if instagram already exists
		if (currentTab === 2) {
			socket.emit('checkDuplicates', {'instagram': $('#instagram').val()});
		}

		return valid;
	}

	function fixStepIndicator(n) {
		for (var i = 0; i < $(".step").length; i++) {
			$(".step:eq("+i+")").attr("class", "step");
		}
		$(".step:eq("+i+")").attr("class", "step active");
	}

	$("#prevBtn").click(function() {
		nextPrev(-1);
	});

	$("#nextBtn").click(function() {
		nextPrev(1);
	})


	// dynamically add dates to select
	for (var i = new Date().getFullYear(); i > 1900; i--) {
		$("#select_year").append($("<option></option>").attr("value",i).text(i.toString()));
	}


	// controller for selecting state in USA
	$("#select_country").change(function() {
		if ($("#select_country").val() == "USA") {
			$("#state_div").show();
		} else {
			$('#select_state option')[0].selected = true;
			$("#state_div").hide();
		}
	});


	// verification of instagram username
	$("#instagram").blur(function() {
		var req = new XMLHttpRequest();
		req.open('GET', 'http://www.instagram.com/' + $("#instagram").val() + '/', false);
		req.send(null);
		if (req.status == 404) {
			$("#instagram_message").remove();
			$(this).css("border-color", "red");
			$(this).focus();
			$(this).after("<div id='instagram_message'>Please enter valid enter Instagram handle!</div>");
			$("#instagram_message").css("color", "red");
		} else {
			$("#instagram_message").remove();
			$(this).css("border-color", "inherit");
		}
	});


	// add tag to interests when selecting from data list
	/*$("#interests").on('change', 'input', function(){
	    var options = $('#interests_datalist')[0].options;
	    for (var i=0;i<options.length;i++){
	    	if (options[i].value == $(this).val()) {
	    		var li = $('<li>' + interest + '<span class="close">x</span></li>');
				$("#interests_list").append(li);
	    	}
	    }
	});*/

	// add tag to interests when user presses enter
	$('#interests').bind('keydown', function(e) {
		// clear error message if start typing
		$('#interests_message').remove();

		// only do something if user pressed enter when not selecting from datalist
		if (e.keyCode==13) {
			var interest = $(this).val();
			if (interest != '') {
				// prevent from submitting form
				e.preventDefault();

				// check to see if already entered interest
				var exists = false;
				for (let li of $("#interests_list li")) {
					var liTxt = $(li).clone().children().remove().end().text();
					if (interest + ' ' === liTxt) {
						exists = true;
					}
				}

				// if new interest, add to list
				if (!exists) {
					var li = $('<li>' + interest + ' <span class="close">[X]</span></li>');
					$("#interests_list").append(li);
					$(this).val('');
					// insert interest as hidden input with list attribute
					$("#interests_list").after('<input type="hidden" id="entry_interest" name="entry_interests[]" value="' + interest + '">');

				// otherwise, show message
				} else {
					$(this).after('<div id="interests_message">Interest already added!</div>');
					$("#interests_message").css("color", "red");
					$(this).val('');
				}
				
			}
		}
	});

	// add language to list when user selects language
	$("#select_language").change(function() {
		var language = $(this).val();
		var exists = false;
		for (let li of $("#language_list li")) {
			var liTxt = $(li).clone().children().remove().end().text();
			if (language + ' ' === liTxt) {
				exists = true;
			}
		}

		if (!exists) {
			var li = $('<li>' + language + ' <span class="close">[X]</span></li>');
			$('#language_list').append(li);
			//$(this).val('');

			$('#language_list').after('<input type="hidden" id="entry_language" name="entry_lanuage[]" value="' + language + '">');
		} else {
			//$(this).val('');
		}
	});

	// allow for x "buttons" to close the parent element
	$(".variable_list").delegate(".close", "click", function() {
		// remove hidden input with corresponding value
		var liTxt = $(this).parent().clone().children().remove().end().text();
		$('#entry_interest[value="' + liTxt + '"]').remove();
		// remove li item
		$(this).parent().remove();
	});

	$("#email").on('input', function() {
		$('#duplicateEmail').remove();
	});

	$('#username').on('input', function() {
		$('#duplicateUsername').remove();
	});

	$('#instagram').on('input', function() {
		$('#duplicateInstagram').remove();
	});




	socket.on('checkedDuplicates', function(d) {
		console.log('CHECKED DUPES');
		console.log(d);
		if (d['duplicates'].includes('email') || d['duplicates'].includes('username')) {
			if (d['duplicates'].includes('email')) {
				emailDupe = true;
				$('#email').after('<div id="duplicateEmail"><p>This email is already being used!</p></div>')
			} else {
				emailDupe = false;
			}
			if (d['duplicates'].includes('username')) {
				usernameDupe = true;
				$('#username').after('<div id="duplicateUsername"><p>This username already exists!</p></div>')
			} else {
				usernameDupe = false;
			}
		} else if (d['duplicates'].includes('instagram')) {
			instagramDupe = true;
			$('#instagram').after('<div id="duplicateInstagram"><p>This Instagram handle is already being used!</p></div>')
		} else {
			instagramDupe = false;
			emailDupe = false;
			usernameDupe = false;
		}

		if (emailDupe || usernameDupe) {
			console.log("AKSDFAKRHJKAJEFKAS");
			$(".tab:eq("+currentTab+")").hide();
			currentTab = 1;
			showTab(currentTab);
		} else if (instagramDupe) {
			$(".tab:eq("+currentTab+")").hide();
			currentTab = 2;
			showTab(currentTab);
		}
	});	

});

/*
	$.widget( "custom.combobox", {
    	_create: function() {
    		this.wrapper = $( "<span>" )
        		.addClass( "custom-combobox" )
        		.insertAfter( this.element );
 
	    	this.element.hide();
	    	this._createAutocomplete();
	    	this._createShowAllButton();
    	},
 
    	_createAutocomplete: function() {
        	var selected = this.element.children( ":selected" ),
        		value = selected.val() ? selected.text() : "";
 
	        this.input = $( "<input>" )
	        	.appendTo( this.wrapper )
	          	.val( value )
	          	.attr( "title", "" )
	          	.addClass( "custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left" )
	          	.autocomplete({
		            delay: 0,
		            minLength: 0,
		            source: $.proxy( this, "_source" )
		        })
		        .tooltip({
	            	classes: {
	              	"ui-tooltip": "ui-state-highlight"
	            	}
	          	});
	 
	        this._on( this.input, {
	        	autocompleteselect: function( event, ui ) {
	            	ui.item.option.selected = true;
	            	this._trigger( "select", event, {
	              		item: ui.item.option
	            	});
        		},
 
          		autocompletechange: "_removeIfInvalid"
        	});
    	},
 
    	_createShowAllButton: function() {
        	var input = this.input,
          		wasOpen = false;
 
        	$( "<a>" )
          		.attr( "tabIndex", -1 )
	          	.attr( "title", "Show All Items" )
	          	.tooltip()
	          	.appendTo( this.wrapper )
	          	.button({
            		icons: {
              		primary: "ui-icon-triangle-1-s"
            		},
            		text: false
          		})
          		.removeClass( "ui-corner-all" )
          		.addClass( "custom-combobox-toggle ui-corner-right" )
          		.on( "mousedown", function() {
            		wasOpen = input.autocomplete( "widget" ).is( ":visible" );
          		})
          		.on( "click", function() {
            		input.trigger( "focus" );
 
            		// Close if already visible
            		if ( wasOpen ) {
            			return;
            		}
 
            		// Pass empty string as value to search for, displaying all results
            		input.autocomplete( "search", "" );
          		});
      	},
 
      	_source: function( request, response ) {
        	var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
        	response( this.element.children( "option" ).map(function() {
          		var text = $( this ).text();
          		if ( this.value && ( !request.term || matcher.test(text) ) )
            		return {
              			label: text,
              			value: text,
              			option: this
            		};
        		}) );
      	},
 
      	_removeIfInvalid: function( event, ui ) {
 
        	// Selected an item, nothing to do
        	if ( ui.item ) {
          		return;
        	}
 
        	// Search for a match (case-insensitive)
        	var value = this.input.val(),
          		valueLowerCase = value.toLowerCase(),
          		valid = false;
        	this.element.children( "option" ).each(function() {
          		if ( $( this ).text().toLowerCase() === valueLowerCase ) {
            		this.selected = valid = true;
            		return false;
          		}
        	});
 
        	// Found a match, nothing to do
        	if ( valid ) {
          		return;
        	}	
 
        	// Remove invalid value
        	this.input
          		.val( "" )
          		.attr( "title", value + " didn't match any item" )
          		.tooltip( "open" );
        	this.element.val( "" );
        	this._delay(function() {
          		this.input.tooltip( "close" ).attr( "title", "" );
        	}, 2500 );
        	this.input.autocomplete( "instance" ).term = "";
      	},
 
      	_destroy: function() {
        	this.wrapper.remove();
        	this.element.show();
      	}
    });

	*/