// JQuery script for profiles + editing

$(document).ready(function() {

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
					$("#interests_list").after('<input type="hidden" id="option_interest" name="option_interest[]" value="' + interest + '">');

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
		console.log(language);
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
			$(this).val('');

			$('#language_list').after('<input type="hidden" id="option_language" name="option_language[]" value="' + language + '">');
		} else {
			$(this).val('');
		}
	});

	// allow for x "buttons" to close the parent element
	$(".variable_list").delegate(".close", "click", function() {
		// remove hidden input with corresponding value
		var liTxt = $(this).parent().clone().children().remove().end().text();
		liTxt = liTxt.substring(0, liTxt.length-1);
		console.log(liTxt);
		if (this.id == "language_list") {
			$('#option_language[value="' + liTxt + '"]').remove();	
		} else { // this is interest list
			$('#option_interest[value="' + liTxt + '"]').remove();
		}
		// remove li item
		$(this).parent().remove();
		console.log($(this).parent().length);
	});

	$("#cancelButton").click(function(e) {
		e.preventDefault();
		$("#confirmationDialog").dialog('open');
	})

	$('#closeBtn').click(function() {
		$('#confirmationDialog').dialog('close');
	});

	$('#confirmBtn').click(function() {
		window.history.replaceState({}, document.title, '/profile');
		location.reload();
	})

	// dialog css stuff, can be replaced in future css styles file
	$('#confirmationDialog').css('position', 'absolute');
	$("#confirmationDialog").css('z-index', 9999);
	$('#confirmationDialog').css('background-color', 'white');
	$('#confirmationDialog').css('border-style', 'outset');

	$("#confirmationDialog").dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		show: false,
		draggable: false,
		open: function(event, ui) {
        	$(".ui-dialog-titlebar-close", ui.dialog || ui).hide();
    	}
	});

});