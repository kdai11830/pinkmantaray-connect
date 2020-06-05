// jQuery scripts for connect page

$(document).ready(function() {

	var socket = io();

	$("#connectForm").submit(function () {
		// put all grouped info in arrays
		var gender = [];
		$('input[name=option_gender]').each(function() {
			gender.push($(this).val());
		});
		var sexuality = [];
		$('input[name=option_sexuality]').each(function() {
			sexuality.push($(this).val());
		});
		var race = [];
		$('input[name=option_race]').each(function() {
			race.push($(this).val());
		});
		var religion = [];
		$('input[name=option_religion]').each(function() {
			religion.push($(this).val());
		});
		var interests = [];
		$('input[name=option_interest').each(function() {
			interests.push($(this).val());
		})

		// get the information from form and add to dict to pass to socket
		var emitVals = {
			"location": $('[name=option_location]').val(),
			"ageRange": [$('[name=option_age1]').val(), $('[name=option_age2]').val()],
			"gender": gender,
			"sexuality": sexuality,
			"race": race,
			"religion": religion,
			"interests": interests
		}

		// emit values to application.js with socket
		socket.emit('search', emitVals);
		return false;
	});


	// when receiving data back from backend display in table
	socket.on('searchResults', function(data) {
		
	})


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
					$("#interests_list").after('<input type="hidden" id="option_interest" name="option_interest[] value="' + interest + '">');

				// otherwise, show message
				} else {
					$(this).after('<div id="interests_message">Interest already added!</div>');
					$("#interests_message").css("color", "red");
					$(this).val('');
				}
				
			}
		}
	});


})