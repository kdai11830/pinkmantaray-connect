// JQuery script for profiles + editing

$(document).ready(function() {

	var bannedWords = [
		"ass",
		"asshole",
		"bikinibody",
		"bitch",
		"boho",
		"curvygirls",
		"date",
		"dating",
		"dm",
		"graffitiigers",
		"humpday",
		"killingit",
		"kill",
		"killing",
		"kissing",
		"kiss",
		"kiser",
		"master",
		"motherfucker",
		"nasty",
		"nigger",
		"nigga",
		"petite",
		"porn",
		"pornhub",
		"shit",
		"shower",
		"single",
		"thot",
		"undies",
		"underwear",
		"vagina",
		"vag",
		"cunt",
		"dick",
		"penis",
		"bulge",
		"fag",
		"faggot",
		"fuck",
		"fucker",
		"fucking",
		"fucked",
		"twink",
		"hunk",
		"daddy",
		"daddies",
		"zaddy",
		"zaddies",
		"pussy",
		"pussies",
		"twat",
		"whore",
		"bastard",
		"cock",
		"retard",
		"retarded",
		"schizo"];

	// add language to list when user selects language
	// $("#select_language").change(function() {
	// 	var language = $(this).val();
	// 	console.log(language);
	// 	var exists = false;
	// 	for (let li of $("#language_list li")) {
	// 		var liTxt = $(li).clone().children().remove().end().text();
	// 		if (language + ' ' === liTxt) {
	// 			exists = true;
	// 		}
	// 	}

	// 	if (!exists) {
	// 		var li = $("<li>" + language + ' <span class="close">×</span></li>');
	// 		$('#language_list').append(li);
	// 		$(this).val('');

	// 		$('#language_list').after('<input type="hidden" id="option_language" name="option_language[]" value="' + language + '">');
	// 	} else {
	// 		$(this).val('');
	// 	}
	// });

	// allow for x "buttons" to close the parent element
	$(".variable_list").delegate(".close", "click", function() {
		// remove hidden input with corresponding value
		var liTxt = $(this).parent().clone().children().remove().end().text();
		var listID = $(this).parent().parent().siblings('input').attr('id');
		$('#option_'+listID+'[value="' + liTxt + '"]').remove();	
		// remove li item
		$(this).parent().remove();
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


	$('.restrict_select').bind('keydown', function(e) {
		if (e.keyCode==13) {
			var value = $(this).val();
			if (value != '') {
				e.preventDefault();
				var exists = false;
				var self = $(this);
				$(this).siblings('.select_list').children().each(function() {
					if ($(this).val().toLowerCase() === value.toLowerCase()) {
						exists = true;
						self.val($(this).val());
					}
				});
				if (!exists) {
					e.stopImmediatePropagation();
					return;
				}
			}
		}
	});

	$('.list_input').bind('input', function(e) {
		var isInputEvent = (Object.prototype.toString.call(e.originalEvent).indexOf("InputEvent") > -1);

		if (!isInputEvent) {
			var value = $(this).val();
			if (value != '') {
				var datatype = $(this).attr('id');

				// check to see if already entered interest
				var exists = false;
				for (let li of $(this).siblings('.variable_list').children('li')) {
					var liTxt = $(li).clone().children().remove().end().text();
					if (value === liTxt) {
						exists = true;
					}
				}

				// if new interest, add to list
				if (!exists) {
					var li = $("<li>" + value + '<span class="close"> ×</span></li>');
					$(this).siblings('.variable_list').append(li);
					$(this).val('');
					// insert interest as hidden input with list attribute
					$(this).siblings('.variable_list').after('<input type="hidden" id="option_'+datatype+'" name="option_'+datatype+'[]" value="'+value+'">');

				// otherwise, reset field
				} else {
					$(this).val('');
				}
			}
		}
	});


	$('.list_input').bind('keydown', function(e) {
		// clear error message if start typing
		$(this).siblings('.duplicate_msg').remove();
		$(this).siblings('#bannedWordMsg').remove();

		var datatype = $(this).attr('id');

		// only do something if user pressed enter when not selecting from datalist
		if (e.keyCode==13) {
			var value = $(this).val();
			if (value != '') {
				// prevent from submitting form
				e.preventDefault();

				// replace with capitalized version if exists
				var self = $(this);
				$(this).siblings('.select_list').children().each(function() {
					if ($(this).val().toLowerCase() === value.toLowerCase()) {
						value = $(this).val();
					}
				});

				if (bannedWords.includes(value.toLowerCase())) {
					$(this).after('<p id="bannedWordMsg">You cannot enter this value</p>');
					$(this).val('');
					return false;
				}

				// check to see if already entered interest
				var exists = false;
				for (let li of $(this).siblings('.variable_list').children('li')) {
					var liTxt = $(li).clone().children().remove().end().text();
					if (value === liTxt.substring(0, liTxt.length-1)) {
						exists = true;
					}
				}

				// if new interest, add to list
				if (!exists) {
					var li = $("<li>" + value + '<span class="close"> ×</span></li>');
					$(this).siblings('.variable_list').append(li);
					$(this).val('');
					// insert interest as hidden input with list attribute
					$(this).siblings('.variable_list').after('<input type="hidden" id="option_'+datatype+'" name="option_'+datatype+'[]" value="'+value+'">');

				// otherwise, show message
				} else {
					$(this).after('<div class="duplicate_msg">Interest already added!</div>');
					$(this).siblings('.duplicate_msg').css("color", "red");
					$(this).val('');
				}
				
			}
		}
	});

	// dialog css stuff, can be replaced in future css styles file
	// $('#confirmationDialog').css('position', 'absolute');
	// $("#confirmationDialog").css('z-index', 9999);
	// $('#confirmationDialog').css('background-color', 'white');
	// $('#confirmationDialog').css('border-style', 'outset');
	// $('#confirmationDialog').css('padding', '4vh');


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

	$('#submitButton').click(function() {
		$('.custom').each(function() {
			if ($(this).is(':checked')) {
				console.log($(this));
				$(this).val($(this).siblings('.custom_text').val());
			}
		});
		$('#editForm').submit();
	});

});