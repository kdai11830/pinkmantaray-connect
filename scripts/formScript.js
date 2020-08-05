	// file for jQuery functions

$(document).ready(function() {

	// console.log("JS SCRIPT RUNNING");

	var socket = io();

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

	var emailDupe = false;
	var usernameDupe = false;
	var instagramDupe = false;

	$('#consentLabel').click(function() {
		$('input[name="consent"]').prop('checked', !$('input[name="consent"]').prop('checked'));
	})

	var currentTab = 0;
	showTab(currentTab);

	function showTab(n) {
		$(".tab").hide();

		$(".tab:eq("+ n +")").show();
		// $(".tab:eq("+ n +")").css("display", "block");

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
		$('#email-notValid').remove();
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

		// validate password equality and email validity on second tab
		if (currentTab === 1) {
			if ($('#pwd').val() !== $('#confirm').val()) {
				valid = false;
				$('#pwd').css('border-color', 'red');
				$('#confirm').css('border-color','red');
				$(".tab:eq("+currentTab+")").append('<p id="pwd-notMatched">Passwords do not match!</p>');
				$('#pwd-notMatched').css('color', 'red');
			}

			if (!($('#entry_email').val().includes('@'))) {
				valid = false;
				$('#entry_email').css('border-color', 'red');
				$(".tab:eq("+currentTab+")").append('<p id="email-notValid">Please enter a valid email!</p>');
				$('#email-notValid').css('color', 'red');
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
	// hide state by default
	$("#select_state").prop('disabled','disabled');
	$("#select_country").change(function() {
		if ($("#select_country").val() == "USA") {
			$("#select_state").prop('disabled', false);
		} else {
			$('#select_state option')[0].selected = true;
			$("#select_state").prop('disabled','disabled');
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


	$('#select_language').change(function() {
		var value = $(this).val();

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
			$(this).siblings('.variable_list').after('<input type="hidden" id="entry_language" name="entry_language[]" value="'+value+'">');
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
					$(this).siblings('.variable_list').after('<input type="hidden" id="entry_'+datatype+'" name="entry_'+datatype+'[]" value="'+value+'">');

				// otherwise, reset field
				} else {
					$(this).val('');
				}
			}
		}
	})


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
				
				// prevent user from entering banned words
				if (bannedWords.includes(value.toLowerCase())) {
					$(this).after('<p id="bannedWordMsg">You cannot enter this value</p>');
					$(this).val('');
					return false;
				}

				// replace with capitalized version if exists
				var self = $(this);
				$(this).siblings('.select_list').children().each(function() {
					if ($(this).val().toLowerCase() === value.toLowerCase()) {
						value = $(this).val();
					}
				});

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
					$(this).siblings('.variable_list').after('<input type="hidden" id="entry_'+datatype+'" name="entry_'+datatype+'[]" value="'+value+'">');

				// otherwise, show message
				} else {
					// $(this).after('<div class="duplicate_msg">Interest already added!</div>');
					// $(this).siblings('.duplicate_msg').css("color", "red");
					$(this).val('');
				}
			}
		}
	});

	// allow for x "buttons" to close the parent element
	$(".variable_list").delegate(".close", "click", function() {
		// remove hidden input with corresponding value
		var liTxt = $(this).parent().clone().children().remove().end().text();
		liTxt = liTxt.substring(0, liTxt.length);
		var listID = $(this).parent().parent().siblings('input').attr('id');
		$('#entry_'+listID+'[value="' + liTxt + '"]').remove();	
		// remove li item
		$(this).parent().remove();
	});


	socket.on('checkedDuplicates', function(d) {
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